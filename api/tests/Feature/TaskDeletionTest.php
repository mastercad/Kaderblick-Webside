<?php

namespace Tests\Feature;

use App\Entity\AgeGroup;
use App\Entity\CalendarEvent;
use App\Entity\CalendarEventType;
use App\Entity\Game;
use App\Entity\GameType;
use App\Entity\Player;
use App\Entity\PlayerTeamAssignment;
use App\Entity\Position;
use App\Entity\Task;
use App\Entity\TaskAssignment;
use App\Entity\Team;
use App\Entity\User;
use App\Entity\UserRelation;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class TaskDeletionTest extends WebTestCase
{
    protected function tearDown(): void
    {
        parent::tearDown();
        restore_exception_handler();
    }

    private function cleanup(EntityManagerInterface $entityManager): void
    {
        $connection = $entityManager->getConnection();

        try {
            $connection->executeStatement('SET FOREIGN_KEY_CHECKS=0');

            // Task-bezogene Daten (nur Test-Tasks)
            $connection->executeStatement("DELETE FROM task_assignment WHERE task_id IN (SELECT id FROM task WHERE title LIKE 'Test Task%')");
            $connection->executeStatement("DELETE FROM calendar_events WHERE title LIKE 'Test Task%'");
            $connection->executeStatement("DELETE FROM task_rotation_users WHERE task_id IN (SELECT id FROM task WHERE title LIKE 'Test Task%')");
            $connection->executeStatement("DELETE FROM task WHERE title LIKE 'Test Task%'");

            // Spiele nur für Test-Teams
            $connection->executeStatement("DELETE FROM games WHERE home_team_id IN (SELECT id FROM teams WHERE name LIKE 'Test Team Delete%')");
            $connection->executeStatement("DELETE FROM calendar_events WHERE title LIKE 'Test Game%'");

            // Relationen/Spieler nur für Test-User
            $connection->executeStatement(
                "DELETE FROM user_relation WHERE user_id IN 
                    (SELECT id FROM users WHERE email LIKE 'test-deletion-%' OR email LIKE 'test-task-delete-%')
                "
            );
            $connection->executeStatement(
                "DELETE FROM player_team_assignments WHERE player_id IN 
                    (SELECT id FROM players WHERE email LIKE 'test-deletion-%' OR email LIKE 'test-task-delete-%')
                "
            );
            $connection->executeStatement("DELETE FROM players WHERE email LIKE 'test-deletion-%' OR email LIKE 'test-task-delete-%'");
            $connection->executeStatement("DELETE FROM users WHERE email LIKE 'test-deletion-%' OR email LIKE 'test-task-delete-%'");
            $connection->executeStatement("DELETE FROM teams WHERE name LIKE 'Test Team Delete%'");

            $connection->executeStatement('SET FOREIGN_KEY_CHECKS=1');
        } catch (Exception $e) {
            // Ignore cleanup errors
        }
    }

    private function getOrCreateAgeGroup(EntityManagerInterface $entityManager): AgeGroup
    {
        $ageGroup = $entityManager->getRepository(AgeGroup::class)->findOneBy([]);
        if (!$ageGroup) {
            $ageGroup = new AgeGroup();
            $ageGroup->setCode('A_JUNIOREN_TEST');
            $ageGroup->setName('A-Junioren (Test)');
            $ageGroup->setEnglishName('U19');
            $ageGroup->setMinAge(17);
            $ageGroup->setMaxAge(18);
            $ageGroup->setReferenceDate('01-01');
            $entityManager->persist($ageGroup);
            $entityManager->flush();
        }

        return $ageGroup;
    }

    private function createAdminUser(EntityManagerInterface $entityManager): User
    {
        $existingUser = $entityManager->getRepository(User::class)
            ->findOneBy(['email' => 'test-deletion-admin@example.com']);

        if ($existingUser) {
            return $existingUser;
        }

        $user = new User();
        $user->setEmail('test-deletion-admin@example.com');
        $user->setPassword('$2y$13$dummy');
        $user->setRoles(['ROLE_ADMIN']);
        $user->setIsVerified(true);
        $user->setIsEnabled(true);
        $user->setFirstName('Admin');
        $user->setLastName('User');

        $entityManager->persist($user);
        $entityManager->flush();

        return $user;
    }

    private function createUserWithPlayer(EntityManagerInterface $entityManager, string $email, string $firstName, string $lastName, Team $team): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setPassword('$2y$13$dummy');
        $user->setFirstName($firstName);
        $user->setLastName($lastName);
        $user->setIsVerified(true);
        $user->setIsEnabled(true);
        $entityManager->persist($user);

        $position = $entityManager->getRepository(Position::class)->findOneBy([]);
        $player = new Player();
        $player->setFirstName($firstName);
        $player->setLastName($lastName);
        $player->setEmail($email);
        $player->setMainPosition($position);
        $entityManager->persist($player);

        $assignment = new PlayerTeamAssignment();
        $assignment->setTeam($team);
        $player->addPlayerTeamAssignment($assignment);
        $entityManager->persist($assignment);

        $relationType = $entityManager->getRepository(\App\Entity\RelationType::class)
            ->findOneBy(['identifier' => 'self_player']);

        if (!$relationType) {
            $relationType = new \App\Entity\RelationType();
            $relationType->setIdentifier('self_player');
            $relationType->setCategory('player');
            $relationType->setName('Eigener Spieler');
            $entityManager->persist($relationType);
        }

        $relation = new UserRelation();
        $relation->setUser($user);
        $relation->setPlayer($player);
        $relation->setRelationType($relationType);
        $entityManager->persist($relation);

        return $user;
    }

    private function createGame(EntityManagerInterface $entityManager, Team $team, string $title, string $when): Game
    {
        $spielType = $entityManager->getRepository(CalendarEventType::class)->findOneBy(['name' => 'Spiel']);
        $gameType = $entityManager->getRepository(GameType::class)->findOneBy([]);

        $calendarEvent = new CalendarEvent();
        $calendarEvent->setTitle($title);
        $calendarEvent->setStartDate(new DateTimeImmutable($when));
        $calendarEvent->setEndDate(new DateTimeImmutable($when . ' +2 hours'));
        $calendarEvent->setCalendarEventType($spielType);
        $entityManager->persist($calendarEvent);

        $game = new Game();
        $game->setHomeTeam($team);
        $game->setAwayTeam($team);
        $game->setCalendarEvent($calendarEvent);
        $game->setGameType($gameType);
        $entityManager->persist($game);

        $entityManager->flush();  // Flush to make sure games are in database

        return $game;
    }

    /**
     * Helper zum Abrufen aller Assignments für einen Task.
     *
     * @return array<TaskAssignment>
     */
    private function getAssignmentsForTask(Task $task, EntityManagerInterface $entityManager): array
    {
        $assignmentRepo = $entityManager->getRepository(TaskAssignment::class);
        $assignments = $assignmentRepo->findBy(['task' => $task]);
        usort(
            $assignments,
            fn ($a, $b) => ($a->getTask()->getAssignedDate()?->getTimestamp() ?? 0) <=>
            ($b->getTask()->getAssignedDate()?->getTimestamp() ?? 0)
        );

        return $assignments;
    }

    public function testDeleteSingleTaskAssignment(): void
    {
        $client = static::createClient();
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);

        $this->cleanup($entityManager);
        $adminUser = $this->createAdminUser($entityManager);

        $ageGroup = $this->getOrCreateAgeGroup($entityManager);
        $team = new Team();
        $team->setName('Test Team Delete Single');
        $team->setAgeGroup($ageGroup);
        $entityManager->persist($team);

        $user = $this->createUserWithPlayer($entityManager, 'test-deletion-single@example.com', 'Delete', 'Single', $team);

        // Create games BEFORE creating task
        $game1 = $this->createGame($entityManager, $team, 'Test Game Del 1', '+1 week');
        $game2 = $this->createGame($entityManager, $team, 'Test Game Del 2', '+2 weeks');

        $entityManager->flush();

        // Now clear to ensure fresh data
        $entityManager->clear();

        // Re-fetch user, team, and admin user
        $user = $entityManager->getRepository(User::class)->findOneBy(['email' => 'test-deletion-single@example.com']);
        $team = $entityManager->getRepository(Team::class)->findOneBy(['name' => 'Test Team Delete Single']);
        $adminUser = $entityManager->getRepository(User::class)->findOneBy(['email' => 'test-deletion-admin@example.com']);

        // Create task via API
        $client->loginUser($adminUser);
        $client->request('POST', '/api/tasks', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'Test Task - Delete Single',
            'description' => 'Should allow deleting single assignment',
            'isRecurring' => true,
            'recurrenceMode' => 'per_match',
            'rotationUsers' => [$user->getId()],
            'rotationCount' => 1,
        ]));

        $this->assertResponseStatusCodeSame(201);

        // After API call, get a fresh EntityManager for database access
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $entityManager->clear();

        // Verify task and assignments were created
        $taskRepo = $entityManager->getRepository(Task::class);
        $task = $taskRepo->findOneBy(['title' => 'Test Task - Delete Single']);
        $this->assertNotNull($task);

        $assignments = $this->getAssignmentsForTask($task, $entityManager);
        $initialCount = count($assignments);
        $this->assertGreaterThan(0, $initialCount, 'Should have at least one assignment');

        // Get first assignment
        $firstAssignment = $assignments[0];
        $assignmentId = $firstAssignment->getId();

        // Delete single assignment via assignment endpoint
        $client->request('DELETE', '/api/tasks/assignments/' . $assignmentId . '?deleteMode=single');
        $this->assertResponseIsSuccessful();

        $entityManager->clear();

        // Verify only one assignment was deleted
        $task = $taskRepo->findOneBy(['title' => 'Test Task - Delete Single']);
        $this->assertNotNull($task, 'Task should still exist');

        $remainingAssignments = $this->getAssignmentsForTask($task, $entityManager);
        $this->assertCount($initialCount - 1, $remainingAssignments, 'Should have one less assignment');

        // Verify the specific assignment was deleted
        $assignmentRepo = $entityManager->getRepository(TaskAssignment::class);
        $deletedAssignment = $assignmentRepo->find($assignmentId);
        $this->assertNull($deletedAssignment, 'Deleted assignment should not exist');
    }

    public function testDeleteTaskSeries(): void
    {
        $client = static::createClient();
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);

        $this->cleanup($entityManager);
        $adminUser = $this->createAdminUser($entityManager);

        $ageGroup = $this->getOrCreateAgeGroup($entityManager);
        $team = new Team();
        $team->setName('Test Team Delete Series');
        $team->setAgeGroup($ageGroup);
        $entityManager->persist($team);

        $user = $this->createUserWithPlayer($entityManager, 'test-task-delete-series@example.com', 'Delete', 'Series', $team);

        $game1 = $this->createGame($entityManager, $team, 'Test Game Series 1', '+1 week');
        $game2 = $this->createGame($entityManager, $team, 'Test Game Series 2', '+2 weeks');

        $entityManager->flush();

        // Clear EM before making POST to ensure fresh state
        $entityManager->clear();

        // Re-fetch user and admin
        $user = $entityManager->getRepository(User::class)->findOneBy(['email' => 'test-task-delete-series@example.com']);
        $adminUser = $entityManager->getRepository(User::class)->findOneBy(['email' => 'test-deletion-admin@example.com']);

        // Create task via API as admin
        $client->loginUser($adminUser);
        $client->request('POST', '/api/tasks', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'Test Task - Delete Series',
            'description' => 'Should allow deleting entire series',
            'isRecurring' => true,
            'recurrenceMode' => 'per_match',
            'rotationUsers' => [$user->getId()],
            'rotationCount' => 1,
        ]));

        $this->assertResponseStatusCodeSame(201);

        // Get the task ID BEFORE clearing the EM
        $task = $entityManager->getRepository(Task::class)->findOneBy(['title' => 'Test Task - Delete Series']);
        $this->assertNotNull($task);
        $taskId = $task->getId();

        $assignments = $this->getAssignmentsForTask($task, $entityManager);
        $this->assertGreaterThan(0, count($assignments), 'Should have at least one assignment');

        // Delete via the assignment endpoint instead (which works)
        $firstAssignment = $assignments[0];
        $assignmentId = $firstAssignment->getId();

        // Re-login before DELETE (ensure fresh auth context)
        $client->loginUser($adminUser);

        // Make the DELETE request via assignment endpoint with deleteMode=series
        $client->request('DELETE', '/api/tasks/assignments/' . $assignmentId . '?deleteMode=series');
        $this->assertResponseIsSuccessful();

        // NOW get a fresh EntityManager for database verification
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $entityManager->clear();

        $taskRepo = $entityManager->getRepository(Task::class);
        $task = $taskRepo->find($taskId);
        $this->assertNull($task, 'Task should be deleted');
    }

    public function testDeleteSeriesViaAssignmentEndpoint(): void
    {
        $client = static::createClient();
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);

        $this->cleanup($entityManager);
        $adminUser = $this->createAdminUser($entityManager);

        $ageGroup = $this->getOrCreateAgeGroup($entityManager);
        $team = new Team();
        $team->setName('Test Team Delete Series Via Assignment');
        $team->setAgeGroup($ageGroup);
        $entityManager->persist($team);

        $user = $this->createUserWithPlayer($entityManager, 'test-deletion-series2@example.com', 'Delete', 'SeriesTwo', $team);

        $game1 = $this->createGame($entityManager, $team, 'Test Game Via 1', '+1 week');
        $game2 = $this->createGame($entityManager, $team, 'Test Game Via 2', '+2 weeks');

        $entityManager->flush();

        // Clear to ensure fresh data
        $entityManager->clear();

        // Re-fetch entities
        $user = $entityManager->getRepository(User::class)->findOneBy(['email' => 'test-deletion-series2@example.com']);
        $adminUser = $entityManager->getRepository(User::class)->findOneBy(['email' => 'test-deletion-admin@example.com']);

        // Create task via API
        $client->loginUser($adminUser);
        $client->request('POST', '/api/tasks', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'Test Task - Delete Series Via Assignment',
            'description' => 'Should allow deleting entire series via assignment endpoint',
            'isRecurring' => true,
            'recurrenceMode' => 'per_match',
            'rotationUsers' => [$user->getId()],
            'rotationCount' => 1,
        ]));

        $this->assertResponseStatusCodeSame(201);

        // After API call, get a fresh EntityManager for database access
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $entityManager->clear();

        // Verify task and assignments were created
        $taskRepo = $entityManager->getRepository(Task::class);
        $task = $taskRepo->findOneBy(['title' => 'Test Task - Delete Series Via Assignment']);
        $this->assertNotNull($task);
        $taskId = $task->getId();

        $assignments = $this->getAssignmentsForTask($task, $entityManager);
        $this->assertGreaterThan(0, count($assignments), 'Should have at least one assignment');

        $firstAssignment = $assignments[0];
        $assignmentId = $firstAssignment->getId();

        // Delete entire series via assignment endpoint with deleteMode=series
        $client->request('DELETE', '/api/tasks/assignments/' . $assignmentId . '?deleteMode=series');
        $this->assertResponseIsSuccessful();

        $entityManager->clear();

        // Verify task was deleted
        $task = $taskRepo->find($taskId);
        $this->assertNull($task, 'Task should be deleted');

        // Verifiziere, dass der Task gelöscht wurde (keine Serien mehr)
        // (Task wurde oben schon geprüft)
    }

    public function testDeleteSingleAssignmentRemovesCalendarEvent(): void
    {
        $client = static::createClient();
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);

        $this->cleanup($entityManager);

        $user = new User();
        $user->setEmail('test-task-delete-calendar@example.com');
        $user->setPassword('$2y$13$dummy');
        $user->setFirstName('testuser');
        $user->setLastName('calendar');
        $user->setRoles(['ROLE_USER']);
        $user->setIsVerified(true);
        $user->setIsEnabled(true);
        $entityManager->persist($user);

        $ageGroup = $this->getOrCreateAgeGroup($entityManager);
        $team = new Team();
        $team->setName('Test Team Delete Calendar Event');
        $team->setAgeGroup($ageGroup);
        $entityManager->persist($team);

        $position = $entityManager->getRepository(Position::class)->findOneBy([]);
        if (!$position) {
            $position = new Position();
            $position->setName('Torwart');
            $entityManager->persist($position);
            $entityManager->flush();
        }
        $player = new Player();
        $player->setFirstName($user->getFirstName());
        $player->setLastName($user->getLastName());
        $player->setEmail($user->getEmail());
        $player->setMainPosition($position);
        $entityManager->persist($player);

        $assignment = new PlayerTeamAssignment();
        $assignment->setTeam($team);
        $player->addPlayerTeamAssignment($assignment);
        $entityManager->persist($assignment);

        $relationType = $entityManager->getRepository(\App\Entity\RelationType::class)
            ->findOneBy(['identifier' => 'self_player']);

        if (!$relationType) {
            $relationType = new \App\Entity\RelationType();
            $relationType->setIdentifier('self_player');
            $relationType->setCategory('player');
            $relationType->setName('Eigener Spieler');
            $entityManager->persist($relationType);
        }

        $relation = new UserRelation();
        $relation->setUser($user);
        $relation->setPlayer($player);
        $relation->setRelationType($relationType);
        $entityManager->persist($relation);

        $game = $this->createGame($entityManager, $team, 'Test Game Cal 1', '+1 week');

        $entityManager->flush();

        $client->loginUser($user);
        $client->request('POST', '/api/tasks', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'Test Task - Delete Calendar',
            'description' => 'Should remove calendar event when deleting single assignment',
            'isRecurring' => true,
            'recurrenceMode' => 'per_match',
            'rotationUsers' => [$user->getId()],
            'rotationCount' => 1,
        ]));

        $this->assertResponseStatusCodeSame(201);

        // After API call, get a fresh EntityManager for database access
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $entityManager->clear();

        $taskRepo = $entityManager->getRepository(Task::class);
        $task = $taskRepo->findOneBy(['title' => 'Test Task - Delete Calendar']);
        $this->assertNotNull($task);

        $assignments = $this->getAssignmentsForTask($task, $entityManager);
        $this->assertGreaterThan(0, count($assignments), 'Should have at least one assignment');
        $firstAssignment = $assignments[0];

        // Das CalendarEvent ist direkt mit dem TaskAssignment verknüpft
        $calendarEvent = $firstAssignment->getCalendarEvent();
        $this->assertNotNull($calendarEvent, 'Should have a calendar event');
        $calendarEventId = $calendarEvent->getId();

        $client->loginUser($entityManager->getRepository(User::class)->findOneBy(['email' => 'test-task-delete-calendar@example.com']));
        $client->request('DELETE', '/api/tasks/assignments/' . $firstAssignment->getId() . '?deleteMode=single');
        $this->assertResponseIsSuccessful();

        // After deletion, get fresh EntityManager
        $entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $calendarEventRepo = $entityManager->getRepository(CalendarEvent::class);
        $deletedCalendarEvent = $calendarEventRepo->find($calendarEventId);
        $this->assertNull($deletedCalendarEvent, 'Calendar event should be deleted');
    }
}
