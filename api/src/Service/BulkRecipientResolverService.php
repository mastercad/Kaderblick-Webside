<?php

namespace App\Service;

use App\Entity\Club;
use App\Entity\Team;
use App\Entity\User;
use DateTimeImmutable;
use DateTimeInterface;

/**
 * Resolves bulk messaging targets (teams / clubs) to flat User lists.
 *
 * Supported roles:
 *   all     – players + coaches (default)
 *   players – only users whose own player record is assigned to the org
 *   coaches – only users assigned as coaches to the org
 *   parents – users who are parents/guardians of a player in the org
 */
class BulkRecipientResolverService
{
    public const ROLE_ALL = 'all';
    public const ROLE_PLAYERS = 'players';
    public const ROLE_COACHES = 'coaches';
    public const ROLE_PARENTS = 'parents';

    private const PARENT_IDENTIFIERS = ['parent', 'guardian', 'erziehungsberechtigter'];

    /** @return User[] de-duplicated list for a single team */
    public function resolveForTeam(Team $team, string $role, ?DateTimeImmutable $now = null): array
    {
        $now ??= new DateTimeImmutable();
        $users = [];

        if (in_array($role, [self::ROLE_ALL, self::ROLE_PLAYERS], true)) {
            foreach ($team->getPlayerTeamAssignments() as $pta) {
                if (!$this->isActive($pta->getStartDate(), $pta->getEndDate(), $now)) {
                    continue;
                }
                foreach ($pta->getPlayer()->getUserRelations() as $ur) {
                    if ($this->isParentRelation($ur->getRelationType()->getIdentifier())) {
                        continue;
                    }
                    $this->collectIfActive($ur->getUser(), $users);
                }
            }
        }

        if (in_array($role, [self::ROLE_ALL, self::ROLE_COACHES], true)) {
            foreach ($team->getCoachTeamAssignments() as $cta) {
                if (!$this->isActive($cta->getStartDate(), $cta->getEndDate(), $now)) {
                    continue;
                }
                foreach ($cta->getCoach()->getUserRelations() as $ur) {
                    $this->collectIfActive($ur->getUser(), $users);
                }
            }
        }

        if (self::ROLE_PARENTS === $role) {
            foreach ($team->getPlayerTeamAssignments() as $pta) {
                if (!$this->isActive($pta->getStartDate(), $pta->getEndDate(), $now)) {
                    continue;
                }
                foreach ($pta->getPlayer()->getUserRelations() as $ur) {
                    if (!$this->isParentRelation($ur->getRelationType()->getIdentifier())) {
                        continue;
                    }
                    $this->collectIfActive($ur->getUser(), $users);
                }
            }
        }

        return array_values($users);
    }

    /** @return User[] de-duplicated list for a single club */
    public function resolveForClub(Club $club, string $role, ?DateTimeImmutable $now = null): array
    {
        $now ??= new DateTimeImmutable();
        $users = [];

        if (in_array($role, [self::ROLE_ALL, self::ROLE_PLAYERS], true)) {
            foreach ($club->getPlayerClubAssignments() as $pca) {
                if (!$this->isActive($pca->getStartDate(), $pca->getEndDate(), $now)) {
                    continue;
                }
                foreach ($pca->getPlayer()->getUserRelations() as $ur) {
                    if ($this->isParentRelation($ur->getRelationType()->getIdentifier())) {
                        continue;
                    }
                    $this->collectIfActive($ur->getUser(), $users);
                }
            }
        }

        if (in_array($role, [self::ROLE_ALL, self::ROLE_COACHES], true)) {
            foreach ($club->getCoachClubAssignments() as $cca) {
                if (!$this->isActive($cca->getStartDate(), $cca->getEndDate(), $now)) {
                    continue;
                }
                foreach ($cca->getCoach()->getUserRelations() as $ur) {
                    $this->collectIfActive($ur->getUser(), $users);
                }
            }
        }

        if (self::ROLE_PARENTS === $role) {
            foreach ($club->getPlayerClubAssignments() as $pca) {
                if (!$this->isActive($pca->getStartDate(), $pca->getEndDate(), $now)) {
                    continue;
                }
                foreach ($pca->getPlayer()->getUserRelations() as $ur) {
                    if (!$this->isParentRelation($ur->getRelationType()->getIdentifier())) {
                        continue;
                    }
                    $this->collectIfActive($ur->getUser(), $users);
                }
            }
        }

        return array_values($users);
    }

    /**
     * Resolves multiple team targets and de-duplicates across all of them.
     *
     * @param array<array{teamId: int|string, role: string}> $targets
     * @param array<int, Team>                               $teamIndex id → Team
     *
     * @return User[]
     */
    public function resolveTeamTargets(array $targets, array $teamIndex, ?DateTimeImmutable $now = null): array
    {
        $users = [];
        foreach ($targets as $target) {
            $team = $teamIndex[(int) $target['teamId']] ?? null;
            if (!$team instanceof Team) {
                continue;
            }
            foreach ($this->resolveForTeam($team, $target['role'] ?? self::ROLE_ALL, $now) as $u) {
                $users[$u->getId()] = $u;
            }
        }

        return array_values($users);
    }

    /**
     * Resolves multiple club targets and de-duplicates across all of them.
     *
     * @param array<array{clubId: int|string, role: string}> $targets
     * @param array<int, Club>                               $clubIndex id → Club
     *
     * @return User[]
     */
    public function resolveClubTargets(array $targets, array $clubIndex, ?DateTimeImmutable $now = null): array
    {
        $users = [];
        foreach ($targets as $target) {
            $club = $clubIndex[(int) $target['clubId']] ?? null;
            if (!$club instanceof Club) {
                continue;
            }
            foreach ($this->resolveForClub($club, $target['role'] ?? self::ROLE_ALL, $now) as $u) {
                $users[$u->getId()] = $u;
            }
        }

        return array_values($users);
    }

    /**
     * @param array<int|string, User> $bucket
     *
     * @param-out array<int|string, User> $bucket
     */
    private function collectIfActive(User $user, array &$bucket): void
    {
        if ($user->isEnabled() && $user->isVerified()) {
            $bucket[$user->getId()] = $user;
        }
    }

    private function isParentRelation(string $identifier): bool
    {
        return in_array(strtolower($identifier), self::PARENT_IDENTIFIERS, true);
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
