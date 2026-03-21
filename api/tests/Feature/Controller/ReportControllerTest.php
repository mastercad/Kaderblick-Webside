<?php

namespace App\Tests\Feature\Controller;

use App\Entity\ReportDefinition;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Feature-Tests für ReportController (API).
 *
 * Geprüft werden:
 *  – GET  /api/report/available         → gibt Templates + eigene Reports zurück
 *  – GET  /api/report/definitions       → gibt Templates und eigene Reports getrennt zurück
 *  – GET  /api/report/definition/{id}   → Zugriffsschutz (eigener Report / Template / fremd)
 *  – POST /api/report/definition        → Report anlegen, Pflichtfeldvalidierung
 *  – PUT  /api/report/definition/{id}   → Report aktualisieren, Zugriffsschutz
 *  – DELETE /api/report/definition/{id} → Report löschen, Zugriffsschutz
 *  – Nicht authentifizierte Requests    → 401
 */
class ReportControllerTest extends WebTestCase
{
    private const PREFIX = 'rpt-ctrl-test-';
    private const BASIC_CONFIG = [
        'diagramType' => 'bar',
        'xField' => 'player',
        'yField' => 'goals',
        'filters' => [],
        'groupBy' => [],
        'metrics' => [],
        'showLegend' => true,
        'showLabels' => false,
    ];

    private KernelBrowser $client;
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        self::ensureKernelShutdown();
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
    }

    // =========================================================================
    //  Authentifizierung
    // =========================================================================

    public function testUnauthenticatedRequestIsRejected(): void
    {
        $this->client->request('GET', '/api/report/available');
        $this->assertResponseStatusCodeSame(401);
    }

    // =========================================================================
    //  GET /api/report/available
    // =========================================================================

    public function testAvailableReturnsOwnReportsAndTemplates(): void
    {
        $user = $this->createUser(self::PREFIX . 'avail-user@example.com');
        $other = $this->createUser(self::PREFIX . 'avail-other@example.com');
        $template = $this->createTemplateReport(self::PREFIX . 'Avail Template');
        $own = $this->createOwnedReport(self::PREFIX . 'Avail Own', $user);
        $foreign = $this->createOwnedReport(self::PREFIX . 'Avail Foreign', $other);

        $this->client->loginUser($user);
        $this->client->request('GET', '/api/report/available');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertIsArray($data);

        $ids = array_column($data, 'id');
        $this->assertContains($template->getId(), $ids, 'Template must be in available list.');
        $this->assertContains($own->getId(), $ids, 'Own report must be in available list.');
        $this->assertNotContains($foreign->getId(), $ids, 'Other user\'s report must not appear.');
    }

    public function testAvailableContainsIsTemplateFlag(): void
    {
        $user = $this->createUser(self::PREFIX . 'avail-flag@example.com');
        $template = $this->createTemplateReport(self::PREFIX . 'Flag Template');
        $own = $this->createOwnedReport(self::PREFIX . 'Flag Own', $user);

        $this->client->loginUser($user);
        $this->client->request('GET', '/api/report/available');

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $byId = array_column($data, null, 'id');

        $this->assertTrue($byId[$template->getId()]['isTemplate']);
        $this->assertFalse($byId[$own->getId()]['isTemplate']);
    }

    // =========================================================================
    //  GET /api/report/definitions
    // =========================================================================

    public function testDefinitionsReturnsSeparatedTemplatesAndUserReports(): void
    {
        $user = $this->createUser(self::PREFIX . 'defs-user@example.com');
        $template = $this->createTemplateReport(self::PREFIX . 'Defs Template');
        $own = $this->createOwnedReport(self::PREFIX . 'Defs Own', $user);

        $this->client->loginUser($user);
        $this->client->request('GET', '/api/report/definitions');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('templates', $data);
        $this->assertArrayHasKey('userReports', $data);

        $templateIds = array_column($data['templates'], 'id');
        $userReportIds = array_column($data['userReports'], 'id');

        $this->assertContains($template->getId(), $templateIds);
        $this->assertContains($own->getId(), $userReportIds);
        $this->assertNotContains($own->getId(), $templateIds, 'Own report must not appear in templates.');
    }

    // =========================================================================
    //  GET /api/report/definition/{id}
    // =========================================================================

    public function testGetDefinitionReturnsOwnReport(): void
    {
        $user = $this->createUser(self::PREFIX . 'get-own@example.com');
        $report = $this->createOwnedReport(self::PREFIX . 'Get Own', $user);

        $this->client->loginUser($user);
        $this->client->request('GET', '/api/report/definition/' . $report->getId());

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame($report->getId(), $data['id']);
        $this->assertArrayHasKey('config', $data);
        $this->assertArrayHasKey('isTemplate', $data);
    }

    public function testGetDefinitionReturnsTemplate(): void
    {
        $user = $this->createUser(self::PREFIX . 'get-tpl@example.com');
        $template = $this->createTemplateReport(self::PREFIX . 'Get Template');

        $this->client->loginUser($user);
        $this->client->request('GET', '/api/report/definition/' . $template->getId());

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($data['isTemplate']);
    }

    public function testGetDefinitionDeniesAccessToOtherUsersReport(): void
    {
        $owner = $this->createUser(self::PREFIX . 'get-owner@example.com');
        $visitor = $this->createUser(self::PREFIX . 'get-visitor@example.com');
        $report = $this->createOwnedReport(self::PREFIX . 'Get Foreign', $owner);

        $this->client->loginUser($visitor);
        $this->client->request('GET', '/api/report/definition/' . $report->getId());

        $this->assertResponseStatusCodeSame(403);
    }

    public function testGetDefinitionReturns404ForUnknownId(): void
    {
        $user = $this->createUser(self::PREFIX . 'get-404@example.com');

        $this->client->loginUser($user);
        $this->client->request('GET', '/api/report/definition/9999999');

        $this->assertResponseStatusCodeSame(404);
    }

    // =========================================================================
    //  POST /api/report/definition
    // =========================================================================

    public function testCreateReportSucceeds(): void
    {
        $user = $this->createUser(self::PREFIX . 'create@example.com');

        $this->client->loginUser($user);
        $this->client->request(
            'POST',
            '/api/report/definition',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['name' => self::PREFIX . 'New Report', 'config' => self::BASIC_CONFIG]),
        );

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('id', $data);
        $this->assertIsInt($data['id']);

        $report = $this->em->find(ReportDefinition::class, $data['id']);
        $this->assertNotNull($report);
        $this->assertSame(self::PREFIX . 'New Report', $report->getName());
        $this->assertSame($user->getId(), $report->getUser()->getId());
        $this->assertFalse($report->isTemplate());
    }

    public function testCreateReportRequiresName(): void
    {
        $user = $this->createUser(self::PREFIX . 'create-noname@example.com');

        $this->client->loginUser($user);
        $this->client->request(
            'POST',
            '/api/report/definition',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['config' => self::BASIC_CONFIG]),
        );

        $this->assertResponseStatusCodeSame(400);
    }

    public function testCreateReportRequiresConfig(): void
    {
        $user = $this->createUser(self::PREFIX . 'create-nocfg@example.com');

        $this->client->loginUser($user);
        $this->client->request(
            'POST',
            '/api/report/definition',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['name' => self::PREFIX . 'No Config']),
        );

        $this->assertResponseStatusCodeSame(400);
    }

    public function testCreateReportRejectsInvalidMetricToken(): void
    {
        $user = $this->createUser(self::PREFIX . 'create-badmetric@example.com');
        $config = array_merge(self::BASIC_CONFIG, ['metrics' => ['__invalid_metric__']]);

        $this->client->loginUser($user);
        $this->client->request(
            'POST',
            '/api/report/definition',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['name' => self::PREFIX . 'Bad Metric', 'config' => $config]),
        );

        $this->assertResponseStatusCodeSame(400);
    }

    // =========================================================================
    //  PUT /api/report/definition/{id}
    // =========================================================================

    public function testUpdateOwnReportSucceeds(): void
    {
        $user = $this->createUser(self::PREFIX . 'update@example.com');
        $report = $this->createOwnedReport(self::PREFIX . 'Update Me', $user);

        $this->client->loginUser($user);
        $this->client->request(
            'PUT',
            '/api/report/definition/' . $report->getId(),
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['name' => self::PREFIX . 'Updated Name', 'config' => self::BASIC_CONFIG]),
        );

        $this->assertResponseIsSuccessful();
        $this->em->clear();
        $updated = $this->em->find(ReportDefinition::class, $report->getId());
        $this->assertSame(self::PREFIX . 'Updated Name', $updated->getName());
    }

    public function testUpdateDeniesAccessToOtherUsersReport(): void
    {
        $owner = $this->createUser(self::PREFIX . 'upd-owner@example.com');
        $visitor = $this->createUser(self::PREFIX . 'upd-visitor@example.com');
        $report = $this->createOwnedReport(self::PREFIX . 'Update Foreign', $owner);

        $this->client->loginUser($visitor);
        $this->client->request(
            'PUT',
            '/api/report/definition/' . $report->getId(),
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['name' => self::PREFIX . 'Hacked', 'config' => self::BASIC_CONFIG]),
        );

        $this->assertResponseStatusCodeSame(403);
    }

    public function testUpdatePreservesDescriptionWhenNotProvided(): void
    {
        $user = $this->createUser(self::PREFIX . 'upd-desc@example.com');
        $report = $this->createOwnedReport(self::PREFIX . 'Update Desc', $user, 'Ursprüngliche Beschreibung');

        $this->client->loginUser($user);
        $this->client->request(
            'PUT',
            '/api/report/definition/' . $report->getId(),
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['name' => self::PREFIX . 'Update Desc Changed', 'config' => self::BASIC_CONFIG]),
        );

        $this->assertResponseIsSuccessful();
        $this->em->clear();
        $updated = $this->em->find(ReportDefinition::class, $report->getId());
        // description not in body → must not be overwritten
        $this->assertSame('Ursprüngliche Beschreibung', $updated->getDescription());
    }

    // =========================================================================
    //  DELETE /api/report/definition/{id}
    // =========================================================================

    public function testDeleteOwnReportSucceeds(): void
    {
        $user = $this->createUser(self::PREFIX . 'del@example.com');
        $report = $this->createOwnedReport(self::PREFIX . 'Delete Me', $user);
        $id = $report->getId();

        $this->client->loginUser($user);
        $this->client->request('DELETE', '/api/report/definition/' . $id);

        $this->assertResponseIsSuccessful();
        $this->em->clear();
        $this->assertNull($this->em->find(ReportDefinition::class, $id), 'Deleted report must no longer exist.');
    }

    public function testDeleteDeniesAccessToOtherUsersReport(): void
    {
        $owner = $this->createUser(self::PREFIX . 'del-owner@example.com');
        $visitor = $this->createUser(self::PREFIX . 'del-visitor@example.com');
        $report = $this->createOwnedReport(self::PREFIX . 'Delete Foreign', $owner);

        $this->client->loginUser($visitor);
        $this->client->request('DELETE', '/api/report/definition/' . $report->getId());

        $this->assertResponseStatusCodeSame(403);
        $this->em->clear();
        $this->assertNotNull($this->em->find(ReportDefinition::class, $report->getId()), 'Report must still exist after denied delete.');
    }

    // =========================================================================
    //  Helpers
    // =========================================================================

    /** @param string[] $roles */
    private function createUser(string $email, array $roles = ['ROLE_USER']): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setFirstName('Test');
        $user->setLastName('User');
        $user->setPassword('password');
        $user->setRoles($roles);
        $user->setIsEnabled(true);
        $user->setIsVerified(true);
        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    private function createTemplateReport(string $name): ReportDefinition
    {
        $report = new ReportDefinition();
        $report->setName($name);
        $report->setConfig(self::BASIC_CONFIG);
        $report->setIsTemplate(true);
        $report->setUser(null);
        $this->em->persist($report);
        $this->em->flush();

        return $report;
    }

    private function createOwnedReport(string $name, User $owner, ?string $description = null): ReportDefinition
    {
        $report = new ReportDefinition();
        $report->setName($name);
        $report->setConfig(self::BASIC_CONFIG);
        $report->setDescription($description);
        $report->setIsTemplate(false);
        $report->setUser($owner);
        $this->em->persist($report);
        $this->em->flush();

        return $report;
    }

    protected function tearDown(): void
    {
        $conn = $this->em->getConnection();

        $conn->executeStatement(
            'DELETE dw FROM dashboard_widgets dw
             INNER JOIN report_definitions rd ON rd.id = dw.report_definition_id
             WHERE rd.name LIKE :prefix',
            ['prefix' => self::PREFIX . '%'],
        );
        $conn->executeStatement('DELETE FROM report_definitions WHERE name LIKE :prefix', ['prefix' => self::PREFIX . '%']);
        $conn->executeStatement('DELETE FROM users WHERE email LIKE :prefix', ['prefix' => self::PREFIX . '%']);

        $this->em->close();
        parent::tearDown();
        restore_exception_handler();
    }
}
