<?php

namespace Tests\Feature\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use Tests\Feature\ApiWebTestCase;

/**
 * Tests for DashboardController::index() (GET /).
 *
 * Key behaviour under test (lazy-initialisation fix):
 *  When a verified user has no dashboard widgets – e.g. because the
 *  verification step's createDefaultDashboard() call silently failed –
 *  the controller must create them on-the-fly and return a non-empty
 *  widget list.
 */
class DashboardControllerTest extends ApiWebTestCase
{
    private function getEntityManager(): EntityManagerInterface
    {
        $em = static::getContainer()->get(EntityManagerInterface::class);
        if (!$em->isOpen()) {
            static::getContainer()->get('doctrine')->resetManager();
            $em = static::getContainer()->get(EntityManagerInterface::class);
        }

        return $em;
    }

    private function createVerifiedUserWithoutWidgets(string $email): User
    {
        $user = new User();
        $user->setEmail($email)
            ->setPassword('hashedpassword')
            ->setFirstName('Dashboard')
            ->setLastName('TestUser')
            ->setIsVerified(true)
            ->setIsEnabled(true)
            ->setRoles(['ROLE_USER']);

        $em = $this->getEntityManager();
        $em->persist($user);
        $em->flush();

        return $user;
    }

    private function cleanup(string ...$emails): void
    {
        $connection = $this->getEntityManager()->getConnection();
        try {
            foreach ($emails as $email) {
                $connection->executeStatement(
                    'DELETE FROM dashboard_widgets WHERE user_id IN (SELECT id FROM users WHERE email = ?)',
                    [$email]
                );
                $connection->executeStatement('DELETE FROM users WHERE email = ?', [$email]);
            }
        } catch (Exception) {
            // ignore cleanup errors
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Authentication guard
    // ─────────────────────────────────────────────────────────────────────────

    public function testDashboardReturns401WhenUnauthenticated(): void
    {
        $client = static::createClient();

        $client->request('GET', '/');

        $this->assertResponseStatusCodeSame(401);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Lazy widget initialisation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * A freshly verified user with no widgets must get the 4 base widgets
     * auto-created on their first dashboard request.
     */
    public function testDashboardCreatesBaseWidgetsForNewUser(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();
        $email = 'dash-new-user@example.com';
        $this->cleanup($email);

        $this->createVerifiedUserWithoutWidgets($email);
        $this->authenticateUser($client, $email);

        $client->request('GET', '/');

        $this->assertResponseIsSuccessful();
        $response = json_decode($client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('widgets', $response);
        $this->assertNotEmpty($response['widgets'], 'Dashboard must not be empty for a new user.');

        // The 4 base widget types must all be present
        $types = array_column($response['widgets'], 'type');
        foreach (['calendar', 'upcoming_events', 'news', 'messages'] as $expectedType) {
            $this->assertContains(
                $expectedType,
                $types,
                "Base widget type \"$expectedType\" must be auto-created for new users."
            );
        }

        $this->cleanup($email);
    }

    /**
     * The auto-created widgets must also be persisted in the DB, so that a
     * second request does not create duplicates.
     */
    public function testDashboardWidgetsArePersistedAfterFirstRequest(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();
        $email = 'dash-persist@example.com';
        $this->cleanup($email);

        $this->createVerifiedUserWithoutWidgets($email);
        $this->authenticateUser($client, $email);

        // First request – triggers creation
        $client->request('GET', '/');
        $this->assertResponseIsSuccessful();
        $first = json_decode($client->getResponse()->getContent(), true);

        // Second request – must return the same widgets, not duplicates
        $client->request('GET', '/');
        $this->assertResponseIsSuccessful();
        $second = json_decode($client->getResponse()->getContent(), true);

        $this->assertCount(
            count($first['widgets']),
            $second['widgets'],
            'A second dashboard request must not create additional widgets.'
        );

        $this->cleanup($email);
    }

    /**
     * Response shape: every widget must have the mandatory keys.
     */
    public function testDashboardWidgetResponseShape(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();
        $email = 'dash-shape@example.com';
        $this->cleanup($email);

        $this->createVerifiedUserWithoutWidgets($email);
        $this->authenticateUser($client, $email);

        $client->request('GET', '/');

        $this->assertResponseIsSuccessful();
        $response = json_decode($client->getResponse()->getContent(), true);

        foreach ($response['widgets'] as $widget) {
            foreach (['id', 'type', 'width', 'position', 'isEnabled', 'isDefault'] as $key) {
                $this->assertArrayHasKey($key, $widget, "Widget missing key \"$key\".");
            }
        }

        $this->cleanup($email);
    }
}
