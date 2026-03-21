<?php

namespace App\Controller;

use App\Entity\Message;
use App\Entity\MessageGroup;
use App\Entity\User;
use App\Security\Voter\MessageVoter;
use App\Service\NotificationService;
use App\Service\UserContactService;
use Doctrine\Common\Collections\Criteria;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class MessageController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private NotificationService $notificationService,
        private UserContactService $userContactService
    ) {
    }

    #[Route('/messages', name: 'messages_index', methods: ['GET'])]
    public function inbox(): Response
    {
        return $this->render('messages/index.html.twig');
    }

    #[Route('/api/messages', name: 'api_messages_index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        /** @var User $user */
        $messages = $this->entityManager->getRepository(Message::class)
            ->createQueryBuilder('m')
            ->where(':user MEMBER OF m.recipients')
            ->setParameter('user', $user)
            ->orderBy('m.sentAt', 'DESC')
            ->getQuery()
            ->getResult();

        $messages = array_filter($messages, fn ($m) => $this->isGranted(MessageVoter::VIEW, $m));

        return $this->json([
            'messages' => array_map(fn (Message $message) => [
                'id' => $message->getId(),
                'subject' => $message->getSubject(),
                'sender' => $message->getSender()->getFullName(),
                'senderId' => $message->getSender()->getId(),
                'senderIsSuperAdmin' => in_array('ROLE_SUPERADMIN', $message->getSender()->getRoles(), true),
                'sentAt' => $message->getSentAt()->format('Y-m-d H:i:s'),
                'isRead' => $message->isReadBy($user),
            ], $messages),
        ]);
    }

    #[Route('/api/messages/unread-count', name: 'api_messages_unread_count', methods: ['GET'])]
    public function unreadCount(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        /** @var User $user */
        $messages = $this->entityManager->getRepository(Message::class)
            ->createQueryBuilder('m')
            ->select('m')
            ->where(':user MEMBER OF m.recipients')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();

        $count = count(array_filter($messages, function (Message $message) use ($user) {
            return !$message->isReadBy($user);
        }));

        return $this->json(['count' => $count]);
    }

    #[Route('/api/messages/{id}', name: 'api_messages_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(Message $message): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        /** @var User $user */
        $user = $this->getUser();
        if (!$this->isGranted(MessageVoter::VIEW, $message)) {
            return $this->json(['error' => 'Zugriff verweigert'], 403);
        }

        if (!$message->isReadBy($user)) {
            $message->markAsRead($user);
            $this->entityManager->flush();
        }

        return $this->json([
            'id' => $message->getId(),
            'subject' => $message->getSubject(),
            'content' => $message->getContent(),
            'sender' => $message->getSender()->getFullName(),
            'senderId' => $message->getSender()->getId(),
            'senderIsSuperAdmin' => in_array('ROLE_SUPERADMIN', $message->getSender()->getRoles(), true),
            'recipients' => array_map(fn (User $u) => [
                'id' => $u->getId(),
                'name' => $u->getFullName(),
            ], $message->getRecipients()->toArray()),
            'sentAt' => $message->getSentAt()->format('Y-m-d H:i:s'),
            'isRead' => $message->isReadBy($user),
        ]);
    }

    #[Route('/api/messages', name: 'api_messages_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        /** @var User $user */
        $data = json_decode($request->getContent(), true);

        // Unverknüpfte User (ohne Team/Club-Zugehörigkeit, kein Superadmin) dürfen nur an Superadmins schreiben
        $myContext = $this->userContactService->collectMyTeamsAndClubs($user);
        if (!$this->isGranted('ROLE_SUPERADMIN') && empty($myContext['teamIds']) && empty($myContext['clubIds'])) {
            $recipientIds = $data['recipientIds'] ?? [];
            if (!empty($recipientIds)) {
                $recipients = $this->entityManager->getRepository(User::class)->findBy(['id' => $recipientIds]);
                foreach ($recipients as $recipient) {
                    if (!in_array('ROLE_SUPERADMIN', $recipient->getRoles(), true)) {
                        return $this->json([
                            'error' => 'Du kannst nur Nachrichten an Administratoren senden, solange dein Konto nicht mit einem Spieler oder Trainer verknüpft ist.',
                        ], 403);
                    }
                }
            }
        }

        $message = new Message();
        $message->setSender($user);
        $message->setSubject($data['subject']);
        $message->setContent($data['content']);

        if (!empty($data['recipientIds'])) {
            $criteria = Criteria::create()
                ->where(Criteria::expr()->in('id', $data['recipientIds']));

            $recipients = $this->entityManager->getRepository(User::class)
                ->matching($criteria);

            foreach ($recipients as $recipient) {
                $message->addRecipient($recipient);
            }
        }

        if (!empty($data['groupId'])) {
            $criteria = Criteria::create()
                ->where(Criteria::expr()->in('id', $data['recipientIds']));

            $group = $this->entityManager->getRepository(MessageGroup::class)
                ->find($data['groupId']);

            if ($group) {
                foreach ($group->getMembers() as $member) {
                    $message->addRecipient($member);
                }
            }
        }

        $this->entityManager->persist($message);
        $this->entityManager->flush();

        // Create notifications for message recipients
        foreach ($message->getRecipients() as $recipient) {
            $this->notificationService->createMessageNotification(
                $recipient,
                $user->getFullName(),
                $message->getSubject(),
                $message->getId()
            );
        }

        return $this->json(['message' => 'Nachricht gesendet']);
    }

    #[Route('/api/messages/outbox', name: 'api_messages_outbox', methods: ['GET'])]
    public function retrieveSendMessage(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        /** @var User $user */
        $messages = $this->entityManager->getRepository(Message::class)
            ->createQueryBuilder('m')
            ->where('m.sender = :user')
            ->setParameter('user', $user)
            ->orderBy('m.sentAt', 'DESC')
            ->getQuery()
            ->getResult();

        return $this->json([
            'messages' => array_map(fn (Message $message) => [
                'id' => $message->getId(),
                'subject' => $message->getSubject(),
                'sender' => $message->getSender()->getFullName(),
                'sentAt' => $message->getSentAt()->format('Y-m-d H:i:s'),
                'isRead' => $message->isReadBy($user),
                'recipients' => array_map(
                    fn (User $u) => ['id' => $u->getId(), 'name' => $u->getFullName()],
                    $message->getRecipients()->toArray()
                ),
            ], $messages),
        ]);
    }

    /**
     * DELETE /api/messages/{id}.
     *
     * Sender:    deletes the message entirely.
     * Recipient: removes themselves from the recipient list (inbox-only delete).
     */
    #[Route('/api/messages/{id}', name: 'api_messages_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $message = $this->entityManager->getRepository(Message::class)->find($id);
        if (!$message) {
            return $this->json(['message' => 'Nicht gefunden'], 404);
        }

        if ($message->getSender() === $user) {
            // Sender deletes the whole message
            $this->entityManager->remove($message);
        } elseif ($message->getRecipients()->contains($user)) {
            // Recipient removes themselves (hides message from their inbox)
            $message->removeRecipient($user);
        } else {
            return $this->json(['message' => 'Forbidden'], 403);
        }

        $this->entityManager->flush();

        return $this->json(['message' => 'Nachricht gelöscht'], 200);
    }
}
