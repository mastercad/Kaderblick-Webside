<?php

namespace App\Tests\Unit\Service;

use App\Entity\Club;
use App\Entity\Coach;
use App\Entity\CoachClubAssignment;
use App\Entity\CoachTeamAssignment;
use App\Entity\Player;
use App\Entity\PlayerClubAssignment;
use App\Entity\PlayerTeamAssignment;
use App\Entity\RelationType;
use App\Entity\Team;
use App\Entity\User;
use App\Entity\UserRelation;
use App\Service\BulkRecipientResolverService;
use DateTimeImmutable;
use Doctrine\Common\Collections\ArrayCollection;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\TestCase;

#[AllowMockObjectsWithoutExpectations]
class BulkRecipientResolverServiceTest extends TestCase
{
    private BulkRecipientResolverService $service;

    protected function setUp(): void
    {
        $this->service = new BulkRecipientResolverService();
    }

    // =========================================================================
    // resolveForTeam – ROLE_ALL (default)
    // =========================================================================

    public function testResolveForTeamAllRoleReturnsPlayersAndCoaches(): void
    {
        $playerUser = $this->makeActiveUser(1, 'Player One');
        $coachUser = $this->makeActiveUser(2, 'Coach One');
        $team = $this->makeTeamWithPlayersAndCoaches([$playerUser], [$coachUser]);

        $result = $this->service->resolveForTeam($team, BulkRecipientResolverService::ROLE_ALL);

        $ids = array_map(fn (User $u) => $u->getId(), $result);
        $this->assertContains(1, $ids);
        $this->assertContains(2, $ids);
        $this->assertCount(2, $result);
    }

    public function testResolveForTeamPlayersRoleExcludesCoaches(): void
    {
        $playerUser = $this->makeActiveUser(1, 'Player One');
        $coachUser = $this->makeActiveUser(2, 'Coach One');
        $team = $this->makeTeamWithPlayersAndCoaches([$playerUser], [$coachUser]);

        $result = $this->service->resolveForTeam($team, BulkRecipientResolverService::ROLE_PLAYERS);

        $ids = array_map(fn (User $u) => $u->getId(), $result);
        $this->assertContains(1, $ids);
        $this->assertNotContains(2, $ids);
    }

    public function testResolveForTeamCoachesRoleExcludesPlayers(): void
    {
        $playerUser = $this->makeActiveUser(1, 'Player One');
        $coachUser = $this->makeActiveUser(2, 'Coach One');
        $team = $this->makeTeamWithPlayersAndCoaches([$playerUser], [$coachUser]);

        $result = $this->service->resolveForTeam($team, BulkRecipientResolverService::ROLE_COACHES);

        $ids = array_map(fn (User $u) => $u->getId(), $result);
        $this->assertNotContains(1, $ids);
        $this->assertContains(2, $ids);
    }

    public function testResolveForTeamParentsRoleReturnsOnlyParents(): void
    {
        $directUser = $this->makeActiveUser(1, 'Direct Player');
        $parentUser = $this->makeActiveUser(2, 'Parent');

        $player = $this->createMock(Player::class);
        $player->method('getUserRelations')->willReturn(new ArrayCollection([
            $this->makeUserRelation($directUser, 'player'),
            $this->makeUserRelation($parentUser, 'parent'),
        ]));

        $pta = $this->makePTA($player);
        $team = $this->createMock(Team::class);
        $team->method('getPlayerTeamAssignments')->willReturn(new ArrayCollection([$pta]));
        $team->method('getCoachTeamAssignments')->willReturn(new ArrayCollection());

        $result = $this->service->resolveForTeam($team, BulkRecipientResolverService::ROLE_PARENTS);

        $ids = array_map(fn (User $u) => $u->getId(), $result);
        $this->assertContains(2, $ids);
        $this->assertNotContains(1, $ids);
    }

    public function testResolveForTeamAllRoleExcludesParents(): void
    {
        $directUser = $this->makeActiveUser(1, 'Direct Player');
        $parentUser = $this->makeActiveUser(2, 'Parent/Guardian');

        $player = $this->createMock(Player::class);
        $player->method('getUserRelations')->willReturn(new ArrayCollection([
            $this->makeUserRelation($directUser, 'player'),
            $this->makeUserRelation($parentUser, 'guardian'),
        ]));

        $pta = $this->makePTA($player);
        $team = $this->createMock(Team::class);
        $team->method('getPlayerTeamAssignments')->willReturn(new ArrayCollection([$pta]));
        $team->method('getCoachTeamAssignments')->willReturn(new ArrayCollection());

        $result = $this->service->resolveForTeam($team, BulkRecipientResolverService::ROLE_ALL);

        $ids = array_map(fn (User $u) => $u->getId(), $result);
        $this->assertContains(1, $ids);
        $this->assertNotContains(2, $ids);
    }

    public function testResolveForTeamExcludesExpiredPlayerAssignment(): void
    {
        $playerUser = $this->makeActiveUser(1, 'Old Player');
        $player = $this->makePlayerWithUsers([$playerUser]);
        $pta = $this->makePTA($player, new DateTimeImmutable('-2 months'), new DateTimeImmutable('-1 day'));

        $team = $this->createMock(Team::class);
        $team->method('getPlayerTeamAssignments')->willReturn(new ArrayCollection([$pta]));
        $team->method('getCoachTeamAssignments')->willReturn(new ArrayCollection());

        $result = $this->service->resolveForTeam($team, BulkRecipientResolverService::ROLE_ALL);

        $this->assertEmpty($result);
    }

    public function testResolveForTeamExcludesFuturePlayerAssignment(): void
    {
        $playerUser = $this->makeActiveUser(1, 'Future Player');
        $player = $this->makePlayerWithUsers([$playerUser]);
        $pta = $this->makePTA($player, new DateTimeImmutable('+1 day'), null);

        $team = $this->createMock(Team::class);
        $team->method('getPlayerTeamAssignments')->willReturn(new ArrayCollection([$pta]));
        $team->method('getCoachTeamAssignments')->willReturn(new ArrayCollection());

        $result = $this->service->resolveForTeam($team, BulkRecipientResolverService::ROLE_ALL);

        $this->assertEmpty($result);
    }

    public function testResolveForTeamExcludesExpiredCoachAssignment(): void
    {
        $coachUser = $this->makeActiveUser(2, 'Old Coach');
        $coach = $this->makeCoachWithUsers([$coachUser]);
        $cta = $this->makeCTA($coach, new DateTimeImmutable('-2 months'), new DateTimeImmutable('-1 day'));

        $team = $this->createMock(Team::class);
        $team->method('getPlayerTeamAssignments')->willReturn(new ArrayCollection());
        $team->method('getCoachTeamAssignments')->willReturn(new ArrayCollection([$cta]));

        $result = $this->service->resolveForTeam($team, BulkRecipientResolverService::ROLE_ALL);

        $this->assertEmpty($result);
    }

    public function testResolveForTeamDeduplicatesUsers(): void
    {
        $sharedUser = $this->makeActiveUser(1, 'Shared');
        $player = $this->makePlayerWithUsers([$sharedUser]);
        $pta1 = $this->makePTA($player);
        $pta2 = $this->makePTA($player);

        $team = $this->createMock(Team::class);
        $team->method('getPlayerTeamAssignments')->willReturn(new ArrayCollection([$pta1, $pta2]));
        $team->method('getCoachTeamAssignments')->willReturn(new ArrayCollection());

        $result = $this->service->resolveForTeam($team, BulkRecipientResolverService::ROLE_ALL);

        $this->assertCount(1, $result);
    }

    public function testResolveForTeamExcludesDisabledUser(): void
    {
        $disabledUser = $this->createMock(User::class);
        $disabledUser->method('getId')->willReturn(99);
        $disabledUser->method('isEnabled')->willReturn(false);
        $disabledUser->method('isVerified')->willReturn(true);

        $player = $this->makePlayerWithUsers([$disabledUser]);
        $pta = $this->makePTA($player);

        $team = $this->createMock(Team::class);
        $team->method('getPlayerTeamAssignments')->willReturn(new ArrayCollection([$pta]));
        $team->method('getCoachTeamAssignments')->willReturn(new ArrayCollection());

        $result = $this->service->resolveForTeam($team, BulkRecipientResolverService::ROLE_ALL);

        $this->assertEmpty($result);
    }

    public function testResolveForTeamExcludesUnverifiedUser(): void
    {
        $unverifiedUser = $this->createMock(User::class);
        $unverifiedUser->method('getId')->willReturn(99);
        $unverifiedUser->method('isEnabled')->willReturn(true);
        $unverifiedUser->method('isVerified')->willReturn(false);

        $player = $this->makePlayerWithUsers([$unverifiedUser]);
        $pta = $this->makePTA($player);

        $team = $this->createMock(Team::class);
        $team->method('getPlayerTeamAssignments')->willReturn(new ArrayCollection([$pta]));
        $team->method('getCoachTeamAssignments')->willReturn(new ArrayCollection());

        $result = $this->service->resolveForTeam($team, BulkRecipientResolverService::ROLE_ALL);

        $this->assertEmpty($result);
    }

    public function testResolveForTeamAcceptsErzieungsberechtigterAsParent(): void
    {
        $parentUser = $this->makeActiveUser(3, 'Erziehungsberech.');
        $player = $this->createMock(Player::class);
        $player->method('getUserRelations')->willReturn(new ArrayCollection([
            $this->makeUserRelation($parentUser, 'erziehungsberechtigter'),
        ]));
        $pta = $this->makePTA($player);
        $team = $this->createMock(Team::class);
        $team->method('getPlayerTeamAssignments')->willReturn(new ArrayCollection([$pta]));
        $team->method('getCoachTeamAssignments')->willReturn(new ArrayCollection());

        $result = $this->service->resolveForTeam($team, BulkRecipientResolverService::ROLE_PARENTS);

        $this->assertCount(1, $result);
        $this->assertSame(3, $result[0]->getId());
    }

    // =========================================================================
    // resolveForClub
    // =========================================================================

    public function testResolveForClubAllRoleReturnsPlayersAndCoaches(): void
    {
        $playerUser = $this->makeActiveUser(10, 'Club Player');
        $coachUser = $this->makeActiveUser(20, 'Club Coach');
        $club = $this->makeClubWithPlayersAndCoaches([$playerUser], [$coachUser]);

        $result = $this->service->resolveForClub($club, BulkRecipientResolverService::ROLE_ALL);

        $ids = array_map(fn (User $u) => $u->getId(), $result);
        $this->assertContains(10, $ids);
        $this->assertContains(20, $ids);
    }

    public function testResolveForClubPlayersRole(): void
    {
        $playerUser = $this->makeActiveUser(10, 'Club Player');
        $coachUser = $this->makeActiveUser(20, 'Club Coach');
        $club = $this->makeClubWithPlayersAndCoaches([$playerUser], [$coachUser]);

        $result = $this->service->resolveForClub($club, BulkRecipientResolverService::ROLE_PLAYERS);

        $ids = array_map(fn (User $u) => $u->getId(), $result);
        $this->assertContains(10, $ids);
        $this->assertNotContains(20, $ids);
    }

    public function testResolveForClubExcludesExpiredAssignment(): void
    {
        $playerUser = $this->makeActiveUser(10, 'Old Club Player');
        $player = $this->makePlayerWithUsers([$playerUser]);
        $pca = $this->makePCA($player, new DateTimeImmutable('-2 months'), new DateTimeImmutable('-1 day'));

        $club = $this->createMock(Club::class);
        $club->method('getPlayerClubAssignments')->willReturn(new ArrayCollection([$pca]));
        $club->method('getCoachClubAssignments')->willReturn(new ArrayCollection());

        $result = $this->service->resolveForClub($club, BulkRecipientResolverService::ROLE_ALL);

        $this->assertEmpty($result);
    }

    public function testResolveForClubParentsRole(): void
    {
        $parentUser = $this->makeActiveUser(30, 'Club Parent');
        $player = $this->createMock(Player::class);
        $player->method('getUserRelations')->willReturn(new ArrayCollection([
            $this->makeUserRelation($parentUser, 'parent'),
        ]));
        $pca = $this->makePCA($player);
        $club = $this->createMock(Club::class);
        $club->method('getPlayerClubAssignments')->willReturn(new ArrayCollection([$pca]));
        $club->method('getCoachClubAssignments')->willReturn(new ArrayCollection());

        $result = $this->service->resolveForClub($club, BulkRecipientResolverService::ROLE_PARENTS);

        $this->assertCount(1, $result);
        $this->assertSame(30, $result[0]->getId());
    }

    public function testResolveForClubCoachesRoleExcludesPlayers(): void
    {
        $playerUser = $this->makeActiveUser(10, 'Club Player');
        $coachUser = $this->makeActiveUser(20, 'Club Coach');
        $club = $this->makeClubWithPlayersAndCoaches([$playerUser], [$coachUser]);

        $result = $this->service->resolveForClub($club, BulkRecipientResolverService::ROLE_COACHES);

        $ids = array_map(fn (User $u) => $u->getId(), $result);
        $this->assertNotContains(10, $ids);
        $this->assertContains(20, $ids);
    }

    public function testResolveForClubExcludesDisabledUser(): void
    {
        $disabledUser = $this->createMock(User::class);
        $disabledUser->method('getId')->willReturn(99);
        $disabledUser->method('isEnabled')->willReturn(false);
        $disabledUser->method('isVerified')->willReturn(true);

        $player = $this->makePlayerWithUsers([$disabledUser]);
        $pca = $this->makePCA($player);

        $club = $this->createMock(Club::class);
        $club->method('getPlayerClubAssignments')->willReturn(new ArrayCollection([$pca]));
        $club->method('getCoachClubAssignments')->willReturn(new ArrayCollection());

        $result = $this->service->resolveForClub($club, BulkRecipientResolverService::ROLE_ALL);

        $this->assertEmpty($result);
    }

    public function testResolveForClubExcludesUnverifiedCoachUser(): void
    {
        $unverifiedUser = $this->createMock(User::class);
        $unverifiedUser->method('getId')->willReturn(88);
        $unverifiedUser->method('isEnabled')->willReturn(true);
        $unverifiedUser->method('isVerified')->willReturn(false);

        $coach = $this->makeCoachWithUsers([$unverifiedUser]);
        $cca = $this->makeCCA($coach);

        $club = $this->createMock(Club::class);
        $club->method('getPlayerClubAssignments')->willReturn(new ArrayCollection());
        $club->method('getCoachClubAssignments')->willReturn(new ArrayCollection([$cca]));

        $result = $this->service->resolveForClub($club, BulkRecipientResolverService::ROLE_COACHES);

        $this->assertEmpty($result);
    }

    // =========================================================================
    // resolveTeamTargets
    // =========================================================================

    public function testResolveTeamTargetsDeduplicatesAcrossTeams(): void
    {
        $sharedUser = $this->makeActiveUser(1, 'Shared');
        $team1 = $this->makeTeamWithPlayersAndCoaches([$sharedUser], []);
        $team2 = $this->makeTeamWithPlayersAndCoaches([$sharedUser], []);

        $targets = [['teamId' => 1, 'role' => 'all'], ['teamId' => 2, 'role' => 'all']];
        $teamIndex = [1 => $team1, 2 => $team2];

        $result = $this->service->resolveTeamTargets($targets, $teamIndex);

        $this->assertCount(1, $result);
    }

    public function testResolveTeamTargetsSkipsUnknownTeamId(): void
    {
        $targets = [['teamId' => 999, 'role' => 'all']];
        $teamIndex = [];

        $result = $this->service->resolveTeamTargets($targets, $teamIndex);

        $this->assertEmpty($result);
    }

    public function testResolveTeamTargetsAppliesRolePerTarget(): void
    {
        $playerUser = $this->makeActiveUser(1, 'Player');
        $coachUser = $this->makeActiveUser(2, 'Coach');
        $team = $this->makeTeamWithPlayersAndCoaches([$playerUser], [$coachUser]);

        $targets = [['teamId' => 1, 'role' => 'coaches']];
        $teamIndex = [1 => $team];

        $result = $this->service->resolveTeamTargets($targets, $teamIndex);

        $this->assertCount(1, $result);
        $this->assertSame(2, $result[0]->getId());
    }

    // =========================================================================
    // resolveClubTargets
    // =========================================================================

    public function testResolveClubTargetsDeduplicatesAcrossClubs(): void
    {
        $sharedUser = $this->makeActiveUser(5, 'Club Shared');
        $club1 = $this->makeClubWithPlayersAndCoaches([$sharedUser], []);
        $club2 = $this->makeClubWithPlayersAndCoaches([$sharedUser], []);

        $targets = [['clubId' => 1, 'role' => 'all'], ['clubId' => 2, 'role' => 'all']];
        $clubIndex = [1 => $club1, 2 => $club2];

        $result = $this->service->resolveClubTargets($targets, $clubIndex);

        $this->assertCount(1, $result);
    }

    public function testResolveClubTargetsSkipsUnknownClubId(): void
    {
        $result = $this->service->resolveClubTargets([['clubId' => 42, 'role' => 'all']], []);

        $this->assertEmpty($result);
    }

    public function testResolveClubTargetsAppliesRolePerTarget(): void
    {
        $playerUser = $this->makeActiveUser(10, 'Club Player');
        $coachUser = $this->makeActiveUser(20, 'Club Coach');
        $club = $this->makeClubWithPlayersAndCoaches([$playerUser], [$coachUser]);

        $targets = [['clubId' => 1, 'role' => 'coaches']];
        $clubIndex = [1 => $club];

        $result = $this->service->resolveClubTargets($targets, $clubIndex);

        $this->assertCount(1, $result);
        $this->assertSame(20, $result[0]->getId());
    }

    // =========================================================================
    // Factories
    // =========================================================================

    private function makeActiveUser(int $id, string $name): User
    {
        $user = $this->createMock(User::class);
        $user->method('getId')->willReturn($id);
        $user->method('getFullName')->willReturn($name);
        $user->method('isEnabled')->willReturn(true);
        $user->method('isVerified')->willReturn(true);

        return $user;
    }

    private function makeUserRelation(User $user, string $typeIdentifier): UserRelation
    {
        $relType = $this->createMock(RelationType::class);
        $relType->method('getIdentifier')->willReturn($typeIdentifier);

        $ur = $this->createMock(UserRelation::class);
        $ur->method('getUser')->willReturn($user);
        $ur->method('getRelationType')->willReturn($relType);

        return $ur;
    }

    /** @param User[] $users */
    private function makePlayerWithUsers(array $users): Player
    {
        $relations = array_map(fn (User $u) => $this->makeUserRelation($u, 'player'), $users);
        $player = $this->createMock(Player::class);
        $player->method('getUserRelations')->willReturn(new ArrayCollection($relations));

        return $player;
    }

    /** @param User[] $users */
    private function makeCoachWithUsers(array $users): Coach
    {
        $relations = array_map(fn (User $u) => $this->makeUserRelation($u, 'coach'), $users);
        $coach = $this->createMock(Coach::class);
        $coach->method('getUserRelations')->willReturn(new ArrayCollection($relations));

        return $coach;
    }

    private function makePTA(
        Player $player,
        ?DateTimeImmutable $start = null,
        ?DateTimeImmutable $end = null,
    ): PlayerTeamAssignment {
        $pta = $this->createMock(PlayerTeamAssignment::class);
        $pta->method('getPlayer')->willReturn($player);
        $pta->method('getStartDate')->willReturn($start);
        $pta->method('getEndDate')->willReturn($end);

        return $pta;
    }

    private function makePCA(
        Player $player,
        ?DateTimeImmutable $start = null,
        ?DateTimeImmutable $end = null,
    ): PlayerClubAssignment {
        $pca = $this->createMock(PlayerClubAssignment::class);
        $pca->method('getPlayer')->willReturn($player);
        $pca->method('getStartDate')->willReturn($start);
        $pca->method('getEndDate')->willReturn($end);

        return $pca;
    }

    private function makeCTA(
        Coach $coach,
        ?DateTimeImmutable $start = null,
        ?DateTimeImmutable $end = null,
    ): CoachTeamAssignment {
        $cta = $this->createMock(CoachTeamAssignment::class);
        $cta->method('getCoach')->willReturn($coach);
        $cta->method('getStartDate')->willReturn($start);
        $cta->method('getEndDate')->willReturn($end);

        return $cta;
    }

    private function makeCCA(
        Coach $coach,
        ?DateTimeImmutable $start = null,
        ?DateTimeImmutable $end = null,
    ): CoachClubAssignment {
        $cca = $this->createMock(CoachClubAssignment::class);
        $cca->method('getCoach')->willReturn($coach);
        $cca->method('getStartDate')->willReturn($start);
        $cca->method('getEndDate')->willReturn($end);

        return $cca;
    }

    /**
     * @param User[] $playerUsers
     * @param User[] $coachUsers
     */
    private function makeTeamWithPlayersAndCoaches(array $playerUsers, array $coachUsers): Team
    {
        $ptas = array_map(
            fn (User $u) => $this->makePTA($this->makePlayerWithUsers([$u])),
            $playerUsers,
        );
        $ctas = array_map(
            fn (User $u) => $this->makeCTA($this->makeCoachWithUsers([$u])),
            $coachUsers,
        );

        $team = $this->createMock(Team::class);
        $team->method('getPlayerTeamAssignments')->willReturn(new ArrayCollection($ptas));
        $team->method('getCoachTeamAssignments')->willReturn(new ArrayCollection($ctas));

        return $team;
    }

    /**
     * @param User[] $playerUsers
     * @param User[] $coachUsers
     */
    private function makeClubWithPlayersAndCoaches(array $playerUsers, array $coachUsers): Club
    {
        $pcas = array_map(
            fn (User $u) => $this->makePCA($this->makePlayerWithUsers([$u])),
            $playerUsers,
        );
        $ccas = array_map(
            fn (User $u) => $this->makeCCA($this->makeCoachWithUsers([$u])),
            $coachUsers,
        );

        $club = $this->createMock(Club::class);
        $club->method('getPlayerClubAssignments')->willReturn(new ArrayCollection($pcas));
        $club->method('getCoachClubAssignments')->willReturn(new ArrayCollection($ccas));

        return $club;
    }
}
