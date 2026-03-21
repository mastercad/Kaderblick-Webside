<?php

namespace App\Tests\Feature\Controller;

use App\Entity\User;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Feature-Tests für die Kalender-Token-Endpoints.
 *
 *  – GET    /api/profile/calendar/token  → Status (hasToken, createdAt, feeds)
 *  – POST   /api/profile/calendar/token  → Token generieren / rotieren
 *  – DELETE /api/profile/calendar/token  → Token widerrufen
 *
 * Sicherheitstests:
 *  – kcal_-Token darf NIEMALS zur Platform-Authentifizierung genutzt werden
 *  – kcal_-Token wird vom ApiTokenAuthenticator explizit abgelehnt
 *  – Alle Endpoints erfordern Authentifizierung
 */
class CalendarTokenTest extends WebTestCase
{
    private const PREFIX = 'caltoken-test-';
    private const ENDPOINT = '/api/profile/calendar/token';

    /** Erwartete Länge: "kcal_" (5) + bin2hex(28 bytes) = 56 hex-Zeichen → 61 */
    private const TOKEN_LENGTH = 61;

    private KernelBrowser $client;
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        self::ensureKernelShutdown();
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
    }

    // =========================================================================
    //  Unauthentifiziert → 401
    // =========================================================================

    public function testGetStatusRequiresAuth(): void
    {
        $this->client->request('GET', self::ENDPOINT);
        $this->assertResponseStatusCodeSame(401);
    }

    public function testGenerateRequiresAuth(): void
    {
        $this->client->request('POST', self::ENDPOINT);
        $this->assertResponseStatusCodeSame(401);
    }

    public function testRevokeRequiresAuth(): void
    {
        $this->client->request('DELETE', self::ENDPOINT);
        $this->assertResponseStatusCodeSame(401);
    }

    // =========================================================================
    //  GET /api/profile/calendar/token
    // =========================================================================

    public function testGetStatusWhenNoToken(): void
    {
        $user = $this->createUser(self::PREFIX . 'get-notoken@test.example');
        $this->client->loginUser($user);

        $this->client->request('GET', self::ENDPOINT);

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertFalse($data['hasToken'], 'hasToken muss false sein wenn kein Token gesetzt ist.');
        $this->assertNull($data['createdAt'], 'createdAt muss null sein wenn kein Token vorhanden.');
        $this->assertNull($data['feeds'], 'feeds muss null sein wenn kein Token vorhanden.');
    }

    public function testGetStatusWhenTokenExists(): void
    {
        $token = 'kcal_' . bin2hex(random_bytes(28));
        $user = $this->createUser(self::PREFIX . 'get-hastoken@test.example');
        $user->setCalendarToken($token);
        $user->setCalendarTokenCreatedAt(new DateTime('2025-03-01 10:00:00'));
        $this->em->flush();

        $this->client->loginUser($user);
        $this->client->request('GET', self::ENDPOINT);

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertTrue($data['hasToken']);
        $this->assertNotNull($data['createdAt']);
        $this->assertStringContainsString('2025-03-01', $data['createdAt']);

        $this->assertIsArray($data['feeds']);
        $this->assertArrayHasKey('personal', $data['feeds']);
        $this->assertArrayHasKey('club', $data['feeds']);
        $this->assertArrayHasKey('platform', $data['feeds']);
    }

    public function testGetStatusFeedsContainToken(): void
    {
        $token = 'kcal_' . bin2hex(random_bytes(28));
        $user = $this->createUser(self::PREFIX . 'get-feedtoken@test.example');
        $user->setCalendarToken($token);
        $user->setCalendarTokenCreatedAt(new DateTime());
        $this->em->flush();

        $this->client->loginUser($user);
        $this->client->request('GET', self::ENDPOINT);

        $data = json_decode($this->client->getResponse()->getContent(), true);

        foreach ($data['feeds'] as $scope => $url) {
            $this->assertStringContainsString($token, $url, "Feed-URL für '{$scope}' muss den Token enthalten.");
            $this->assertStringEndsWith("{$scope}.ics", $url, "Feed-URL für '{$scope}' muss auf .ics enden.");
        }
    }

    // =========================================================================
    //  POST /api/profile/calendar/token
    // =========================================================================

    public function testGenerateCreatesKcalPrefixedToken(): void
    {
        $user = $this->createUser(self::PREFIX . 'gen-new@test.example');
        $this->client->loginUser($user);

        $this->client->request('POST', self::ENDPOINT);

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('token', $data);
        $this->assertStringStartsWith('kcal_', $data['token'], 'Kalender-Token muss mit kcal_ beginnen.');
        $this->assertSame(
            self::TOKEN_LENGTH,
            strlen($data['token']),
            'Token-Länge muss ' . self::TOKEN_LENGTH . ' Zeichen betragen (kcal_ + 56 hex).'
        );
    }

    public function testGenerateTokenPersistsToDatabase(): void
    {
        $user = $this->createUser(self::PREFIX . 'gen-persist@test.example');
        $this->client->loginUser($user);

        $this->client->request('POST', self::ENDPOINT);
        $tokenInResponse = json_decode($this->client->getResponse()->getContent(), true)['token'];

        $this->em->clear();
        $refreshed = $this->em->find(User::class, $user->getId());

        $this->assertSame($tokenInResponse, $refreshed->getCalendarToken(), 'Token in der DB muss mit der Response übereinstimmen.');
        $this->assertNotNull($refreshed->getCalendarTokenCreatedAt());
    }

    public function testGenerateTokenReturnsFeedUrls(): void
    {
        $user = $this->createUser(self::PREFIX . 'gen-feeds@test.example');
        $this->client->loginUser($user);

        $this->client->request('POST', self::ENDPOINT);

        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertIsArray($data['feeds']);
        foreach (['personal', 'club', 'platform'] as $scope) {
            $this->assertArrayHasKey($scope, $data['feeds']);
            $this->assertStringEndsWith("{$scope}.ics", $data['feeds'][$scope]);
            $this->assertStringContainsString($data['token'], $data['feeds'][$scope]);
        }
    }

    public function testGenerateTokenRotatesPreviousToken(): void
    {
        // Ersten Token direkt via ORM setzen (kein HTTP), damit wir genau einen HTTP-Request
        // für den zweiten Token benötigen.
        $firstToken = 'kcal_' . bin2hex(random_bytes(28));
        $user = $this->createUser(self::PREFIX . 'gen-rotate@test.example');
        $user->setCalendarToken($firstToken);
        $user->setCalendarTokenCreatedAt(new DateTime());
        $this->em->flush();
        $this->em->clear();

        // Frisch aus der DB laden, damit das Entity nicht detached ist
        $user = $this->em->find(User::class, $user->getId());
        $this->client->loginUser($user);
        $this->client->request('POST', self::ENDPOINT);
        $this->assertResponseIsSuccessful();
        $secondToken = json_decode($this->client->getResponse()->getContent(), true)['token'];

        $this->assertNotSame($firstToken, $secondToken, 'Jede Token-Generierung muss einen neuen Token erzeugen.');
        $this->assertStringStartsWith('kcal_', $secondToken);

        $this->em->clear();
        $refreshed = $this->em->find(User::class, $user->getId());
        $this->assertSame($secondToken, $refreshed->getCalendarToken(), 'DB muss den aktuellen Token enthalten.');
        $this->assertNotSame($firstToken, $refreshed->getCalendarToken(), 'Alter Token muss in der DB überschrieben sein.');
    }

    public function testEachGeneratedTokenIsUnique(): void
    {
        // Drei User, jeder einmal POST → drei verschiedene kcal_-Tokens
        $users = [
            $this->createUser(self::PREFIX . 'gen-unique-a@test.example'),
            $this->createUser(self::PREFIX . 'gen-unique-b@test.example'),
            $this->createUser(self::PREFIX . 'gen-unique-c@test.example'),
        ];

        $tokens = [];
        foreach ($users as $u) {
            self::ensureKernelShutdown();
            $freshClient = static::createClient();
            $freshEm = static::getContainer()->get(EntityManagerInterface::class);
            $freshUser = $freshEm->find(User::class, $u->getId());

            $freshClient->loginUser($freshUser);
            $freshClient->request('POST', self::ENDPOINT);

            $response = $freshClient->getResponse();
            $this->assertSame(200, $response->getStatusCode(), 'POST muss Erfolg zurückgeben.');
            $tokens[] = json_decode($response->getContent(), true)['token'];
        }

        $this->assertCount(3, array_unique($tokens), 'Alle generierten Tokens müssen eindeutig sein.');
    }

    // =========================================================================
    //  DELETE /api/profile/calendar/token
    // =========================================================================

    public function testRevokeTokenReturnsSuccess(): void
    {
        $user = $this->createUser(self::PREFIX . 'revoke-ok@test.example');
        $user->setCalendarToken('kcal_' . bin2hex(random_bytes(28)));
        $user->setCalendarTokenCreatedAt(new DateTime());
        $this->em->flush();

        $this->client->loginUser($user);
        $this->client->request('DELETE', self::ENDPOINT);

        $this->assertResponseIsSuccessful();
    }

    public function testRevokeTokenClearsDatabase(): void
    {
        // Token direkt via ORM setzen – dann nur einen HTTP-Request (DELETE) benötigen
        $user = $this->createUser(self::PREFIX . 'revoke-db@test.example');
        $user->setCalendarToken('kcal_' . bin2hex(random_bytes(28)));
        $user->setCalendarTokenCreatedAt(new DateTime());
        $this->em->flush();
        $this->em->clear();

        $user = $this->em->find(User::class, $user->getId());
        $this->client->loginUser($user);
        $this->client->request('DELETE', self::ENDPOINT);
        $this->assertResponseIsSuccessful();

        $this->em->clear();
        $refreshed = $this->em->find(User::class, $user->getId());

        $this->assertNull($refreshed->getCalendarToken(), 'calendarToken muss nach Widerruf null sein.');
        $this->assertNull($refreshed->getCalendarTokenCreatedAt(), 'calendarTokenCreatedAt muss nach Widerruf null sein.');
    }

    public function testGetStatusAfterRevokeShowsNoToken(): void
    {
        // Token direkt via ORM setzen, dann DELETE via HTTP
        $userId = $this->createUser(self::PREFIX . 'revoke-status@test.example')->getId();
        $user = $this->em->find(User::class, $userId);
        $user->setCalendarToken('kcal_' . bin2hex(random_bytes(28)));
        $user->setCalendarTokenCreatedAt(new DateTime());
        $this->em->flush();

        $this->client->loginUser($user);
        $this->client->request('DELETE', self::ENDPOINT);
        $this->assertResponseIsSuccessful();

        // Frischen Kernel für den zweiten Request, da loginUser() nur einmal gilt
        self::ensureKernelShutdown();
        $client2 = static::createClient();
        $em2 = static::getContainer()->get(EntityManagerInterface::class);
        $user2 = $em2->find(User::class, $userId);
        $client2->loginUser($user2);
        $client2->request('GET', self::ENDPOINT);
        $this->assertSame(200, $client2->getResponse()->getStatusCode());

        $data = json_decode($client2->getResponse()->getContent(), true);
        $this->assertFalse($data['hasToken']);
        $this->assertNull($data['feeds']);
    }

    // =========================================================================
    //  SICHERHEIT: kcal_-Token darf KEINE Platform-Authentifizierung bieten
    // =========================================================================

    /**
     * KRITISCHER SICHERHEITSTEST:
     * Ein Kalender-Token (kcal_) darf NIEMALS zur Authentifizierung auf der
     * Platform verwendet werden – selbst wenn er gestohlen wird.
     *
     * Der ApiTokenAuthenticator lehnt kcal_-Tokens explizit ab.
     */
    public function testCalendarTokenCannotAuthenticatePlatformApi(): void
    {
        $user = $this->createUser(self::PREFIX . 'sec-noauth@test.example');
        $this->client->loginUser($user);

        $this->client->request('POST', self::ENDPOINT);
        $kcalToken = json_decode($this->client->getResponse()->getContent(), true)['token'];

        $this->assertStringStartsWith('kcal_', $kcalToken);

        // Neuen Client ohne Session → nur Bearer-Token-Auth
        self::ensureKernelShutdown();
        $anonClient = static::createClient();
        $anonClient->request('GET', '/api/about-me', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $kcalToken,
        ]);

        $this->assertResponseStatusCodeSame(
            401,
            'Ein kcal_-Token darf NIEMALS zur Authentifizierung auf Platform-Endpunkten genutzt werden.'
        );
    }

    public function testCalendarTokenCannotAuthenticateProtectedApiEndpoints(): void
    {
        $user = $this->createUser(self::PREFIX . 'sec-api@test.example');
        $this->client->loginUser($user);

        $this->client->request('POST', self::ENDPOINT);
        $kcalToken = json_decode($this->client->getResponse()->getContent(), true)['token'];

        self::ensureKernelShutdown();
        $anonClient = static::createClient();

        // Test mehrere geschützte Endpunkte
        foreach (['/api/profile/api-token', '/api/profile/calendar/token', '/api/profile/calendar/external'] as $endpoint) {
            $anonClient->request('GET', $endpoint, [], [], [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $kcalToken,
            ]);
            $this->assertResponseStatusCodeSame(
                401,
                "kcal_-Token muss auf '{$endpoint}' mit 401 abgelehnt werden."
            );
        }
    }

    public function testArbitraryKcalTokenCannotAuthenticate(): void
    {
        // Kein echter User – einfach ein gefälschtes kcal_-Token testen
        self::ensureKernelShutdown();
        $anonClient = static::createClient();
        $fakeKcalToken = 'kcal_' . str_repeat('a', 56);

        $anonClient->request('GET', '/api/about-me', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $fakeKcalToken,
        ]);

        $this->assertResponseStatusCodeSame(
            401,
            'Beliebige kcal_-Tokens (auch gefälschte) dürfen nicht authentifizieren.'
        );
    }

    public function testRevokedCalendarTokenStillCannotAuthenticate(): void
    {
        $userId = $this->createUser(self::PREFIX . 'sec-revoked@test.example')->getId();
        $user = $this->em->find(User::class, $userId);

        // Token erzeugen
        $this->client->loginUser($user);
        $this->client->request('POST', self::ENDPOINT);
        $this->assertResponseIsSuccessful();
        $kcalToken = json_decode($this->client->getResponse()->getContent(), true)['token'];
        $this->assertStringStartsWith('kcal_', $kcalToken);

        // Token widerrufen – frischen Kernel für zweiten Request
        self::ensureKernelShutdown();
        $client2 = static::createClient();
        $em2 = static::getContainer()->get(EntityManagerInterface::class);
        $user2 = $em2->find(User::class, $userId);
        $client2->loginUser($user2);
        $client2->request('DELETE', self::ENDPOINT);
        $this->assertSame(200, $client2->getResponse()->getStatusCode(), 'DELETE muss Erfolg zurückgeben.');

        // Token war ohnehin nicht zur API-Authentifizierung geeignet;
        // nach Widerruf ist auch das iCal-Feed ungültig.
        // Sicherstellen, dass der gestohlene Token weiterhin 401 liefert:
        self::ensureKernelShutdown();
        $anonClient = static::createClient();
        $anonClient->request('GET', '/api/profile/calendar/token', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $kcalToken,
        ]);

        $this->assertResponseStatusCodeSame(
            401,
            'Ein widerrufener kcal_-Token darf niemals zur API-Authentifizierung dienen.'
        );
    }

    // =========================================================================
    //  Helper
    // =========================================================================

    /** @param string[] $roles */
    private function createUser(string $email, array $roles = ['ROLE_USER']): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setFirstName('Kalender');
        $user->setLastName('Test');
        $user->setPassword('password');
        $user->setRoles($roles);
        $user->setIsEnabled(true);
        $user->setIsVerified(true);
        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    protected function tearDown(): void
    {
        $conn = $this->em->getConnection();
        $conn->executeStatement(
            'DELETE FROM users WHERE email LIKE :prefix',
            ['prefix' => self::PREFIX . '%']
        );

        $this->em->close();
        parent::tearDown();
        restore_exception_handler();
    }
}
