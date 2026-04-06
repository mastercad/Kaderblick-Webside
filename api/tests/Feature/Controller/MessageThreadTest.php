<?php

namespace App\Tests\Feature\Controller;

use App\Entity\Message;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Tests für die Thread/Parent-Verknüpfung von Nachrichten.
 *
 * Nutzt ausschließlich Fixture-User (Gruppe "test"):
 *   user21@example.com – user25@example.com  →  ROLE_SUPERADMIN
 *
 * Superadmin-User werden für HTTP-POST-Aufrufe verwendet,
 * da unverknüpfte ROLE_USER ohne Team/Club nur an Superadmins schreiben dürfen.
 *
 * Authentifizierung über JWT-Bearer-Token (setServerParameter), damit die
 * Anmeldung bei allen Folge-Requests im selben Test erhalten bleibt.
 *
 * Abgedeckt:
 *  - POST ohne parentId → parent/thread bleiben null
 *  - POST mit gültiger parentId → parent und thread korrekt gesetzt
 *  - Mehrstufige Kette: A→B→C; C bekommt thread=A
 *  - POST mit nicht-existierender parentId → Fehler wird ignoriert (null)
 *  - POST mit nicht zugänglicher parentId → Fehler wird ignoriert (null)
 *  - GET /api/messages enthält immer parentId/threadId (null für Wurzeln)
 *  - GET /api/messages gibt korrekte parentId/threadId für Antworten zurück
 *  - GET /api/messages/outbox enthält parentId/threadId (null für Wurzeln)
 *  - GET /api/messages/outbox gibt korrekte parentId/threadId für Antworten zurück
 */
class MessageThreadTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $entityManager;
    private JWTTokenManagerInterface $jwtManager;

    protected function setUp(): void
    {
        self::ensureKernelShutdown();
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->entityManager = $container->get(EntityManagerInterface::class);
        $this->jwtManager = $container->get(JWTTokenManagerInterface::class);
    }

    // ── Erstellen ohne parentId ────────────────────────────────────────────────

    public function testCreateWithoutParentIdLeavesParentAndThreadNull(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $this->authenticateAs($sender);
        $this->postMessage($sender, [$recipient->getId()], 'thread-test-NoParent', 'Inhalt');

        $this->assertResponseIsSuccessful();

        $this->entityManager->clear();
        $message = $this->entityManager->getRepository(Message::class)
            ->findOneBy(['subject' => 'thread-test-NoParent']);

        $this->assertNotNull($message);
        $this->assertNull($message->getParent(), 'parent muss null sein wenn kein parentId gesendet wurde');
        $this->assertNull($message->getThread(), 'thread muss null sein wenn kein parentId gesendet wurde');
    }

    // ── Erstellen mit gültigem parentId ───────────────────────────────────────

    public function testCreateWithValidParentIdSetsParentAndThread(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        // Wurzelnachricht via ORM (kein Guard-Check)
        $root = $this->createMessage($sender, [$recipient], 'thread-test-Root-valid');

        // Empfänger antwortet per HTTP mit parentId
        $this->authenticateAs($recipient);
        $this->postMessage($recipient, [$sender->getId()], 'thread-test-Reply-valid', 'Antwort', $root->getId());

        $this->assertResponseIsSuccessful();

        $this->entityManager->clear();
        $reply = $this->entityManager->getRepository(Message::class)
            ->findOneBy(['subject' => 'thread-test-Reply-valid']);

        $this->assertNotNull($reply);
        $this->assertNotNull($reply->getParent());
        $this->assertSame($root->getId(), $reply->getParent()->getId());
        $this->assertNotNull($reply->getThread());
        $this->assertSame($root->getId(), $reply->getThread()->getId());
    }

    // ── Mehrstufige Kette (root → reply1 → reply2) ────────────────────────────

    public function testMultiLevelChainAllShareSameThreadRoot(): void
    {
        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');
        $userC = $this->getUser('user23@example.com');

        // Wurzelnachricht A→B
        $root = $this->createMessage($userA, [$userB], 'thread-test-ChainRoot');

        // Erste Antwort B→A (parentId = root)
        $this->authenticateAs($userB);
        $this->postMessage($userB, [$userA->getId()], 'thread-test-ChainReply1', 'Erste Antwort', $root->getId());
        $this->assertResponseIsSuccessful();

        $this->entityManager->clear();
        $reply1 = $this->entityManager->getRepository(Message::class)
            ->findOneBy(['subject' => 'thread-test-ChainReply1']);
        $this->assertNotNull($reply1);
        $this->assertSame($root->getId(), $reply1->getThread()->getId());

        // Zweite Antwort A→B+C (parentId = reply1); A neu laden da EM gecleart wurde
        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');
        $userC = $this->getUser('user23@example.com');
        $this->authenticateAs($userA);
        $this->postMessage($userA, [$userB->getId(), $userC->getId()], 'thread-test-ChainReply2', 'Zweite Antwort', $reply1->getId());
        $this->assertResponseIsSuccessful();

        $this->entityManager->clear();
        $reply2 = $this->entityManager->getRepository(Message::class)
            ->findOneBy(['subject' => 'thread-test-ChainReply2']);
        $this->assertNotNull($reply2);

        // parent = reply1
        $this->assertSame($reply1->getId(), $reply2->getParent()->getId());
        // thread = root (nicht reply1, da reply1.thread bereits = root ist)
        $this->assertSame(
            $root->getId(),
            $reply2->getThread()->getId(),
            'Tiefe Antwort muss den Thread-Root der gesamten Kette erben'
        );
    }

    // ── Dritte Tiefe: reply2 → reply3 ─────────────────────────────────────────

    public function testDepthThreeChainKeepsOriginalRoot(): void
    {
        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');

        $root = $this->createMessage($userA, [$userB], 'thread-test-D3Root');

        $this->authenticateAs($userB);
        $this->postMessage($userB, [$userA->getId()], 'thread-test-D3Reply1', 'B antwortet', $root->getId());
        $this->assertResponseIsSuccessful();

        $this->entityManager->clear();
        $reply1 = $this->entityManager->getRepository(Message::class)->findOneBy(['subject' => 'thread-test-D3Reply1']);
        $this->assertNotNull($reply1);

        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');
        $this->authenticateAs($userA);
        $this->postMessage($userA, [$userB->getId()], 'thread-test-D3Reply2', 'A antwortet', $reply1->getId());
        $this->assertResponseIsSuccessful();

        $this->entityManager->clear();
        $reply2 = $this->entityManager->getRepository(Message::class)->findOneBy(['subject' => 'thread-test-D3Reply2']);
        $this->assertNotNull($reply2);

        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');
        $this->authenticateAs($userB);
        $this->postMessage($userB, [$userA->getId()], 'thread-test-D3Reply3', 'B antwortet nochmals', $reply2->getId());
        $this->assertResponseIsSuccessful();

        $this->entityManager->clear();
        $reply3 = $this->entityManager->getRepository(Message::class)->findOneBy(['subject' => 'thread-test-D3Reply3']);
        $this->assertNotNull($reply3);

        // parent = reply2
        $this->assertSame($reply2->getId(), $reply3->getParent()->getId());
        // thread = root (drei Stufen tief noch korrekt)
        $this->assertSame(
            $root->getId(),
            $reply3->getThread()->getId(),
            'Auch in Tiefe 3 muss der Thread-Root korrekt gesetzt sein'
        );
    }

    // ── Nicht-existierende parentId → ignorieren ──────────────────────────────

    public function testCreateWithNonExistentParentIdIsIgnored(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $this->authenticateAs($sender);
        $this->client->request(
            'POST',
            '/api/messages',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode([
                'subject' => 'thread-test-NoExistParent',
                'content' => 'Inhalt',
                'recipientIds' => [$recipient->getId()],
                'parentId' => 999999, // existiert nicht
            ])
        );

        $this->assertResponseIsSuccessful();

        $this->entityManager->clear();
        $message = $this->entityManager->getRepository(Message::class)
            ->findOneBy(['subject' => 'thread-test-NoExistParent']);

        $this->assertNotNull($message);
        $this->assertNull($message->getParent(), 'Nicht-existierende parentId muss ignoriert werden');
        $this->assertNull($message->getThread(), 'Nicht-existierende parentId muss ignoriert werden');
    }

    // ── Nicht-zugängliche parentId → ignorieren ───────────────────────────────

    public function testCreateWithInaccessibleParentIdIsIgnored(): void
    {
        // outsider ist NICHT Sender/Empfänger von privateMsg → MessageVoter::VIEW verweigert Zugriff
        $outsider = $this->getUser('user21@example.com');
        $replyTarget = $this->getUser('user22@example.com');
        $privateA = $this->getUser('user23@example.com');
        $privateB = $this->getUser('user24@example.com');

        // Privates Gespräch zwischen privateA und privateB
        $privateMsg = $this->createMessage($privateA, [$privateB], 'thread-test-Private');

        // outsider versucht, auf eine Nachricht zu antworten, auf die er keinen Zugriff hat
        $this->authenticateAs($outsider);
        $this->client->request(
            'POST',
            '/api/messages',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode([
                'subject' => 'thread-test-IgnoredPrivateParent',
                'content' => 'Inhalt',
                'recipientIds' => [$replyTarget->getId()],
                'parentId' => $privateMsg->getId(),
            ])
        );

        $this->assertResponseIsSuccessful();

        $this->entityManager->clear();
        $message = $this->entityManager->getRepository(Message::class)
            ->findOneBy(['subject' => 'thread-test-IgnoredPrivateParent']);

        $this->assertNotNull($message);
        $this->assertNull($message->getParent(), 'parentId einer nicht zugänglichen Nachricht muss ignoriert werden');
        $this->assertNull($message->getThread(), 'thread einer nicht zugänglichen Nachricht muss ignoriert werden');
    }

    // ── GET /api/messages (Index) ──────────────────────────────────────────────

    public function testIndexAlwaysIncludesParentIdAndThreadIdKeys(): void
    {
        $user = $this->getUser('user21@example.com');
        $sender = $this->getUser('user22@example.com');

        $this->createMessage($sender, [$user], 'thread-test-IdxRoot');

        $this->authenticateAs($user);
        $this->client->request('GET', '/api/messages');

        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);

        $testMsg = $this->findMessageInList($data['messages'], 'thread-test-IdxRoot');
        $this->assertNotNull($testMsg, 'Die Testnachricht müsste in der Inbox sein');

        $this->assertArrayHasKey('parentId', $testMsg);
        $this->assertArrayHasKey('threadId', $testMsg);
        $this->assertNull($testMsg['parentId'], 'Wurzelnachricht hat parentId = null');
        $this->assertNull($testMsg['threadId'], 'Wurzelnachricht hat threadId = null');
    }

    public function testIndexReturnsCorrectParentIdAndThreadIdForDirectReply(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $root = $this->createMessage($sender, [$recipient], 'thread-test-IdxRoot2');

        // Empfänger antwortet
        $this->authenticateAs($recipient);
        $this->postMessage($recipient, [$sender->getId()], 'thread-test-IdxReply2', 'Antwort', $root->getId());
        $this->assertResponseIsSuccessful();

        // Im chrono/flat Inbox erscheinen alle empfangenen Nachrichten, auch Antworten.
        // Wir prüfen, dass die Antwort in der Inbox des Empfängers (sender) erscheint
        // und dort korrekte parentId/threadId liefert.
        $this->authenticateAs($sender);
        $this->client->request('GET', '/api/messages');
        $this->assertResponseIsSuccessful();

        $data = json_decode((string) $this->client->getResponse()->getContent(), true);
        $replyMsg = $this->findMessageInList($data['messages'], 'thread-test-IdxReply2');

        $this->assertNotNull($replyMsg, 'Antwort muss im chrono Inbox des Empfängers erscheinen');
        $this->assertSame($root->getId(), $replyMsg['parentId'], 'parentId muss Id der Wurzelnachricht sein');
        $this->assertSame($root->getId(), $replyMsg['threadId'], 'threadId muss Id der Wurzelnachricht sein');
    }

    public function testIndexRootMessageHasNullParentAndThread(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $this->createMessage($sender, [$recipient], 'thread-test-IdxRootOnly');

        // Empfänger sieht die Nachricht in der Inbox
        $this->authenticateAs($recipient);
        $this->client->request('GET', '/api/messages');
        $this->assertResponseIsSuccessful();

        $data = json_decode((string) $this->client->getResponse()->getContent(), true);
        $rootMsg = $this->findMessageInList($data['messages'], 'thread-test-IdxRootOnly');

        $this->assertNotNull($rootMsg);
        $this->assertNull($rootMsg['parentId']);
        $this->assertNull($rootMsg['threadId']);
    }

    // ── GET /api/messages/outbox ───────────────────────────────────────────────

    public function testOutboxAlwaysIncludesParentIdAndThreadIdKeys(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');

        $this->createMessage($sender, [$recipient], 'thread-test-OutboxRoot');

        $this->authenticateAs($sender);
        $this->client->request('GET', '/api/messages/outbox');

        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);

        $msg = $this->findMessageInList($data['messages'], 'thread-test-OutboxRoot');
        $this->assertNotNull($msg, 'Testnachricht muss im Postausgang erscheinen');

        $this->assertArrayHasKey('parentId', $msg);
        $this->assertArrayHasKey('threadId', $msg);
        $this->assertNull($msg['parentId'], 'Wurzelnachricht hat parentId = null in outbox');
        $this->assertNull($msg['threadId'], 'Wurzelnachricht hat threadId = null in outbox');
    }

    public function testOutboxReturnsCorrectParentIdAndThreadIdForReply(): void
    {
        $userA = $this->getUser('user21@example.com');
        $userB = $this->getUser('user22@example.com');

        $root = $this->createMessage($userA, [$userB], 'thread-test-OutboxRoot2');

        // userB antwortet
        $this->authenticateAs($userB);
        $this->postMessage($userB, [$userA->getId()], 'thread-test-OutboxReply', 'Antwort', $root->getId());
        $this->assertResponseIsSuccessful();

        // Mit der neuen paginierten Architektur liefert GET /api/messages/outbox nur noch
        // Roots (parent IS NULL). Die Antwort von userB hat einen parent und erscheint daher
        // NICHT im Outbox-Root-Index von userB.
        $this->client->request('GET', '/api/messages/outbox');
        $this->assertResponseIsSuccessful();

        $data = json_decode((string) $this->client->getResponse()->getContent(), true);
        $replyInOutboxRoots = $this->findMessageInList($data['messages'], 'thread-test-OutboxReply');
        $this->assertNull($replyInOutboxRoots, 'Antwort darf nicht als Root im Outbox-Index erscheinen');

        // Die Antwort muss im Thread-Endpoint des Threads korrekte parentId/threadId haben.
        // userA kann den Thread öffnen (ist Sender des Roots).
        $this->authenticateAs($userA);
        $this->client->request('GET', '/api/messages/thread/' . $root->getId());
        $this->assertResponseIsSuccessful();

        $threadData = json_decode((string) $this->client->getResponse()->getContent(), true);
        $replyMsg = $this->findMessageInList($threadData['messages'], 'thread-test-OutboxReply');

        $this->assertNotNull($replyMsg, 'Antwort muss im Thread-Endpoint erscheinen');
        $this->assertSame($root->getId(), $replyMsg['parentId']);
        $this->assertSame($root->getId(), $replyMsg['threadId']);
    }

    // ── Authentifizierung ─────────────────────────────────────────────────────

    public function testCreateWithParentIdRequiresAuthentication(): void
    {
        $sender = $this->getUser('user21@example.com');
        $recipient = $this->getUser('user22@example.com');
        $root = $this->createMessage($sender, [$recipient], 'thread-test-AuthRoot');

        // Kein Auth-Header → 401
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->client->request(
            'POST',
            '/api/messages',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode([
                'subject' => 'thread-test-AuthReply',
                'content' => 'Inhalt',
                'recipientIds' => [$sender->getId()],
                'parentId' => $root->getId(),
            ])
        );

        $this->assertResponseStatusCodeSame(401);
    }

    // ── Hilfsmethoden ─────────────────────────────────────────────────────────

    private function getUser(string $email): User
    {
        $user = $this->entityManager->getRepository(User::class)->findOneBy(['email' => $email]);
        self::assertNotNull($user, sprintf(
            'Fixture-User "%s" nicht gefunden. Fixtures laden: --group=test',
            $email
        ));

        return $user;
    }

    /**
     * Setzt den JWT-Bearer-Token für alle nachfolgenden Requests des Clients.
     * Bleibt aktiv bis zum nächsten authenticateAs()-Aufruf.
     */
    private function authenticateAs(User $user): void
    {
        $token = $this->jwtManager->create($user);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer ' . $token);
    }

    /**
     * @param array<int> $recipientIds
     */
    private function postMessage(User $sender, array $recipientIds, string $subject, string $content, ?int $parentId = null): void
    {
        $body = [
            'subject' => $subject,
            'content' => $content,
            'recipientIds' => $recipientIds,
        ];
        if (null !== $parentId) {
            $body['parentId'] = $parentId;
        }

        $this->client->request(
            'POST',
            '/api/messages',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($body)
        );
    }

    /**
     * @param array<User> $recipients
     */
    private function createMessage(User $sender, array $recipients, string $subject): Message
    {
        $message = new Message();
        $message->setSender($sender);
        $message->setSubject($subject);
        $message->setContent('Test-Inhalt');
        foreach ($recipients as $recipient) {
            $message->addRecipient($recipient);
        }
        $this->entityManager->persist($message);
        $this->entityManager->flush();

        return $message;
    }

    /**
     * Sucht eine Nachricht in einer Liste anhand des Betreffs.
     *
     * @param array<array<string, mixed>> $list
     *
     * @return array<string, mixed>|null
     */
    private function findMessageInList(array $list, string $subject): ?array
    {
        foreach ($list as $item) {
            if (($item['subject'] ?? '') === $subject) {
                return $item;
            }
        }

        return null;
    }

    protected function tearDown(): void
    {
        $connection = $this->entityManager->getConnection();

        // FK-Referenzen nullifizieren, um Constraint-Verletzungen zu vermeiden
        $connection->executeStatement(
            'UPDATE messages SET parent_id = NULL, thread_id = NULL WHERE subject LIKE "thread-test-%"'
        );
        // Empfänger-Verknüpfungen löschen
        $connection->executeStatement(
            'DELETE FROM message_recipients WHERE message_id IN (SELECT id FROM messages WHERE subject LIKE "thread-test-%")'
        );
        // Testnachrichten bereinigen (Fixture-User bleiben unangetastet)
        $connection->executeStatement('DELETE FROM messages WHERE subject LIKE "thread-test-%"');

        $this->entityManager->close();

        parent::tearDown();
        restore_exception_handler();
    }
}
