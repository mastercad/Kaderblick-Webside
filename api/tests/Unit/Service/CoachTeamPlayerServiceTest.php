<?php

namespace App\Tests\Unit\Service;

use App\Entity\Coach;
use App\Entity\CoachTeamAssignment;
use App\Entity\Player;
use App\Entity\PlayerTeamAssignment;
use App\Entity\RelationType;
use App\Entity\Team;
use App\Entity\User;
use App\Entity\UserRelation;
use App\Service\CoachTeamPlayerService;
use DateTime;
use Doctrine\Common\Collections\ArrayCollection;
use PHPUnit\Framework\TestCase;

class CoachTeamPlayerServiceTest extends TestCase
{
    private CoachTeamPlayerService $service;

    protected function setUp(): void
    {
        $this->service = new CoachTeamPlayerService();
    }

    // =========================================================================
    // collectCoachTeams
    // =========================================================================

    public function testCollectCoachTeamsReturnsEmptyWhenNoRelations(): void
    {
        $user = $this->createUserWithRelations([]);

        $result = $this->service->collectCoachTeams($user);

        $this->assertSame([], $result);
    }

    public function testCollectCoachTeamsReturnsTeamForActiveAssignment(): void
    {
        $team = $this->createTeam(10);
        $assignment = $this->createCoachTeamAssignment(
            $team,
            new DateTime('-1 month'),
            new DateTime('+1 month')
        );
        $user = $this->createUserWithCoachRelations([$assignment]);

        $result = $this->service->collectCoachTeams($user);

        $this->assertCount(1, $result);
        $this->assertSame($team, $result[10]);
    }

    public function testCollectCoachTeamsExcludesExpiredAssignment(): void
    {
        $team = $this->createTeam(10);
        $assignment = $this->createCoachTeamAssignment(
            $team,
            new DateTime('-2 months'),
            new DateTime('-1 day')  // ended yesterday
        );
        $user = $this->createUserWithCoachRelations([$assignment]);

        $result = $this->service->collectCoachTeams($user);

        $this->assertSame([], $result);
    }

    public function testCollectCoachTeamsExcludesFutureAssignment(): void
    {
        $team = $this->createTeam(10);
        $assignment = $this->createCoachTeamAssignment(
            $team,
            new DateTime('+1 day'),  // starts tomorrow
            null
        );
        $user = $this->createUserWithCoachRelations([$assignment]);

        $result = $this->service->collectCoachTeams($user);

        $this->assertSame([], $result);
    }

    public function testCollectCoachTeamsIncludesAssignmentWithNullDates(): void
    {
        $team = $this->createTeam(10);
        $assignment = $this->createCoachTeamAssignment($team, null, null);
        $user = $this->createUserWithCoachRelations([$assignment]);

        $result = $this->service->collectCoachTeams($user);

        $this->assertCount(1, $result);
        $this->assertSame($team, $result[10]);
    }

    public function testCollectCoachTeamsIncludesOpenEndedActiveAssignment(): void
    {
        $team = $this->createTeam(10);
        $assignment = $this->createCoachTeamAssignment(
            $team,
            new DateTime('-1 month'),
            null  // no end date
        );
        $user = $this->createUserWithCoachRelations([$assignment]);

        $result = $this->service->collectCoachTeams($user);

        $this->assertCount(1, $result);
    }

    public function testCollectCoachTeamsDeduplicatesSameTeam(): void
    {
        $team = $this->createTeam(10);
        $assignment1 = $this->createCoachTeamAssignment($team, null, null);
        $assignment2 = $this->createCoachTeamAssignment($team, null, null);
        $user = $this->createUserWithCoachRelations([$assignment1, $assignment2]);

        $result = $this->service->collectCoachTeams($user);

        $this->assertCount(1, $result);
    }

    public function testCollectCoachTeamsReturnsMultipleDistinctTeams(): void
    {
        $team1 = $this->createTeam(10);
        $team2 = $this->createTeam(20);
        $assignment1 = $this->createCoachTeamAssignment($team1, null, null);
        $assignment2 = $this->createCoachTeamAssignment($team2, null, null);
        $user = $this->createUserWithCoachRelations([$assignment1, $assignment2]);

        $result = $this->service->collectCoachTeams($user);

        $this->assertCount(2, $result);
        $this->assertArrayHasKey(10, $result);
        $this->assertArrayHasKey(20, $result);
    }

    public function testCollectCoachTeamsIgnoresNonCoachRelations(): void
    {
        $user = $this->createMock(User::class);

        // Relation mit Player (kein Coach)
        $relation = $this->createMock(UserRelation::class);
        $relation->method('getCoach')->willReturn(null);

        $user->method('getUserRelations')->willReturn(new ArrayCollection([$relation]));

        $result = $this->service->collectCoachTeams($user);

        $this->assertSame([], $result);
    }

    // =========================================================================
    // collectPlayerTeams
    // =========================================================================

    public function testCollectPlayerTeamsReturnsEmptyWhenNoRelations(): void
    {
        $user = $this->createUserWithRelations([]);

        $result = $this->service->collectPlayerTeams($user);

        $this->assertSame([], $result);
    }

    public function testCollectPlayerTeamsReturnsTeamForActiveAssignment(): void
    {
        $team = $this->createTeam(10);
        $assignment = $this->createPlayerTeamAssignment(
            $team,
            new DateTime('-1 month'),
            new DateTime('+1 month')
        );
        $user = $this->createUserWithPlayerRelations([$assignment]);

        $result = $this->service->collectPlayerTeams($user);

        $this->assertCount(1, $result);
        $this->assertSame($team, $result[10]);
    }

    public function testCollectPlayerTeamsExcludesExpiredAssignment(): void
    {
        $team = $this->createTeam(10);
        $assignment = $this->createPlayerTeamAssignment(
            $team,
            new DateTime('-2 months'),
            new DateTime('-1 day')
        );
        $user = $this->createUserWithPlayerRelations([$assignment]);

        $result = $this->service->collectPlayerTeams($user);

        $this->assertSame([], $result);
    }

    public function testCollectPlayerTeamsExcludesFutureAssignment(): void
    {
        $team = $this->createTeam(10);
        $assignment = $this->createPlayerTeamAssignment(
            $team,
            new DateTime('+1 day'),
            null
        );
        $user = $this->createUserWithPlayerRelations([$assignment]);

        $result = $this->service->collectPlayerTeams($user);

        $this->assertSame([], $result);
    }

    public function testCollectPlayerTeamsIncludesAssignmentWithNullDates(): void
    {
        $team = $this->createTeam(10);
        $assignment = $this->createPlayerTeamAssignment($team, null, null);
        $user = $this->createUserWithPlayerRelations([$assignment]);

        $result = $this->service->collectPlayerTeams($user);

        $this->assertCount(1, $result);
    }

    // =========================================================================
    // collectTeamPlayers
    // =========================================================================

    public function testCollectTeamPlayersReturnsActivePlayer(): void
    {
        $player = $this->createMock(Player::class);
        $player->method('getId')->willReturn(1);
        $player->method('getFullName')->willReturn('Max Mustermann');

        $team = $this->createMock(Team::class);
        $assignment = $this->createMock(PlayerTeamAssignment::class);
        $assignment->method('getStartDate')->willReturn(new DateTime('-1 month'));
        $assignment->method('getEndDate')->willReturn(new DateTime('+1 month'));
        $assignment->method('getPlayer')->willReturn($player);
        $assignment->method('getShirtNumber')->willReturn(7);

        $team->method('getPlayerTeamAssignments')
            ->willReturn(new ArrayCollection([$assignment]));

        $result = $this->service->collectTeamPlayers($team);

        $this->assertCount(1, $result);
        $this->assertSame(1, $result[0]['player']['id']);
        $this->assertSame('Max Mustermann', $result[0]['player']['name']);
        $this->assertSame(7, $result[0]['shirtNumber']);
    }

    public function testCollectTeamPlayersExcludesExpiredAssignment(): void
    {
        $player = $this->createMock(Player::class);
        $team = $this->createMock(Team::class);

        $assignment = $this->createMock(PlayerTeamAssignment::class);
        $assignment->method('getStartDate')->willReturn(new DateTime('-2 months'));
        $assignment->method('getEndDate')->willReturn(new DateTime('-1 day'));
        $assignment->method('getPlayer')->willReturn($player);

        $team->method('getPlayerTeamAssignments')
            ->willReturn(new ArrayCollection([$assignment]));

        $result = $this->service->collectTeamPlayers($team);

        $this->assertSame([], $result);
    }

    public function testCollectTeamPlayersReturnsEmptyForTeamWithoutAssignments(): void
    {
        $team = $this->createMock(Team::class);
        $team->method('getPlayerTeamAssignments')
            ->willReturn(new ArrayCollection([]));

        $result = $this->service->collectTeamPlayers($team);

        $this->assertSame([], $result);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    /** @param list<UserRelation> $relations */
    private function createUserWithRelations(array $relations): User
    {
        $user = $this->createMock(User::class);
        $user->method('getUserRelations')->willReturn(new ArrayCollection($relations));

        return $user;
    }

    /** @param list<CoachTeamAssignment> $assignments */
    private function createUserWithCoachRelations(array $assignments): User
    {
        $relationType = $this->createMock(RelationType::class);
        $relationType->method('getCategory')->willReturn('coach');

        $coach = $this->createMock(Coach::class);
        $coach->method('getCoachTeamAssignments')
            ->willReturn(new ArrayCollection($assignments));

        $relation = $this->createMock(UserRelation::class);
        $relation->method('getCoach')->willReturn($coach);
        $relation->method('getRelationType')->willReturn($relationType);

        return $this->createUserWithRelations([$relation]);
    }

    /** @param list<PlayerTeamAssignment> $assignments */
    private function createUserWithPlayerRelations(array $assignments): User
    {
        $player = $this->createMock(Player::class);
        $player->method('getPlayerTeamAssignments')
            ->willReturn(new ArrayCollection($assignments));

        $relation = $this->createMock(UserRelation::class);
        $relation->method('getPlayer')->willReturn($player);

        return $this->createUserWithRelations([$relation]);
    }

    private function createTeam(int $id): Team
    {
        $team = $this->createMock(Team::class);
        $team->method('getId')->willReturn($id);

        return $team;
    }

    private function createCoachTeamAssignment(
        Team $team,
        ?DateTime $startDate,
        ?DateTime $endDate
    ): CoachTeamAssignment {
        $assignment = $this->createMock(CoachTeamAssignment::class);
        $assignment->method('getTeam')->willReturn($team);
        $assignment->method('getStartDate')->willReturn($startDate);
        $assignment->method('getEndDate')->willReturn($endDate);

        return $assignment;
    }

    private function createPlayerTeamAssignment(
        Team $team,
        ?DateTime $startDate,
        ?DateTime $endDate
    ): PlayerTeamAssignment {
        $assignment = $this->createMock(PlayerTeamAssignment::class);
        $assignment->method('getTeam')->willReturn($team);
        $assignment->method('getStartDate')->willReturn($startDate);
        $assignment->method('getEndDate')->willReturn($endDate);

        return $assignment;
    }
}
