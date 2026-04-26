<?php

namespace App\EventListener;

use App\Entity\Coach;
use App\Entity\CoachClubAssignment;
use App\Entity\Player;
use App\Entity\PlayerClubAssignment;
use App\Repository\WatchlistRepository;
use App\Service\NotificationService;
use DateTime;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PostFlushEventArgs;
use Doctrine\ORM\Event\PostUpdateEventArgs;
use Doctrine\ORM\Events;

/**
 * Sends watchlist notifications when a club assignment's endDate is set or changed.
 *
 * Pattern:
 *   postUpdate – detect endDate change, buffer the assignment entity.
 *   postFlush  – clear the buffer FIRST, then send notifications (which internally
 *                call flush again). Clearing first prevents infinite recursion.
 */
#[AsDoctrineListener(event: Events::postUpdate)]
#[AsDoctrineListener(event: Events::postFlush)]
class WatchlistNotificationListener
{
    /** @var array<int, PlayerClubAssignment|CoachClubAssignment> */
    private array $pending = [];

    public function __construct(
        private WatchlistRepository $watchlistRepository,
        private NotificationService $notificationService
    ) {
    }

    public function postUpdate(PostUpdateEventArgs $args): void
    {
        $entity = $args->getObject();

        if (!($entity instanceof PlayerClubAssignment) && !($entity instanceof CoachClubAssignment)) {
            return;
        }

        $changeSet = $args->getObjectManager()->getUnitOfWork()->getEntityChangeSet($entity);

        if (!array_key_exists('endDate', $changeSet)) {
            return;
        }

        $endDateChange = $changeSet['endDate'];
        assert(is_array($endDateChange));
        [$old, $new] = $endDateChange;

        // Only notify when endDate is newly set or materially changed (not when cleared).
        if (null !== $new && $old !== $new) {
            $this->pending[] = $entity;
        }
    }

    public function postFlush(PostFlushEventArgs $args): void
    {
        if (empty($this->pending)) {
            return;
        }

        // Clear BEFORE processing — the notification service calls flush() internally,
        // which triggers postFlush again. An empty buffer makes that a no-op.
        $pending = $this->pending;
        $this->pending = [];

        $now = new DateTime('today');

        foreach ($pending as $entity) {
            if ($entity instanceof PlayerClubAssignment) {
                $this->handlePlayerClubAssignment($entity, $now);
            } elseif ($entity instanceof CoachClubAssignment) {
                $this->handleCoachClubAssignment($entity, $now);
            }
        }
    }

    private function handlePlayerClubAssignment(PlayerClubAssignment $assignment, DateTime $now): void
    {
        $player = $assignment->getPlayer();
        if (null === $player) {
            return;
        }

        $watchers = $this->watchlistRepository->findWatcherUsersForPlayer($player);
        if (empty($watchers)) {
            return;
        }

        $firstName = $player->getFirstName();
        $lastName = $player->getLastName();
        $clubName = $assignment->getClub()->getName();
        $endDateStr = $assignment->getEndDate()?->format('d.m.Y');

        if ($this->isNowFreeAgent($player, $now)) {
            $this->notificationService->createNotificationForUsers(
                $watchers,
                'watchlist_player_free',
                sprintf('%s %s ist jetzt vereinslos', $firstName, $lastName),
                sprintf('%s %s hat keine aktive Vereinszugehörigkeit mehr.', $firstName, $lastName),
                ['type' => 'player', 'playerId' => $player->getId()]
            );
        } else {
            $this->notificationService->createNotificationForUsers(
                $watchers,
                'watchlist_player_club_ending',
                sprintf('%s %s – Vereinswechsel angekündigt', $firstName, $lastName),
                sprintf(
                    'Die Vereinszugehörigkeit von %s %s bei %s endet am %s.',
                    $firstName,
                    $lastName,
                    $clubName,
                    $endDateStr
                ),
                ['type' => 'player', 'playerId' => $player->getId()]
            );
        }
    }

    private function handleCoachClubAssignment(CoachClubAssignment $assignment, DateTime $now): void
    {
        $coach = $assignment->getCoach();
        if (null === $coach) {
            return;
        }

        $watchers = $this->watchlistRepository->findWatcherUsersForCoach($coach);
        if (empty($watchers)) {
            return;
        }

        $firstName = $coach->getFirstName();
        $lastName = $coach->getLastName();
        $clubName = $assignment->getClub()->getName();
        $endDateStr = $assignment->getEndDate()?->format('d.m.Y');

        if ($this->isCoachNowFreeAgent($coach, $now)) {
            $this->notificationService->createNotificationForUsers(
                $watchers,
                'watchlist_coach_free',
                sprintf('%s %s ist jetzt vereinslos', $firstName, $lastName),
                sprintf('%s %s hat keine aktive Vereinszugehörigkeit mehr.', $firstName, $lastName),
                ['type' => 'coach', 'coachId' => $coach->getId()]
            );
        } else {
            $this->notificationService->createNotificationForUsers(
                $watchers,
                'watchlist_coach_club_ending',
                sprintf('%s %s – Vereinswechsel angekündigt', $firstName, $lastName),
                sprintf(
                    'Die Vereinszugehörigkeit von %s %s bei %s endet am %s.',
                    $firstName,
                    $lastName,
                    $clubName,
                    $endDateStr
                ),
                ['type' => 'coach', 'coachId' => $coach->getId()]
            );
        }
    }

    private function isNowFreeAgent(Player $player, DateTime $now): bool
    {
        foreach ($player->getPlayerClubAssignments() as $pca) {
            if (null === $pca->getEndDate() || $pca->getEndDate() > $now) {
                return false;
            }
        }

        return true;
    }

    private function isCoachNowFreeAgent(Coach $coach, DateTime $now): bool
    {
        foreach ($coach->getCoachClubAssignments() as $cca) {
            if (null === $cca->getEndDate() || $cca->getEndDate() > $now) {
                return false;
            }
        }

        return true;
    }
}
