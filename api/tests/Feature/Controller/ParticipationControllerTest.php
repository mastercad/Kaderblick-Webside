<?php

namespace App\Tests\Feature\Controller;

use App\Entity\CalendarEvent;
use App\Entity\CalendarEventType;
use App\Entity\Participation;
use App\Entity\ParticipationStatus;
use App\Entity\User;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ParticipationControllerTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        self::ensureKernelShutdown();
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->entityManager = $container->get(EntityManagerInterface::class);
    }

    public function testGetEventParticipationsReturnsAllEventParticipationsForEligibleUser(): void
    {
        $user1 = $this->createUser('voter-test-user1@example.com');
        $user2 = $this->createUser('voter-test-user2@example.com');
        $eventType = $this->createEventType();
        $event = $this->createEvent($eventType);
        $statusYes = $this->createStatus('voter-test-Zugesagt');
        $statusNo = $this->createStatus('voter-test-Abgesagt');

        // Both users participate in the same event
        $this->createParticipation($event, $user1, $statusYes);
        $this->createParticipation($event, $user2, $statusNo);

        // User1 views the event participations
        $this->client->loginUser($user1);
        $this->client->request('GET', '/api/participation/event/' . $event->getId());

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertCount(2, $data['participations']);

        $returnedUserIds = array_column($data['participations'], 'user_id');
        $this->assertContains($user1->getId(), $returnedUserIds);
        $this->assertContains($user2->getId(), $returnedUserIds);
    }

    private function createUser(string $email): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setFirstName('Test');
        $user->setLastName('User');
        $user->setPassword('password');
        $user->setRoles(['ROLE_USER']);
        $user->setIsEnabled(true);
        $user->setIsVerified(true);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    private function createEventType(): CalendarEventType
    {
        $type = new CalendarEventType();
        $type->setName('voter-test-Training');
        $type->setColor('#000000');
        $this->entityManager->persist($type);
        $this->entityManager->flush();

        return $type;
    }

    private function createEvent(CalendarEventType $type): CalendarEvent
    {
        $event = new CalendarEvent();
        $event->setTitle('voter-test-event');
        $event->setCalendarEventType($type);
        $event->setStartDate(new DateTime());
        $event->setEndDate(new DateTime('+2 hours'));
        $this->entityManager->persist($event);
        $this->entityManager->flush();

        return $event;
    }

    private function createStatus(string $name): ParticipationStatus
    {
        $status = new ParticipationStatus();
        $status->setName($name);
        $status->setCode(strtolower(str_replace(' ', '_', $name)));
        $status->setColor('#000000');
        $this->entityManager->persist($status);
        $this->entityManager->flush();

        return $status;
    }

    private function createParticipation(CalendarEvent $event, User $user, ParticipationStatus $status): Participation
    {
        $participation = new Participation();
        $participation->setEvent($event);
        $participation->setUser($user);
        $participation->setStatus($status);
        $this->entityManager->persist($participation);
        $this->entityManager->flush();

        return $participation;
    }

    protected function tearDown(): void
    {
        $connection = $this->entityManager->getConnection();
        $connection->executeStatement(
            <<<SQL
                DELETE 
                FROM participations
                WHERE id IN (
                    SELECT id 
                    FROM (
                        SELECT p.id 
                        FROM participations p 
                        JOIN calendar_events e 
                        ON p.event_id = e.id 
                        WHERE e.title LIKE "voter-test-%"
                    ) AS tmp
                )
            SQL
        );
        $connection->executeStatement('DELETE FROM calendar_events WHERE title LIKE "voter-test-%"');
        $connection->executeStatement('DELETE FROM calendar_event_types WHERE name LIKE "voter-test-%"');
        $connection->executeStatement('DELETE FROM participation_statuses WHERE name LIKE "voter-test-%"');
        $connection->executeStatement('DELETE FROM users WHERE email LIKE "voter-test-%"');

        $this->entityManager->close();
        parent::tearDown();
        restore_exception_handler();
    }
}
