<?php

namespace App\Service;

use App\Entity\User;
use App\Entity\UserRelation;
use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Determines which users are "reachable contacts" of a given user.
 *
 * Two users are contacts when they share an active team or club membership via
 * any of the four assignment paths:
 *   - PlayerTeamAssignment
 *   - PlayerClubAssignment
 *   - CoachTeamAssignment
 *   - CoachClubAssignment
 *
 * Every assignment's own start/end dates are respected.
 * A UserRelation is considered active when at least one of its underlying
 * assignments is currently active.
 *
 * This service is intentionally stateless and reusable across controllers,
 * voters, notification services, etc.
 */
class UserContactService
{
    public function __construct(private EntityManagerInterface $entityManager)
    {
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Returns ALL enabled/verified users except $me – for ROLE_SUPERADMIN.
     * Each entry carries a human-readable `context` string (role + team/club)
     * built from the user's own active assignments.
     *
     * @return array<int, array{id: int, fullName: string, context: string}>
     */
    public function findAllUsers(User $me): array
    {
        /** @var UserRelation[] $allRelations */
        $allRelations = $this->entityManager->createQueryBuilder()
            ->select('ur, u, p, co')
            ->from(UserRelation::class, 'ur')
            ->join('ur.user', 'u')
            ->leftJoin('ur.player', 'p')
            ->leftJoin('ur.coach', 'co')
            ->where('u != :me')
            ->andWhere('u.isEnabled = true')
            ->andWhere('u.isVerified = true')
            ->setParameter('me', $me)
            ->getQuery()
            ->getResult();

        $now = new DateTimeImmutable();

        /** @var array<int, array{id: int, fullName: string, contexts: string[]}> $byUser */
        $byUser = [];

        foreach ($allRelations as $relation) {
            $uid = $relation->getUser()->getId();

            if (!isset($byUser[$uid])) {
                $byUser[$uid] = [
                    'id' => $uid,
                    'fullName' => $relation->getUser()->getFullName(),
                    'contexts' => [],
                ];
            }

            if (null !== $relation->getPlayer()) {
                foreach ($relation->getPlayer()->getPlayerTeamAssignments() as $pta) {
                    if ($this->isActive($pta->getStartDate(), $pta->getEndDate(), $now)) {
                        $byUser[$uid]['contexts'][] = 'Spieler · ' . $pta->getTeam()->getName();
                    }
                }
                foreach ($relation->getPlayer()->getPlayerClubAssignments() as $pca) {
                    if ($pca->getClub() && $this->isActive($pca->getStartDate(), $pca->getEndDate(), $now)) {
                        $byUser[$uid]['contexts'][] = 'Spieler · ' . $pca->getClub()->getName();
                    }
                }
            }

            if (null !== $relation->getCoach()) {
                foreach ($relation->getCoach()->getCoachTeamAssignments() as $cta) {
                    if ($this->isActive($cta->getStartDate(), $cta->getEndDate(), $now)) {
                        $byUser[$uid]['contexts'][] = 'Trainer · ' . $cta->getTeam()->getName();
                    }
                }
                foreach ($relation->getCoach()->getCoachClubAssignments() as $cca) {
                    if ($cca->getClub() && $this->isActive($cca->getStartDate(), $cca->getEndDate(), $now)) {
                        $byUser[$uid]['contexts'][] = 'Trainer · ' . $cca->getClub()->getName();
                    }
                }
            }
        }

        // Also include users without any UserRelation (they get an empty context)
        /** @var User[] $allUsers */
        $allUsers = $this->entityManager->getRepository(User::class)
            ->createQueryBuilder('u')
            ->where('u != :me')
            ->andWhere('u.isEnabled = true')
            ->andWhere('u.isVerified = true')
            ->setParameter('me', $me)
            ->getQuery()
            ->getResult();

        foreach ($allUsers as $u) {
            if (!isset($byUser[$u->getId()])) {
                $byUser[$u->getId()] = [
                    'id' => $u->getId(),
                    'fullName' => $u->getFullName(),
                    'contexts' => [],
                ];
            }
        }

        $result = array_map(static fn (array $u) => [
            'id' => $u['id'],
            'fullName' => $u['fullName'],
            'context' => implode(' | ', array_values(array_unique($u['contexts']))),
        ], array_values($byUser));

        usort($result, static fn ($a, $b) => strcmp($a['fullName'], $b['fullName']));

        return $result;
    }

    /**
     * Returns all active team and club IDs that $user belongs to.
     *
     * @return array{teamIds: array<int,string>, clubIds: array<int,string>}
     */
    public function collectMyTeamsAndClubs(User $user, ?DateTimeImmutable $now = null): array
    {
        $now ??= new DateTimeImmutable();
        $teamIds = [];
        $clubIds = [];

        foreach ($user->getUserRelations() as $relation) {
            if (!$this->isRelationActive($relation, $now)) {
                continue;
            }

            if (null !== $relation->getPlayer()) {
                foreach ($relation->getPlayer()->getPlayerTeamAssignments() as $pta) {
                    if ($this->isActive($pta->getStartDate(), $pta->getEndDate(), $now)) {
                        $teamIds[$pta->getTeam()->getId()] = $pta->getTeam()->getName();
                    }
                }
                foreach ($relation->getPlayer()->getPlayerClubAssignments() as $pca) {
                    if ($pca->getClub() && $this->isActive($pca->getStartDate(), $pca->getEndDate(), $now)) {
                        $clubIds[$pca->getClub()->getId()] = $pca->getClub()->getName();
                    }
                }
            }

            if (null !== $relation->getCoach()) {
                foreach ($relation->getCoach()->getCoachTeamAssignments() as $cta) {
                    if ($this->isActive($cta->getStartDate(), $cta->getEndDate(), $now)) {
                        $teamIds[$cta->getTeam()->getId()] = $cta->getTeam()->getName();
                    }
                }
                foreach ($relation->getCoach()->getCoachClubAssignments() as $cca) {
                    if ($cca->getClub() && $this->isActive($cca->getStartDate(), $cca->getEndDate(), $now)) {
                        $clubIds[$cca->getClub()->getId()] = $cca->getClub()->getName();
                    }
                }
            }
        }

        return ['teamIds' => $teamIds, 'clubIds' => $clubIds];
    }

    /**
     * Returns a de-duplicated list of users that share at least one active
     * team or club with $me. Each entry carries a human-readable `context`
     * string (role + organisation) to disambiguate users with identical names.
     *
     * @return array<int, array{id: int, fullName: string, context: string}>
     */
    public function findContacts(User $me, ?DateTimeImmutable $now = null): array
    {
        $now ??= new DateTimeImmutable();

        ['teamIds' => $myTeamIds, 'clubIds' => $myClubIds] =
            $this->collectMyTeamsAndClubs($me, $now);

        if ([] === $myTeamIds && [] === $myClubIds) {
            return [];
        }

        /** @var UserRelation[] $otherRelations */
        $otherRelations = $this->entityManager->createQueryBuilder()
            ->select('ur, u, p, co')
            ->from(UserRelation::class, 'ur')
            ->join('ur.user', 'u')
            ->leftJoin('ur.player', 'p')
            ->leftJoin('ur.coach', 'co')
            ->where('u != :me')
            ->andWhere('u.isEnabled = true')
            ->andWhere('u.isVerified = true')
            ->setParameter('me', $me)
            ->getQuery()
            ->getResult();

        /** @var array<int, array{id:int, fullName:string, contexts:string[]}> $contacts */
        $contacts = [];

        foreach ($otherRelations as $relation) {
            $shared = $this->collectSharedContexts($relation, $myTeamIds, $myClubIds, $now);

            if ([] === $shared) {
                continue;
            }

            $uid = $relation->getUser()->getId();

            if (!isset($contacts[$uid])) {
                $contacts[$uid] = [
                    'id' => $uid,
                    'fullName' => $relation->getUser()->getFullName(),
                    'contexts' => $shared,
                ];
            } else {
                $contacts[$uid]['contexts'] = array_values(array_unique(
                    array_merge($contacts[$uid]['contexts'], $shared)
                ));
            }
        }

        $result = array_map(
            static fn (array $c) => [
                'id' => $c['id'],
                'fullName' => $c['fullName'],
                'context' => implode(' | ', $c['contexts']),
            ],
            array_values($contacts)
        );

        usort($result, static fn ($a, $b) => strcmp($a['fullName'], $b['fullName']));

        return $result;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Collects context strings for $relation that overlap with $myTeamIds/$myClubIds.
     *
     * @param array<int,string> $myTeamIds
     * @param array<int,string> $myClubIds
     *
     * @return string[]
     */
    public function collectSharedContexts(
        UserRelation $relation,
        array $myTeamIds,
        array $myClubIds,
        ?DateTimeImmutable $now = null,
    ): array {
        $now ??= new DateTimeImmutable();
        $shared = [];

        if (null !== $relation->getPlayer()) {
            foreach ($relation->getPlayer()->getPlayerTeamAssignments() as $pta) {
                if (
                    isset($myTeamIds[$pta->getTeam()->getId()])
                    && $this->isActive($pta->getStartDate(), $pta->getEndDate(), $now)
                ) {
                    $shared[] = 'Spieler · ' . $pta->getTeam()->getName();
                }
            }
            foreach ($relation->getPlayer()->getPlayerClubAssignments() as $pca) {
                if (
                    $pca->getClub()
                    && isset($myClubIds[$pca->getClub()->getId()])
                    && $this->isActive($pca->getStartDate(), $pca->getEndDate(), $now)
                ) {
                    $shared[] = 'Spieler · ' . $pca->getClub()->getName();
                }
            }
        }

        if (null !== $relation->getCoach()) {
            foreach ($relation->getCoach()->getCoachTeamAssignments() as $cta) {
                if (
                    isset($myTeamIds[$cta->getTeam()->getId()])
                    && $this->isActive($cta->getStartDate(), $cta->getEndDate(), $now)
                ) {
                    $shared[] = 'Trainer · ' . $cta->getTeam()->getName();
                }
            }
            foreach ($relation->getCoach()->getCoachClubAssignments() as $cca) {
                if (
                    $cca->getClub()
                    && isset($myClubIds[$cca->getClub()->getId()])
                    && $this->isActive($cca->getStartDate(), $cca->getEndDate(), $now)
                ) {
                    $shared[] = 'Trainer · ' . $cca->getClub()->getName();
                }
            }
        }

        return $shared;
    }

    private function isRelationActive(UserRelation $relation, DateTimeImmutable $now): bool
    {
        if (null !== $relation->getPlayer()) {
            foreach ($relation->getPlayer()->getPlayerTeamAssignments() as $pta) {
                if ($this->isActive($pta->getStartDate(), $pta->getEndDate(), $now)) {
                    return true;
                }
            }
            foreach ($relation->getPlayer()->getPlayerClubAssignments() as $pca) {
                if ($this->isActive($pca->getStartDate(), $pca->getEndDate(), $now)) {
                    return true;
                }
            }
        }

        if (null !== $relation->getCoach()) {
            foreach ($relation->getCoach()->getCoachTeamAssignments() as $cta) {
                if ($this->isActive($cta->getStartDate(), $cta->getEndDate(), $now)) {
                    return true;
                }
            }
            foreach ($relation->getCoach()->getCoachClubAssignments() as $cca) {
                if ($this->isActive($cca->getStartDate(), $cca->getEndDate(), $now)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function isActive(
        ?DateTimeInterface $start,
        ?DateTimeInterface $end,
        DateTimeImmutable $now,
    ): bool {
        return (null === $start || $start <= $now)
            && (null === $end || $end >= $now);
    }
}
