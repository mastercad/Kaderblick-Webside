<?php

namespace App\Repository;

use App\Entity\Message;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @template-extends ServiceEntityRepository<Message>
 */
class MessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Message::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function findNewMessages(User $user, int $limit = 5): array
    {
        return $this->createQueryBuilder('m')
            ->leftJoin('m.recipients', 'r')
            ->where('r.id = :userId')
            ->andWhere('m.readAt IS NULL')
            ->setParameter('userId', $user->getId())
            ->orderBy('m.sentAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * @return array<string, mixed>
     */
    public function findLatestForUser(User $user, int $limit = 5): array
    {
        return $this->createQueryBuilder('m')
            ->leftJoin('m.recipients', 'r')
            ->where('r.id = :userId')
            ->setParameter('userId', $user->getId())
            ->orderBy('m.sentAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Returns paginated inbox messages (all received messages, including replies)
     * for a user in chronological/flat mode.
     *
     * @return array{messages: Message[], total: int, hasMore: bool}
     */
    public function findInboxRoots(User $user, int $page = 1, int $limit = 30): array
    {
        $qb = $this->createQueryBuilder('m')
            ->where(':user MEMBER OF m.recipients')
            ->setParameter('user', $user)
            ->orderBy('m.sentAt', 'DESC');

        $total = (int) (clone $qb)->select('COUNT(m.id)')->getQuery()->getSingleScalarResult();

        $messages = $qb
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        return [
            'messages' => $messages,
            'total' => $total,
            'hasMore' => ($page * $limit) < $total,
        ];
    }

    /**
     * Returns paginated outbox messages (all sent messages, including replies)
     * for a user in chronological/flat mode.
     *
     * @return array{messages: Message[], total: int, hasMore: bool}
     */
    public function findOutboxRoots(User $user, int $page = 1, int $limit = 30): array
    {
        $qb = $this->createQueryBuilder('m')
            ->where('m.sender = :user')
            ->andWhere('m.parent IS NULL')
            ->setParameter('user', $user)
            ->orderBy('m.sentAt', 'DESC');

        $total = (int) (clone $qb)->select('COUNT(m.id)')->getQuery()->getSingleScalarResult();

        $messages = $qb
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        return [
            'messages' => $messages,
            'total' => $total,
            'hasMore' => ($page * $limit) < $total,
        ];
    }

    /**
     * Returns all messages belonging to a thread (identified by the thread-root).
     * Includes the root itself. Both sender and recipients of any message in the
     * thread must match the requesting user for access control purposes.
     *
     * @return Message[]
     */
    public function findThreadMessages(Message $threadRoot): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.thread = :root OR m.id = :rootId')
            ->setParameter('root', $threadRoot)
            ->setParameter('rootId', $threadRoot->getId())
            ->orderBy('m.sentAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Counts how many replies exist for a given thread root.
     */
    public function countThreadReplies(Message $threadRoot): int
    {
        return (int) $this->createQueryBuilder('m')
            ->select('COUNT(m.id)')
            ->where('m.thread = :root')
            ->setParameter('root', $threadRoot)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Returns paginated conversation roots for a user:
     * all thread-root messages where the user is sender OR recipient,
     * deduplicated, most-recent first.
     * Used by the unified thread view (combines inbox + outbox).
     *
     * @return array{messages: Message[], total: int, hasMore: bool}
     */
    public function findConversationRoots(User $user, int $page = 1, int $limit = 30): array
    {
        $qb = $this->createQueryBuilder('m')
            ->where('m.parent IS NULL')
            ->andWhere('m.sender = :user OR :user MEMBER OF m.recipients')
            ->setParameter('user', $user)
            ->orderBy('m.sentAt', 'DESC');

        $total = (int) (clone $qb)->select('COUNT(m.id)')->getQuery()->getSingleScalarResult();

        $messages = $qb
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        return [
            'messages' => $messages,
            'total' => $total,
            'hasMore' => ($page * $limit) < $total,
        ];
    }

    /**
     * Batch-loads reply counts for a set of thread-root IDs in a single query.
     *
     * @param int[] $rootIds
     *
     * @return array<int, int> rootId → replyCount
     */
    public function countRepliesForRoots(array $rootIds): array
    {
        if (empty($rootIds)) {
            return [];
        }

        $rows = $this->createQueryBuilder('m')
            ->select('IDENTITY(m.thread) AS rootId, COUNT(m.id) AS cnt')
            ->where('m.thread IN (:rootIds)')
            ->setParameter('rootIds', $rootIds)
            ->groupBy('m.thread')
            ->getQuery()
            ->getResult();

        $map = [];
        foreach ($rows as $row) {
            $map[(int) $row['rootId']] = (int) $row['cnt'];
        }

        return $map;
    }

    /**
     * For each thread-root ID, returns whether the given user has at least one
     * unread reply (parent IS NOT NULL, so root itself is excluded).
     * A reply is "unread" when the user is a recipient but has not yet acknowledged it.
     *
     * NOTE: Message::readBy is stored as a plain JSON column (not an ORM collection),
     * so we load reply objects and check isReadBy() in PHP rather than using DQL MEMBER OF.
     *
     * @param int[] $rootIds
     *
     * @return array<int, bool> rootId → hasUnreadReplies
     */
    public function countUnreadRepliesForRoots(User $user, array $rootIds): array
    {
        if (empty($rootIds)) {
            return [];
        }

        // Load all replies in these threads where the user is a recipient.
        // "readBy" is a plain JSON column (not an ORM collection), so we cannot
        // use MEMBER OF in DQL for it.  Instead we load the Message objects and
        // delegate to Message::isReadBy() which reads the JSON array in PHP.
        /** @var Message[] $replies */
        $replies = $this->createQueryBuilder('m')
            ->where('m.thread IN (:rootIds)')
            ->andWhere('m.parent IS NOT NULL')
            ->andWhere(':user MEMBER OF m.recipients')
            ->setParameter('rootIds', $rootIds)
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();

        $map = [];
        foreach ($replies as $reply) {
            $rootId = (int) $reply->getThread()->getId();
            if (!isset($map[$rootId])) {
                $map[$rootId] = false;
            }
            if (!$reply->isReadBy($user)) {
                $map[$rootId] = true;
            }
        }

        return $map;
    }
}
