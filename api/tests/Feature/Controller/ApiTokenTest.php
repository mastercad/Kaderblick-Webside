<?php

namespace App\Tests\Feature\Controller;

use App\Entity\User;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Feature-Tests für die persönlichen API-Token-Endpoints.
 *
 *  – GET    /api/profile/api-token  → Status (hasToken, createdAt)
 *  – POST   /api/profile/api-token  → Token generieren / rotieren
 *  – DELETE /api/profile/api-token  → Token widerrufen
 *  – Authentifizierung via Bearer kbak_… Token auf geschütztem Endpoint
 *  – Ungültiger Token → 401
 *  – Unauthentifizierte Requests → 401
 */
class ApiTokenTest extends WebTestCase
{
    private const PREFIX = 'api-token-test-';
    private const ENDPOINT = '/api/profile/api-token';

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

    public function testGetTokenStatusRequiresAuth(): void
    {
        $this->client->request('GET', self::ENDPOINT);
        $this->assertResponseStatusCodeSame(401);
    }

    public function testGenerateTokenRequiresAuth(): void
    {
        $this->client->request('POST', self::ENDPOINT);
        $this->assertResponseStatusCodeSame(401);
    }

    public function testRevokeTokenRequiresAuth(): void
    {
        $this->client->request('DELETE', self::ENDPOINT);
        $this->assertResponseStatusCodeSame(401);
    }

    // =========================================================================
    //  GET /api/profile/api-token
    // =========================================================================

    public function testGetTokenStatusWhenNoToken(): void
    {
        $user = $this->createUser(self::PREFIX . 'get-notoken@example.com');
        $this->client->loginUser($user);

        $this->client->request('GET', self::ENDPOINT);

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertFalse($data['hasToken'], 'hasToken must be false when no token set.');
        $this->assertNull($data['createdAt'], 'createdAt must be null when no token set.');
    }

    public function testGetTokenStatusWhenTokenExists(): void
    {
        $user = $this->createUser(self::PREFIX . 'get-hastoken@example.com');
        $user->setApiToken('kbak_' . bin2hex(random_bytes(24)));
        $user->setApiTokenCreatedAt(new DateTime('2025-01-15 12:00:00'));
        $this->em->flush();

        $this->client->loginUser($user);
        $this->client->request('GET', self::ENDPOINT);

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertTrue($data['hasToken'], 'hasToken must be true when token is set.');
        $this->assertNotNull($data['createdAt'], 'createdAt must not be null when token exists.');
        $this->assertStringContainsString('2025-01-15', $data['createdAt']);
    }

    public function testGetTokenStatusNeverReturnsActualToken(): void
    {
        $rawToken = 'kbak_' . bin2hex(random_bytes(24));
        $user = $this->createUser(self::PREFIX . 'get-nosecret@example.com');
        $user->setApiToken($rawToken);
        $user->setApiTokenCreatedAt(new DateTime());
        $this->em->flush();

        $this->client->loginUser($user);
        $this->client->request('GET', self::ENDPOINT);

        $body = $this->client->getResponse()->getContent();
        $this->assertStringNotContainsString($rawToken, $body, 'GET must never return the actual token value.');
    }

    // =========================================================================
    //  POST /api/profile/api-token
    // =========================================================================

    public function testGenerateTokenReturnsValidToken(): void
    {
        $user = $this->createUser(self::PREFIX . 'gen-new@example.com');
        $this->client->loginUser($user);

        $this->client->request('POST', self::ENDPOINT);

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('token', $data);
        $this->assertArrayHasKey('createdAt', $data);
        $this->assertStringStartsWith('kbak_', $data['token'], 'token must start with kbak_ prefix.');
        $this->assertSame(53, strlen($data['token']), 'token must be 53 chars (kbak_ + 48 hex).');
    }

    public function testGenerateTokenSetsHasTokenOnSubsequentGet(): void
    {
        $user = $this->createUser(self::PREFIX . 'gen-status@example.com');
        $this->client->loginUser($user);

        $this->client->request('POST', self::ENDPOINT);
        $this->assertResponseIsSuccessful();
        $token = json_decode($this->client->getResponse()->getContent(), true)['token'];

        // Use the generated token as Bearer – avoids stateless re-login limitation
        $this->client->request('GET', self::ENDPOINT, [], [], ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]);
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertTrue($data['hasToken']);
        $this->assertNotNull($data['createdAt']);
    }

    public function testGenerateTokenOverwritesPreviousToken(): void
    {
        $user = $this->createUser(self::PREFIX . 'gen-overwrite@example.com');
        $this->client->loginUser($user);

        $this->client->request('POST', self::ENDPOINT);
        $firstToken = json_decode($this->client->getResponse()->getContent(), true)['token'];

        // Use first token as Bearer to call POST again – first token is still valid during auth;
        // the handler then overwrites it with a new one.
        $this->client->request('POST', self::ENDPOINT, [], [], ['HTTP_AUTHORIZATION' => 'Bearer ' . $firstToken]);
        $secondToken = json_decode($this->client->getResponse()->getContent(), true)['token'];

        $this->assertNotSame($firstToken, $secondToken, 'Regenerating must produce a different token.');

        // Database must reflect new token
        $refreshedUser = $this->em->find(User::class, $user->getId());
        $this->assertSame($secondToken, $refreshedUser->getApiToken());
    }

    // =========================================================================
    //  DELETE /api/profile/api-token
    // =========================================================================

    public function testRevokeTokenReturnsSuccess(): void
    {
        $user = $this->createUser(self::PREFIX . 'revoke-ok@example.com');
        $user->setApiToken('kbak_' . bin2hex(random_bytes(24)));
        $user->setApiTokenCreatedAt(new DateTime());
        $this->em->flush();

        $this->client->loginUser($user);
        $this->client->request('DELETE', self::ENDPOINT);

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($data['success']);
    }

    public function testRevokeTokenClearsStatus(): void
    {
        $user = $this->createUser(self::PREFIX . 'revoke-clear@example.com');
        $this->client->loginUser($user);

        // Generate first
        $this->client->request('POST', self::ENDPOINT);
        $this->assertResponseIsSuccessful();
        $token = json_decode($this->client->getResponse()->getContent(), true)['token'];

        // Revoke using the generated token as Bearer
        $this->client->request('DELETE', self::ENDPOINT, [], [], ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]);
        $this->assertResponseIsSuccessful();

        // Verify status via DB (token is now revoked, so we cannot use Bearer or re-loginUser)
        $refreshedUser = $this->em->find(User::class, $user->getId());
        $this->assertNull($refreshedUser->getApiToken(), 'apiToken must be null after revocation.');
        $this->assertNull($refreshedUser->getApiTokenCreatedAt(), 'apiTokenCreatedAt must be null after revocation.');
    }

    // =========================================================================
    //  Authentifizierung via kbak_ Bearer Token
    // =========================================================================

    public function testAuthenticateWithGeneratedToken(): void
    {
        $user = $this->createUser(self::PREFIX . 'bearer-auth@example.com');

        // Generate token via logged-in session
        $this->client->loginUser($user);
        $this->client->request('POST', self::ENDPOINT);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $token = $data['token'];

        // Now use token directly as Bearer – no loginUser
        self::ensureKernelShutdown();
        $anonClient = static::createClient();
        $anonClient->request('GET', '/api/about-me', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseStatusCodeSame(200, 'Bearer kbak_ token must authenticate successfully.');
    }

    public function testInvalidTokenReturns401(): void
    {
        self::ensureKernelShutdown();
        $anonClient = static::createClient();
        $fakeToken = 'kbak_' . str_repeat('0', 48);
        $anonClient->request('GET', '/api/about-me', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $fakeToken,
        ]);

        $this->assertResponseStatusCodeSame(401);
    }

    public function testRevokedTokenNoLongerAuthenticates(): void
    {
        $user = $this->createUser(self::PREFIX . 'bearer-revoke@example.com');

        // Generate
        $this->client->loginUser($user);
        $this->client->request('POST', self::ENDPOINT);
        $token = json_decode($this->client->getResponse()->getContent(), true)['token'];

        // Revoke using the token itself as Bearer
        $this->client->request('DELETE', self::ENDPOINT, [], [], ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]);
        $this->assertResponseIsSuccessful();

        // Token must now be rejected
        self::ensureKernelShutdown();
        $anonClient = static::createClient();
        $anonClient->request('GET', '/api/about-me', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseStatusCodeSame(401, 'Revoked token must no longer authenticate.');
    }

    // =========================================================================
    //  Hilfsmethoden
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

    protected function tearDown(): void
    {
        $conn = $this->em->getConnection();
        $conn->executeStatement('DELETE FROM users WHERE email LIKE :prefix', ['prefix' => self::PREFIX . '%']);

        $this->em->close();
        parent::tearDown();
        restore_exception_handler();
    }
}
