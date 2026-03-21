<?php

namespace Tests\Integration\Service;

use App\Entity\AgeGroup;
use App\Entity\CalendarEvent;
use App\Entity\CalendarEventPermission;
use App\Entity\Club;
use App\Entity\Coach;
use App\Entity\CoachClubAssignment;
use App\Entity\CoachTeamAssignment;
use App\Entity\Player;
use App\Entity\PlayerClubAssignment;
use App\Entity\PlayerTeamAssignment;
use App\Entity\Position;
use App\Entity\RelationType;
use App\Entity\Team;
use App\Entity\User;
use App\Entity\UserRelation;
use App\Enum\CalendarEventPermissionType;
use App\Service\TeamMembershipService;
use DateTime;
use DateTimeInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * Integration tests for TeamMembershipService date filtering.
 *
 * These tests use a real database via the Symfony test kernel to verify
 * that startDate and endDate filters work correctly for all assignment types.
 * Each test runs in a transaction that is rolled back afterward.
 *
 * Constellations tested per assignment type:
 *  1. Active assignment: startDate in past, no endDate → included
 *  2. Active assignment: startDate in past, endDate in future → included
 *  3. Expired assignment: startDate in past, endDate in past → excluded
 *  4. Future assignment: startDate in future, no endDate → excluded
 *  5. Future assignment: startDate in future, endDate in future → excluded
 *  6. Null startDate, no endDate → included (Team only, where startDate nullable)
 *  7. Null startDate, endDate in past → excluded (Team only)
 *  8. startDate = today, endDate = today → included (edge case)
 *  9. startDate = yesterday, endDate = yesterday → excluded (edge case)
 * 10. startDate = tomorrow → excluded (edge case)
 */
class TeamMembershipServiceDateFilterTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private TeamMembershipService $service;

    /** Shared fixture objects (created once per test) */
    private Position $position;
    private AgeGroup $ageGroup;
    private RelationType $playerRelationType;
    private RelationType $coachRelationType;

    protected function setUp(): void
    {
        self::bootKernel();
        $container = static::getContainer();

        $this->em = $container->get(EntityManagerInterface::class);
        $this->service = $container->get(TeamMembershipService::class);

        $this->em->getConnection()->beginTransaction();

        $this->createSharedFixtures();
    }

    protected function tearDown(): void
    {
        if ($this->em->getConnection()->isTransactionActive()) {
            $this->em->getConnection()->rollBack();
        }

        parent::tearDown();

        // Symfony kernel registers exception handlers that PHPUnit flags as risky
        restore_exception_handler();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  isUserInTeam – PlayerTeamAssignment date constellation tests
    // ═══════════════════════════════════════════════════════════════════════════

    public function testPlayerTeamActiveAssignmentStartInPastNoEnd(): void
    {
        [$user, $team] = $this->createPlayerTeamSetup(
            startDate: new DateTime('-30 days'),
            endDate: null,
        );

        $this->assertTrue(
            $this->service->isUserInTeam($user, $team),
            'Player with startDate in the past and no endDate should be in the team.'
        );
    }

    public function testPlayerTeamActiveAssignmentStartInPastEndInFuture(): void
    {
        [$user, $team] = $this->createPlayerTeamSetup(
            startDate: new DateTime('-30 days'),
            endDate: new DateTime('+30 days'),
        );

        $this->assertTrue(
            $this->service->isUserInTeam($user, $team),
            'Player with startDate in past and endDate in future should be in the team.'
        );
    }

    public function testPlayerTeamExpiredAssignmentStartInPastEndInPast(): void
    {
        [$user, $team] = $this->createPlayerTeamSetup(
            startDate: new DateTime('-60 days'),
            endDate: new DateTime('-1 day'),
        );

        $this->assertFalse(
            $this->service->isUserInTeam($user, $team),
            'Player with endDate in the past should NOT be in the team.'
        );
    }

    public function testPlayerTeamFutureAssignmentStartInFutureNoEnd(): void
    {
        [$user, $team] = $this->createPlayerTeamSetup(
            startDate: new DateTime('+30 days'),
            endDate: null,
        );

        $this->assertFalse(
            $this->service->isUserInTeam($user, $team),
            'Player with startDate in the future should NOT be in the team yet.'
        );
    }

    public function testPlayerTeamFutureAssignmentStartInFutureEndInFuture(): void
    {
        [$user, $team] = $this->createPlayerTeamSetup(
            startDate: new DateTime('+10 days'),
            endDate: new DateTime('+40 days'),
        );

        $this->assertFalse(
            $this->service->isUserInTeam($user, $team),
            'Player with start and end both in the future should NOT be in the team yet.'
        );
    }

    public function testPlayerTeamNullStartDateNoEnd(): void
    {
        [$user, $team] = $this->createPlayerTeamSetup(
            startDate: null,
            endDate: null,
        );

        $this->assertTrue(
            $this->service->isUserInTeam($user, $team),
            'Player with null startDate and no endDate should be in the team (legacy/open-ended).'
        );
    }

    public function testPlayerTeamNullStartDateEndInPast(): void
    {
        [$user, $team] = $this->createPlayerTeamSetup(
            startDate: null,
            endDate: new DateTime('-1 day'),
        );

        $this->assertFalse(
            $this->service->isUserInTeam($user, $team),
            'Player with null startDate but endDate in the past should NOT be in the team.'
        );
    }

    public function testPlayerTeamStartTodayEndToday(): void
    {
        [$user, $team] = $this->createPlayerTeamSetup(
            startDate: new DateTime('today'),
            endDate: new DateTime('today'),
        );

        $this->assertTrue(
            $this->service->isUserInTeam($user, $team),
            'Player with startDate=today and endDate=today should be in the team (boundary).'
        );
    }

    public function testPlayerTeamStartYesterdayEndYesterday(): void
    {
        [$user, $team] = $this->createPlayerTeamSetup(
            startDate: new DateTime('-1 day'),
            endDate: new DateTime('-1 day'),
        );

        $this->assertFalse(
            $this->service->isUserInTeam($user, $team),
            'Player with startDate=yesterday and endDate=yesterday should NOT be in the team.'
        );
    }

    public function testPlayerTeamStartTomorrow(): void
    {
        [$user, $team] = $this->createPlayerTeamSetup(
            startDate: new DateTime('+1 day'),
            endDate: null,
        );

        $this->assertFalse(
            $this->service->isUserInTeam($user, $team),
            'Player with startDate=tomorrow should NOT be in the team yet.'
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  isUserInTeam – CoachTeamAssignment date constellation tests
    // ═══════════════════════════════════════════════════════════════════════════

    public function testCoachTeamActiveAssignmentStartInPastNoEnd(): void
    {
        [$user, $team] = $this->createCoachTeamSetup(
            startDate: new DateTime('-30 days'),
            endDate: null,
        );

        $this->assertTrue(
            $this->service->isUserInTeam($user, $team),
            'Coach with startDate in the past and no endDate should be in the team.'
        );
    }

    public function testCoachTeamActiveAssignmentStartInPastEndInFuture(): void
    {
        [$user, $team] = $this->createCoachTeamSetup(
            startDate: new DateTime('-30 days'),
            endDate: new DateTime('+30 days'),
        );

        $this->assertTrue(
            $this->service->isUserInTeam($user, $team),
            'Coach with startDate in past and endDate in future should be in the team.'
        );
    }

    public function testCoachTeamExpiredAssignment(): void
    {
        [$user, $team] = $this->createCoachTeamSetup(
            startDate: new DateTime('-60 days'),
            endDate: new DateTime('-1 day'),
        );

        $this->assertFalse(
            $this->service->isUserInTeam($user, $team),
            'Coach with endDate in the past should NOT be in the team.'
        );
    }

    public function testCoachTeamFutureAssignment(): void
    {
        [$user, $team] = $this->createCoachTeamSetup(
            startDate: new DateTime('+30 days'),
            endDate: null,
        );

        $this->assertFalse(
            $this->service->isUserInTeam($user, $team),
            'Coach with startDate in the future should NOT be in the team yet.'
        );
    }

    public function testCoachTeamNullStartDateNoEnd(): void
    {
        [$user, $team] = $this->createCoachTeamSetup(
            startDate: null,
            endDate: null,
        );

        $this->assertTrue(
            $this->service->isUserInTeam($user, $team),
            'Coach with null startDate and no endDate should be in the team (legacy).'
        );
    }

    public function testCoachTeamNullStartDateEndInPast(): void
    {
        [$user, $team] = $this->createCoachTeamSetup(
            startDate: null,
            endDate: new DateTime('-1 day'),
        );

        $this->assertFalse(
            $this->service->isUserInTeam($user, $team),
            'Coach with null startDate but endDate in the past should NOT be in the team.'
        );
    }

    public function testCoachTeamStartTodayEndToday(): void
    {
        [$user, $team] = $this->createCoachTeamSetup(
            startDate: new DateTime('today'),
            endDate: new DateTime('today'),
        );

        $this->assertTrue(
            $this->service->isUserInTeam($user, $team),
            'Coach with startDate=today and endDate=today should be in the team (boundary).'
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  isUserInClub – PlayerClubAssignment date constellation tests
    // ═══════════════════════════════════════════════════════════════════════════

    public function testPlayerClubActiveAssignmentStartInPastNoEnd(): void
    {
        [$user, $club] = $this->createPlayerClubSetup(
            startDate: new DateTime('-30 days'),
            endDate: null,
        );

        $this->assertTrue(
            $this->service->isUserInClub($user, $club),
            'Player with startDate in the past and no endDate should be in the club.'
        );
    }

    public function testPlayerClubActiveAssignmentStartInPastEndInFuture(): void
    {
        [$user, $club] = $this->createPlayerClubSetup(
            startDate: new DateTime('-30 days'),
            endDate: new DateTime('+30 days'),
        );

        $this->assertTrue(
            $this->service->isUserInClub($user, $club),
            'Player with startDate in past and endDate in future should be in the club.'
        );
    }

    public function testPlayerClubExpiredAssignment(): void
    {
        [$user, $club] = $this->createPlayerClubSetup(
            startDate: new DateTime('-60 days'),
            endDate: new DateTime('-1 day'),
        );

        $this->assertFalse(
            $this->service->isUserInClub($user, $club),
            'Player with endDate in the past should NOT be in the club.'
        );
    }

    public function testPlayerClubFutureAssignment(): void
    {
        [$user, $club] = $this->createPlayerClubSetup(
            startDate: new DateTime('+30 days'),
            endDate: null,
        );

        $this->assertFalse(
            $this->service->isUserInClub($user, $club),
            'Player with startDate in the future should NOT be in the club yet.'
        );
    }

    public function testPlayerClubStartTodayEndToday(): void
    {
        [$user, $club] = $this->createPlayerClubSetup(
            startDate: new DateTime('today'),
            endDate: new DateTime('today'),
        );

        $this->assertTrue(
            $this->service->isUserInClub($user, $club),
            'Player with startDate=today and endDate=today should be in the club (boundary).'
        );
    }

    public function testPlayerClubStartYesterdayEndYesterday(): void
    {
        [$user, $club] = $this->createPlayerClubSetup(
            startDate: new DateTime('-1 day'),
            endDate: new DateTime('-1 day'),
        );

        $this->assertFalse(
            $this->service->isUserInClub($user, $club),
            'Player with startDate=yesterday and endDate=yesterday should NOT be in the club.'
        );
    }

    public function testPlayerClubStartTomorrow(): void
    {
        [$user, $club] = $this->createPlayerClubSetup(
            startDate: new DateTime('+1 day'),
            endDate: null,
        );

        $this->assertFalse(
            $this->service->isUserInClub($user, $club),
            'Player with startDate=tomorrow should NOT be in the club.'
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  isUserInClub – CoachClubAssignment date constellation tests
    // ═══════════════════════════════════════════════════════════════════════════

    public function testCoachClubActiveAssignmentStartInPastNoEnd(): void
    {
        [$user, $club] = $this->createCoachClubSetup(
            startDate: new DateTime('-30 days'),
            endDate: null,
        );

        $this->assertTrue(
            $this->service->isUserInClub($user, $club),
            'Coach with startDate in the past and no endDate should be in the club.'
        );
    }

    public function testCoachClubActiveAssignmentStartInPastEndInFuture(): void
    {
        [$user, $club] = $this->createCoachClubSetup(
            startDate: new DateTime('-30 days'),
            endDate: new DateTime('+30 days'),
        );

        $this->assertTrue(
            $this->service->isUserInClub($user, $club),
            'Coach with startDate in past and endDate in future should be in the club.'
        );
    }

    public function testCoachClubExpiredAssignment(): void
    {
        [$user, $club] = $this->createCoachClubSetup(
            startDate: new DateTime('-60 days'),
            endDate: new DateTime('-1 day'),
        );

        $this->assertFalse(
            $this->service->isUserInClub($user, $club),
            'Coach with endDate in the past should NOT be in the club.'
        );
    }

    public function testCoachClubFutureAssignment(): void
    {
        [$user, $club] = $this->createCoachClubSetup(
            startDate: new DateTime('+30 days'),
            endDate: null,
        );

        $this->assertFalse(
            $this->service->isUserInClub($user, $club),
            'Coach with startDate in the future should NOT be in the club yet.'
        );
    }

    public function testCoachClubStartTodayEndToday(): void
    {
        [$user, $club] = $this->createCoachClubSetup(
            startDate: new DateTime('today'),
            endDate: new DateTime('today'),
        );

        $this->assertTrue(
            $this->service->isUserInClub($user, $club),
            'Coach with startDate=today and endDate=today should be in the club (boundary).'
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  resolveTeamMembers – date filtering across mixed active/inactive
    // ═══════════════════════════════════════════════════════════════════════════

    public function testResolveTeamMembersReturnsOnlyActiveAssignments(): void
    {
        $team = $this->createTeam('ResolveTeam');

        // Active player (startDate past, no endDate)
        $activePlayer = $this->createPlayerWithTeamAssignment(
            $team,
            'active-player',
            new DateTime('-30 days'),
            null
        );

        // Expired player (startDate past, endDate past)
        $expiredPlayer = $this->createPlayerWithTeamAssignment(
            $team,
            'expired-player',
            new DateTime('-60 days'),
            new DateTime('-1 day')
        );

        // Future player (startDate future)
        $futurePlayer = $this->createPlayerWithTeamAssignment(
            $team,
            'future-player',
            new DateTime('+10 days'),
            null
        );

        // Active coach (startDate past, endDate future)
        $activeCoach = $this->createCoachWithTeamAssignment(
            $team,
            'active-coach',
            new DateTime('-10 days'),
            new DateTime('+60 days')
        );

        // Expired coach
        $expiredCoach = $this->createCoachWithTeamAssignment(
            $team,
            'expired-coach',
            new DateTime('-90 days'),
            new DateTime('-5 days')
        );

        $this->em->flush();

        $members = $this->service->resolveTeamMembers($team);
        $memberIds = array_keys($members);

        $this->assertContains($activePlayer->getId(), $memberIds, 'Active player should be included.');
        $this->assertContains($activeCoach->getId(), $memberIds, 'Active coach should be included.');
        $this->assertNotContains($expiredPlayer->getId(), $memberIds, 'Expired player should be excluded.');
        $this->assertNotContains($futurePlayer->getId(), $memberIds, 'Future player should be excluded.');
        $this->assertNotContains($expiredCoach->getId(), $memberIds, 'Expired coach should be excluded.');
        $this->assertCount(2, $members, 'Exactly 2 active members expected.');
    }

    public function testResolveTeamMembersIncludesNullStartDateAssignment(): void
    {
        $team = $this->createTeam('NullStartTeam');

        $user = $this->createPlayerWithTeamAssignment(
            $team,
            'legacy-player',
            null,
            null
        );

        $this->em->flush();

        $members = $this->service->resolveTeamMembers($team);

        $this->assertArrayHasKey($user->getId(), $members, 'Player with null startDate should be included (legacy data).');
    }

    public function testResolveTeamMembersExcludesNullStartDateWithExpiredEndDate(): void
    {
        $team = $this->createTeam('NullStartExpiredTeam');

        $user = $this->createPlayerWithTeamAssignment(
            $team,
            'legacy-expired',
            null,
            new DateTime('-1 day')
        );

        $this->em->flush();

        $members = $this->service->resolveTeamMembers($team);

        $this->assertArrayNotHasKey($user->getId(), $members, 'Player with null startDate but expired endDate should be excluded.');
    }

    public function testResolveTeamMembersReturnsEmptyForTeamWithOnlyExpiredAssignments(): void
    {
        $team = $this->createTeam('AllExpiredTeam');

        $this->createPlayerWithTeamAssignment(
            $team,
            'expired1',
            new DateTime('-60 days'),
            new DateTime('-30 days')
        );
        $this->createCoachWithTeamAssignment(
            $team,
            'expired2',
            new DateTime('-60 days'),
            new DateTime('-1 day')
        );

        $this->em->flush();

        $members = $this->service->resolveTeamMembers($team);

        $this->assertEmpty($members, 'Team with only expired assignments should have no active members.');
    }

    public function testResolveTeamMembersBoundaryStartTodayIncluded(): void
    {
        $team = $this->createTeam('StartTodayTeam');

        $user = $this->createPlayerWithTeamAssignment(
            $team,
            'starts-today',
            new DateTime('today'),
            null
        );

        $this->em->flush();

        $members = $this->service->resolveTeamMembers($team);

        $this->assertArrayHasKey($user->getId(), $members, 'Player starting today should be included.');
    }

    public function testResolveTeamMembersBoundaryEndTodayIncluded(): void
    {
        $team = $this->createTeam('EndTodayTeam');

        $user = $this->createPlayerWithTeamAssignment(
            $team,
            'ends-today',
            new DateTime('-30 days'),
            new DateTime('today')
        );

        $this->em->flush();

        $members = $this->service->resolveTeamMembers($team);

        $this->assertArrayHasKey($user->getId(), $members, 'Player with endDate=today should still be included.');
    }

    public function testResolveTeamMembersBoundaryEndYesterdayExcluded(): void
    {
        $team = $this->createTeam('EndYesterdayTeam');

        $user = $this->createPlayerWithTeamAssignment(
            $team,
            'ended-yesterday',
            new DateTime('-30 days'),
            new DateTime('-1 day')
        );

        $this->em->flush();

        $members = $this->service->resolveTeamMembers($team);

        $this->assertArrayNotHasKey($user->getId(), $members, 'Player with endDate=yesterday should be excluded.');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  resolveClubMembers – date filtering
    // ═══════════════════════════════════════════════════════════════════════════

    public function testResolveClubMembersReturnsOnlyActiveAssignments(): void
    {
        $club = $this->createClub('ResolveClub');

        // Active player
        $activePlayer = $this->createPlayerWithClubAssignment(
            $club,
            'active-club-player',
            new DateTime('-30 days'),
            null
        );

        // Expired player
        $expiredPlayer = $this->createPlayerWithClubAssignment(
            $club,
            'expired-club-player',
            new DateTime('-60 days'),
            new DateTime('-1 day')
        );

        // Future player
        $futurePlayer = $this->createPlayerWithClubAssignment(
            $club,
            'future-club-player',
            new DateTime('+10 days'),
            null
        );

        // Active coach
        $activeCoach = $this->createCoachWithClubAssignment(
            $club,
            'active-club-coach',
            new DateTime('-10 days'),
            new DateTime('+60 days')
        );

        // Expired coach
        $expiredCoach = $this->createCoachWithClubAssignment(
            $club,
            'expired-club-coach',
            new DateTime('-90 days'),
            new DateTime('-5 days')
        );

        $this->em->flush();

        $members = $this->service->resolveClubMembers($club);
        $memberIds = array_keys($members);

        $this->assertContains($activePlayer->getId(), $memberIds, 'Active player should be included.');
        $this->assertContains($activeCoach->getId(), $memberIds, 'Active coach should be included.');
        $this->assertNotContains($expiredPlayer->getId(), $memberIds, 'Expired player should be excluded.');
        $this->assertNotContains($futurePlayer->getId(), $memberIds, 'Future player should be excluded.');
        $this->assertNotContains($expiredCoach->getId(), $memberIds, 'Expired coach should be excluded.');
        $this->assertCount(2, $members, 'Exactly 2 active members expected.');
    }

    public function testResolveClubMembersBoundaryStartTodayIncluded(): void
    {
        $club = $this->createClub('StartTodayClub');

        $user = $this->createPlayerWithClubAssignment(
            $club,
            'club-starts-today',
            new DateTime('today'),
            null
        );

        $this->em->flush();

        $members = $this->service->resolveClubMembers($club);

        $this->assertArrayHasKey($user->getId(), $members, 'Player starting today should be included in club.');
    }

    public function testResolveClubMembersBoundaryEndTodayIncluded(): void
    {
        $club = $this->createClub('EndTodayClub');

        $user = $this->createPlayerWithClubAssignment(
            $club,
            'club-ends-today',
            new DateTime('-30 days'),
            new DateTime('today')
        );

        $this->em->flush();

        $members = $this->service->resolveClubMembers($club);

        $this->assertArrayHasKey($user->getId(), $members, 'Player with endDate=today should still be included in club.');
    }

    public function testResolveClubMembersExcludesFutureStartDate(): void
    {
        $club = $this->createClub('FutureStartClub');

        $user = $this->createPlayerWithClubAssignment(
            $club,
            'club-future',
            new DateTime('+1 day'),
            new DateTime('+30 days')
        );

        $this->em->flush();

        $members = $this->service->resolveClubMembers($club);

        $this->assertArrayNotHasKey($user->getId(), $members, 'Player with future startDate should NOT be in club members.');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  resolveEventRecipients – permission-based with date filtering
    // ═══════════════════════════════════════════════════════════════════════════

    public function testResolveEventRecipientsTeamPermissionExcludesExpiredMembers(): void
    {
        $team = $this->createTeam('EventTeam');

        $activeUser = $this->createPlayerWithTeamAssignment(
            $team,
            'event-active',
            new DateTime('-30 days'),
            null
        );
        $expiredUser = $this->createPlayerWithTeamAssignment(
            $team,
            'event-expired',
            new DateTime('-60 days'),
            new DateTime('-1 day')
        );

        $event = $this->createCalendarEventWithTeamPermission($team);

        $this->em->flush();

        $recipients = $this->service->resolveEventRecipients($event);
        $recipientIds = array_map(fn (User $u) => $u->getId(), $recipients);

        $this->assertContains($activeUser->getId(), $recipientIds, 'Active team member should receive notification.');
        $this->assertNotContains($expiredUser->getId(), $recipientIds, 'Expired team member should NOT receive notification.');
    }

    public function testResolveEventRecipientsClubPermissionExcludesExpiredMembers(): void
    {
        $club = $this->createClub('EventClub');

        $activeUser = $this->createPlayerWithClubAssignment(
            $club,
            'event-club-active',
            new DateTime('-30 days'),
            null
        );
        $expiredUser = $this->createPlayerWithClubAssignment(
            $club,
            'event-club-expired',
            new DateTime('-60 days'),
            new DateTime('-1 day')
        );

        $event = $this->createCalendarEventWithClubPermission($club);

        $this->em->flush();

        $recipients = $this->service->resolveEventRecipients($event);
        $recipientIds = array_map(fn (User $u) => $u->getId(), $recipients);

        $this->assertContains($activeUser->getId(), $recipientIds, 'Active club member should receive notification.');
        $this->assertNotContains($expiredUser->getId(), $recipientIds, 'Expired club member should NOT receive notification.');
    }

    public function testResolveEventRecipientsTeamPermissionExcludesFutureMembers(): void
    {
        $team = $this->createTeam('FutureEventTeam');

        $futureUser = $this->createPlayerWithTeamAssignment(
            $team,
            'event-future',
            new DateTime('+10 days'),
            null
        );

        $event = $this->createCalendarEventWithTeamPermission($team);

        $this->em->flush();

        $recipients = $this->service->resolveEventRecipients($event);
        $recipientIds = array_map(fn (User $u) => $u->getId(), $recipients);

        $this->assertNotContains($futureUser->getId(), $recipientIds, 'Future team member should NOT receive notification.');
    }

    public function testResolveEventRecipientsExcludesUser(): void
    {
        $team = $this->createTeam('ExcludeUserTeam');

        $user1 = $this->createPlayerWithTeamAssignment(
            $team,
            'event-user1',
            new DateTime('-30 days'),
            null
        );
        $user2 = $this->createPlayerWithTeamAssignment(
            $team,
            'event-user2',
            new DateTime('-30 days'),
            null
        );

        $event = $this->createCalendarEventWithTeamPermission($team);

        $this->em->flush();

        // Exclude user1 from recipients
        $recipients = $this->service->resolveEventRecipients($event, $user1);
        $recipientIds = array_map(fn (User $u) => $u->getId(), $recipients);

        $this->assertNotContains($user1->getId(), $recipientIds, 'Excluded user should NOT be in recipients.');
        $this->assertContains($user2->getId(), $recipientIds, 'Non-excluded active user should be in recipients.');
    }

    public function testResolveEventRecipientsUserPermissionAlwaysIncluded(): void
    {
        $user = $this->createUser('direct-user');

        $event = new CalendarEvent();
        $event->setTitle('User Permission Event');
        $event->setStartDate(new DateTime('+1 day'));
        $this->em->persist($event);

        $permission = new CalendarEventPermission();
        $permission->setCalendarEvent($event);
        $permission->setPermissionType(CalendarEventPermissionType::USER);
        $permission->setUser($user);
        $this->em->persist($permission);

        $event->addPermission($permission);

        $this->em->flush();

        $recipients = $this->service->resolveEventRecipients($event);
        $recipientIds = array_map(fn (User $u) => $u->getId(), $recipients);

        $this->assertContains($user->getId(), $recipientIds, 'USER permission target should always be included.');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  canUserParticipateInEvent – with date-filtered membership
    // ═══════════════════════════════════════════════════════════════════════════

    public function testCanParticipateExcludesExpiredPlayerFromTeamEvent(): void
    {
        $team = $this->createTeam('ParticipateTeam');

        [$expiredUser] = $this->createPlayerTeamSetup(
            startDate: new DateTime('-60 days'),
            endDate: new DateTime('-1 day'),
            team: $team,
        );

        $permission = new CalendarEventPermission();
        $event = new CalendarEvent();
        $event->setTitle('Team Participate Event');
        $event->setStartDate(new DateTime('+1 day'));
        $this->em->persist($event);

        $permission->setCalendarEvent($event);
        $permission->setPermissionType(CalendarEventPermissionType::TEAM);
        $permission->setTeam($team);
        $this->em->persist($permission);
        $event->addPermission($permission);

        $this->em->flush();

        $this->assertFalse(
            $this->service->canUserParticipateInEvent($expiredUser, $event),
            'Expired player should NOT be able to participate in team event.'
        );
    }

    public function testCanParticipateIncludesActivePlayerInTeamEvent(): void
    {
        $team = $this->createTeam('ActiveParticipateTeam');

        [$activeUser] = $this->createPlayerTeamSetup(
            startDate: new DateTime('-30 days'),
            endDate: null,
            team: $team,
        );

        $event = new CalendarEvent();
        $event->setTitle('Active Team Participate Event');
        $event->setStartDate(new DateTime('+1 day'));
        $this->em->persist($event);

        $permission = new CalendarEventPermission();
        $permission->setCalendarEvent($event);
        $permission->setPermissionType(CalendarEventPermissionType::TEAM);
        $permission->setTeam($team);
        $this->em->persist($permission);
        $event->addPermission($permission);

        $this->em->flush();

        $this->assertTrue(
            $this->service->canUserParticipateInEvent($activeUser, $event),
            'Active player should be able to participate in team event.'
        );
    }

    public function testCanParticipateExcludesFuturePlayerFromClubEvent(): void
    {
        $club = $this->createClub('FutureParticipateClub');

        [$futureUser] = $this->createPlayerClubSetup(
            startDate: new DateTime('+10 days'),
            endDate: null,
            club: $club,
        );

        $event = new CalendarEvent();
        $event->setTitle('Club Participate Event');
        $event->setStartDate(new DateTime('+1 day'));
        $this->em->persist($event);

        $permission = new CalendarEventPermission();
        $permission->setCalendarEvent($event);
        $permission->setPermissionType(CalendarEventPermissionType::CLUB);
        $permission->setClub($club);
        $this->em->persist($permission);
        $event->addPermission($permission);

        $this->em->flush();

        $this->assertFalse(
            $this->service->canUserParticipateInEvent($futureUser, $event),
            'Player with future club assignment should NOT be able to participate.'
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  Mixed: player with multiple assignments (one active, one expired)
    // ═══════════════════════════════════════════════════════════════════════════

    public function testPlayerWithOneActiveAndOneExpiredAssignmentIsInTeam(): void
    {
        $team = $this->createTeam('MultiAssignTeam');
        $user = $this->createUser('multi-assign');
        $player = $this->createPlayer('multi-assign');
        $this->linkUserToPlayer($user, $player);

        // Expired assignment
        $expired = new PlayerTeamAssignment();
        $expired->setPlayer($player);
        $expired->setTeam($team);
        $expired->setStartDate(new DateTime('-60 days'));
        $expired->setEndDate(new DateTime('-30 days'));
        $this->em->persist($expired);

        // Active assignment (re-joined)
        $active = new PlayerTeamAssignment();
        $active->setPlayer($player);
        $active->setTeam($team);
        $active->setStartDate(new DateTime('-5 days'));
        $active->setEndDate(null);
        $this->em->persist($active);

        $this->em->flush();

        $this->assertTrue(
            $this->service->isUserInTeam($user, $team),
            'Player with one active and one expired assignment should still be in the team.'
        );
    }

    public function testPlayerWithOnlyExpiredAssignmentsIsNotInTeam(): void
    {
        $team = $this->createTeam('AllExpiredAssignTeam');
        $user = $this->createUser('all-expired');
        $player = $this->createPlayer('all-expired');
        $this->linkUserToPlayer($user, $player);

        $expired1 = new PlayerTeamAssignment();
        $expired1->setPlayer($player);
        $expired1->setTeam($team);
        $expired1->setStartDate(new DateTime('-60 days'));
        $expired1->setEndDate(new DateTime('-30 days'));
        $this->em->persist($expired1);

        $expired2 = new PlayerTeamAssignment();
        $expired2->setPlayer($player);
        $expired2->setTeam($team);
        $expired2->setStartDate(new DateTime('-25 days'));
        $expired2->setEndDate(new DateTime('-1 day'));
        $this->em->persist($expired2);

        $this->em->flush();

        $this->assertFalse(
            $this->service->isUserInTeam($user, $team),
            'Player with only expired assignments should NOT be in the team.'
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  Fixture creation helpers
    // ═══════════════════════════════════════════════════════════════════════════

    private function createSharedFixtures(): void
    {
        // Position (required for Player)
        $this->position = new Position();
        $this->position->setName('TEST_POS_' . uniqid());
        $this->em->persist($this->position);

        // AgeGroup (required for Team)
        $this->ageGroup = new AgeGroup();
        $this->ageGroup->setCode('TEST_AG_' . uniqid());
        $this->ageGroup->setName('Test Age Group');
        $this->ageGroup->setEnglishName('Test Age Group EN');
        $this->ageGroup->setMinAge(10);
        $this->ageGroup->setMaxAge(12);
        $this->ageGroup->setReferenceDate('01-01');
        $this->em->persist($this->ageGroup);

        // RelationType for player
        $this->playerRelationType = new RelationType();
        $this->playerRelationType->setIdentifier('test_player_' . uniqid());
        $this->playerRelationType->setName('Spieler');
        $this->playerRelationType->setCategory('player');
        $this->em->persist($this->playerRelationType);

        // RelationType for coach
        $this->coachRelationType = new RelationType();
        $this->coachRelationType->setIdentifier('test_coach_' . uniqid());
        $this->coachRelationType->setName('Trainer');
        $this->coachRelationType->setCategory('coach');
        $this->em->persist($this->coachRelationType);

        $this->em->flush();
    }

    private int $userCounter = 0;

    private function createUser(string $prefix): User
    {
        $user = new User();
        $user->setEmail($prefix . '_' . (++$this->userCounter) . '_' . uniqid() . '@test.local');
        $user->setFirstName('Test');
        $user->setLastName($prefix);
        $user->setPassword('$2y$13$dummyhash');
        $user->setIsVerified(true);
        $user->setIsEnabled(true);
        $this->em->persist($user);

        return $user;
    }

    private function createPlayer(string $prefix): Player
    {
        $player = new Player();
        $player->setFirstName('Player');
        $player->setLastName($prefix);
        $player->setMainPosition($this->position);
        $this->em->persist($player);

        return $player;
    }

    private function createCoach(string $prefix): Coach
    {
        $coach = new Coach();
        $coach->setFirstName('Coach');
        $coach->setLastName($prefix);
        $this->em->persist($coach);

        return $coach;
    }

    private function createTeam(string $name): Team
    {
        $team = new Team();
        $team->setName($name . '_' . uniqid());
        $team->setAgeGroup($this->ageGroup);
        $this->em->persist($team);

        return $team;
    }

    private function createClub(string $name): Club
    {
        $club = new Club();
        $club->setName($name . '_' . uniqid());
        $this->em->persist($club);

        return $club;
    }

    private function linkUserToPlayer(User $user, Player $player): UserRelation
    {
        $relation = new UserRelation();
        $relation->setUser($user);
        $relation->setPlayer($player);
        $relation->setRelationType($this->playerRelationType);
        $this->em->persist($relation);

        return $relation;
    }

    private function linkUserToCoach(User $user, Coach $coach): UserRelation
    {
        $relation = new UserRelation();
        $relation->setUser($user);
        $relation->setCoach($coach);
        $relation->setRelationType($this->coachRelationType);
        $this->em->persist($relation);

        return $relation;
    }

    /**
     * Creates User → Player → PlayerTeamAssignment with given dates.
     *
     * @return array{User, Team} Returns [user, team] tuple
     */
    private function createPlayerTeamSetup(
        ?DateTimeInterface $startDate,
        ?DateTimeInterface $endDate,
        ?Team $team = null,
    ): array {
        $team = $team ?? $this->createTeam('PTA');
        $user = $this->createUser('pta');
        $player = $this->createPlayer('pta');
        $this->linkUserToPlayer($user, $player);

        $assignment = new PlayerTeamAssignment();
        $assignment->setPlayer($player);
        $assignment->setTeam($team);
        $assignment->setStartDate($startDate);
        $assignment->setEndDate($endDate);
        $this->em->persist($assignment);

        $this->em->flush();

        return [$user, $team];
    }

    /**
     * Creates User → Coach → CoachTeamAssignment with given dates.
     *
     * @return array{User, Team}
     */
    private function createCoachTeamSetup(
        ?DateTimeInterface $startDate,
        ?DateTimeInterface $endDate,
        ?Team $team = null,
    ): array {
        $team = $team ?? $this->createTeam('CTA');
        $user = $this->createUser('cta');
        $coach = $this->createCoach('cta');
        $this->linkUserToCoach($user, $coach);

        $assignment = new CoachTeamAssignment();
        $assignment->setCoach($coach);
        $assignment->setTeam($team);
        $assignment->setStartDate($startDate);
        $assignment->setEndDate($endDate);
        $this->em->persist($assignment);

        $this->em->flush();

        return [$user, $team];
    }

    /**
     * Creates User → Player → PlayerClubAssignment with given dates.
     *
     * @return array{User, Club}
     */
    private function createPlayerClubSetup(
        DateTimeInterface $startDate,
        ?DateTimeInterface $endDate,
        ?Club $club = null,
    ): array {
        $club = $club ?? $this->createClub('PCA');
        $user = $this->createUser('pca');
        $player = $this->createPlayer('pca');
        $this->linkUserToPlayer($user, $player);

        $assignment = new PlayerClubAssignment();
        $assignment->setPlayer($player);
        $assignment->setClub($club);
        $assignment->setStartDate($startDate);
        $assignment->setEndDate($endDate);
        $this->em->persist($assignment);

        $this->em->flush();

        return [$user, $club];
    }

    /**
     * Creates User → Coach → CoachClubAssignment with given dates.
     *
     * @return array{User, Club}
     */
    private function createCoachClubSetup(
        DateTimeInterface $startDate,
        ?DateTimeInterface $endDate,
        ?Club $club = null,
    ): array {
        $club = $club ?? $this->createClub('CCA');
        $user = $this->createUser('cca');
        $coach = $this->createCoach('cca');
        $this->linkUserToCoach($user, $coach);

        $assignment = new CoachClubAssignment();
        $assignment->setCoach($coach);
        $assignment->setClub($club);
        $assignment->setStartDate($startDate);
        $assignment->setEndDate($endDate);
        $this->em->persist($assignment);

        $this->em->flush();

        return [$user, $club];
    }

    /**
     * Creates a full user+player+team-assignment chain and returns the User.
     * Used by resolveTeamMembers and resolveEventRecipients tests.
     */
    private function createPlayerWithTeamAssignment(
        Team $team,
        string $prefix,
        ?DateTimeInterface $startDate,
        ?DateTimeInterface $endDate,
    ): User {
        $user = $this->createUser($prefix);
        $player = $this->createPlayer($prefix);
        $this->linkUserToPlayer($user, $player);

        $assignment = new PlayerTeamAssignment();
        $assignment->setPlayer($player);
        $assignment->setTeam($team);
        $assignment->setStartDate($startDate);
        $assignment->setEndDate($endDate);
        $this->em->persist($assignment);

        return $user;
    }

    /**
     * Creates a full user+coach+team-assignment chain and returns the User.
     */
    private function createCoachWithTeamAssignment(
        Team $team,
        string $prefix,
        ?DateTimeInterface $startDate,
        ?DateTimeInterface $endDate,
    ): User {
        $user = $this->createUser($prefix);
        $coach = $this->createCoach($prefix);
        $this->linkUserToCoach($user, $coach);

        $assignment = new CoachTeamAssignment();
        $assignment->setCoach($coach);
        $assignment->setTeam($team);
        $assignment->setStartDate($startDate);
        $assignment->setEndDate($endDate);
        $this->em->persist($assignment);

        return $user;
    }

    /**
     * Creates a full user+player+club-assignment chain and returns the User.
     */
    private function createPlayerWithClubAssignment(
        Club $club,
        string $prefix,
        DateTimeInterface $startDate,
        ?DateTimeInterface $endDate,
    ): User {
        $user = $this->createUser($prefix);
        $player = $this->createPlayer($prefix);
        $this->linkUserToPlayer($user, $player);

        $assignment = new PlayerClubAssignment();
        $assignment->setPlayer($player);
        $assignment->setClub($club);
        $assignment->setStartDate($startDate);
        $assignment->setEndDate($endDate);
        $this->em->persist($assignment);

        return $user;
    }

    /**
     * Creates a full user+coach+club-assignment chain and returns the User.
     */
    private function createCoachWithClubAssignment(
        Club $club,
        string $prefix,
        DateTimeInterface $startDate,
        ?DateTimeInterface $endDate,
    ): User {
        $user = $this->createUser($prefix);
        $coach = $this->createCoach($prefix);
        $this->linkUserToCoach($user, $coach);

        $assignment = new CoachClubAssignment();
        $assignment->setCoach($coach);
        $assignment->setClub($club);
        $assignment->setStartDate($startDate);
        $assignment->setEndDate($endDate);
        $this->em->persist($assignment);

        return $user;
    }

    private function createCalendarEventWithTeamPermission(Team $team): CalendarEvent
    {
        $event = new CalendarEvent();
        $event->setTitle('Team Event ' . uniqid());
        $event->setStartDate(new DateTime('+1 day'));
        $this->em->persist($event);

        $permission = new CalendarEventPermission();
        $permission->setCalendarEvent($event);
        $permission->setPermissionType(CalendarEventPermissionType::TEAM);
        $permission->setTeam($team);
        $this->em->persist($permission);

        $event->addPermission($permission);

        return $event;
    }

    private function createCalendarEventWithClubPermission(Club $club): CalendarEvent
    {
        $event = new CalendarEvent();
        $event->setTitle('Club Event ' . uniqid());
        $event->setStartDate(new DateTime('+1 day'));
        $this->em->persist($event);

        $permission = new CalendarEventPermission();
        $permission->setCalendarEvent($event);
        $permission->setPermissionType(CalendarEventPermissionType::CLUB);
        $permission->setClub($club);
        $this->em->persist($permission);

        $event->addPermission($permission);

        return $event;
    }
}
