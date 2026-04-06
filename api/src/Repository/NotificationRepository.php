<?php

namespace App\Repository;

use App\Entity\Notification;
use App\Entity\User;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @template-extends ServiceEntityRepository<Notification>
 */
class NotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

    /**
     * Find notifications for a specific user, ordered by creation date (newest first).
     *
     * @return Notification[]
     */
    public function findByUser(User $user, int $limit = 50): array
    {
        return $this->createQueryBuilder('n')
            ->where('n.user = :user')
            ->setParameter('user', $user)
            ->orderBy('n.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Find unread notifications for a specific user.
     *
     * @return Notification[]
     */
    public function findUnreadByUser(User $user): array
    {
        return $this->createQueryBuilder('n')
            ->where('n.user = :user')
            ->andWhere('n.isRead = false')
            ->setParameter('user', $user)
            ->orderBy('n.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find unsent notifications for a specific user.
     *
     * @return Notification[]
     */
    public function findUnsentByUser(User $user): array
    {
        return $this->createQueryBuilder('n')
            ->where('n.user = :user')
            ->andWhere('n.isSent = false')
            ->setParameter('user', $user)
            ->orderBy('n.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find unsent notifications (global, ordered by creation date).
     *
     * @return Notification[]
     */
    public function findUnsent(int $limit = 100): array
    {
        return $this->createQueryBuilder('n')
            ->where('n.isSent = false')
            ->orderBy('n.createdAt', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Count unread notifications for a user.
     */
    public function countUnreadByUser(User $user): int
    {
        return $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->where('n.user = :user')
            ->andWhere('n.isRead = false')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllAsReadForUser(User $user): int
    {
        return $this->createQueryBuilder('n')
            ->update()
            ->set('n.isRead', true)
            ->set('n.readAt', ':now')
            ->where('n.user = :user')
            ->andWhere('n.isRead = false')
            ->setParameter('user', $user)
            ->setParameter('now', new DateTimeImmutable())
            ->getQuery()
            ->execute();
    }

    /**
     * Delete old read notifications (older than specified days).
     */
    public function deleteOldReadNotifications(int $daysOld = 30): int
    {
        $cutoffDate = new DateTimeImmutable('-' . $daysOld . ' days');

        return $this->createQueryBuilder('n')
            ->delete()
            ->where('n.isRead = true')
            ->andWhere('n.createdAt < :cutoff')
            ->setParameter('cutoff', $cutoffDate)
            ->getQuery()
            ->execute();
    }

    /**
     * Find notifications by type for a user.
     *
     * @return Notification[]
     */
    public function findByUserAndType(User $user, string $type, int $limit = 20): array
    {
        return $this->createQueryBuilder('n')
            ->where('n.user = :user')
            ->andWhere('n.type = :type')
            ->setParameter('user', $user)
            ->setParameter('type', $type)
            ->orderBy('n.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Find all unread message-type notifications for a user that belong to a specific message.
     * The messageId is stored in the JSON data column: {"messageId": <id>, ...}.
     *
     * @return Notification[]
     */
    public function findUnreadMessageNotificationsByMessageId(User $user, int $messageId): array
    {
        // MySQL / MariaDB: JSON_UNQUOTE(JSON_EXTRACT(data, '$.messageId')) performs an exact lookup.
        // The cast to SIGNED avoids type mismatches between stored strings and integer keys.
        $conn = $this->getEntityManager()->getConnection();
        $sql = "SELECT id FROM notifications
                  WHERE user_id   = :userId
                    AND type      = 'message'
                    AND is_read   = 0
                    AND CAST(JSON_UNQUOTE(JSON_EXTRACT(data, '$.messageId')) AS SIGNED) = :messageId";

        $ids = array_column(
            $conn->executeQuery($sql, ['userId' => $user->getId(), 'messageId' => $messageId])
                 ->fetchAllAssociative(),
            'id'
        );

        if (empty($ids)) {
            return [];
        }

        return $this->createQueryBuilder('n')
            ->where('n.id IN (:ids)')
            ->setParameter('ids', $ids)
            ->getQuery()
            ->getResult();
    }

    /**
     * Get push delivery statistics for a user over the last N days.
     *
     * @return array{total: int, sent: int, unsent: int, failRate: float}
     */
    public function getPushDeliveryStats(User $user, int $days = 7): array
    {
        $since = new DateTimeImmutable('-' . $days . ' days');

        $total = (int) $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->where('n.user = :user')
            ->andWhere('n.createdAt >= :since')
            ->setParameter('user', $user)
            ->setParameter('since', $since)
            ->getQuery()
            ->getSingleScalarResult();

        $sent = (int) $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->where('n.user = :user')
            ->andWhere('n.createdAt >= :since')
            ->andWhere('n.isSent = true')
            ->setParameter('user', $user)
            ->setParameter('since', $since)
            ->getQuery()
            ->getSingleScalarResult();

        $unsent = $total - $sent;
        $failRate = $total > 0 ? round(($unsent / $total) * 100, 1) : 0.0;

        return [
            'total' => $total,
            'sent' => $sent,
            'unsent' => $unsent,
            'failRate' => $failRate,
        ];
    }

    /**
     * Find the last successfully sent notification for a user.
     */
    public function findLastSentForUser(User $user): ?Notification
    {
        return $this->createQueryBuilder('n')
            ->where('n.user = :user')
            ->andWhere('n.isSent = true')
            ->setParameter('user', $user)
            ->orderBy('n.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
