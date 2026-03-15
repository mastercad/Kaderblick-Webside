<?php

namespace Tests\Feature\Controller;

use App\Entity\User;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Mailer\MailerInterface;

/**
 * Tests for VerificationController.
 *
 * Covers the /api/verify-email/{token} and /api/resend-verification/{userId}
 * endpoints that were moved from RegisterController into VerificationController.
 */
class VerificationControllerTest extends WebTestCase
{
    protected function tearDown(): void
    {
        parent::tearDown();
        restore_exception_handler();
    }

    private function getEntityManager(): EntityManagerInterface
    {
        $em = static::getContainer()->get(EntityManagerInterface::class);

        if (!$em->isOpen()) {
            static::getContainer()->get('doctrine')->resetManager();
            $em = static::getContainer()->get(EntityManagerInterface::class);
        }

        return $em;
    }

    private function createUnverifiedUser(string $email, string $token = 'valid-test-token-abc123', ?DateTime $expires = null): User
    {
        $user = new User();
        $user->setEmail($email)
            ->setPassword('hashedpassword')
            ->setFirstName('Test')
            ->setLastName('User')
            ->setVerificationToken($token)
            ->setIsVerified(false)
            ->setIsEnabled(false)
            ->setVerificationExpires($expires ?? new DateTime('+1 month'));

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
                $connection->executeStatement('DELETE FROM users WHERE email = ?', [$email]);
            }
        } catch (Exception) {
            // ignore
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/verify-email/{token}
    // ─────────────────────────────────────────────────────────────────────────

    public function testVerifyEmailReturns200AndActivatesUser(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();
        $email = 'vc-verify-ok@example.com';
        $this->cleanup($email);

        $user = $this->createUnverifiedUser($email, 'good-token-1234567890abcdef');

        $client->request('GET', '/api/verify-email/good-token-1234567890abcdef');

        $this->assertResponseStatusCodeSame(200);

        $em = $this->getEntityManager();
        $em->clear();
        $fresh = $em->getRepository(User::class)->findOneBy(['email' => $email]);

        $this->assertTrue($fresh->isVerified());
        $this->assertTrue($fresh->isEnabled());
        $this->assertNull($fresh->getVerificationToken());
        $this->assertNull($fresh->getVerificationExpires());

        $this->cleanup($email);
    }

    public function testVerifyEmailResponseContainsMessageAndNeedsContextFlag(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();
        $email = 'vc-verify-context@example.com';
        $this->cleanup($email);

        $this->createUnverifiedUser($email, 'context-flag-token-abcdef123456');

        $client->request('GET', '/api/verify-email/context-flag-token-abcdef123456');

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('message', $response);
        $this->assertStringContainsString('erfolgreich verifiziert', $response['message']);
        $this->assertArrayHasKey('needsContext', $response);
        $this->assertTrue($response['needsContext']);

        $this->cleanup($email);
    }

    public function testVerifyEmailSendsWelcomeEmail(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();
        $email = 'vc-welcome@example.com';
        $this->cleanup($email);

        $this->createUnverifiedUser($email, 'welcome-email-token-abcdef12345678');

        $mailerCalls = [];
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send')
            ->with($this->callback(function (TemplatedEmail $mail) use ($email, &$mailerCalls) {
                $mailerCalls[] = $mail;
                $this->assertEquals($email, $mail->getTo()[0]->getAddress());
                $this->assertStringContainsString('Willkommen', $mail->getSubject());
                $this->assertEquals('emails/welcome.html.twig', $mail->getHtmlTemplate());

                return true;
            }));

        static::getContainer()->set(MailerInterface::class, $mailer);

        $client->request('GET', '/api/verify-email/welcome-email-token-abcdef12345678');

        $this->assertResponseStatusCodeSame(200);

        $this->cleanup($email);
    }

    public function testVerifyEmailWithInvalidTokenReturns404(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('GET', '/api/verify-email/does-not-exist-00000000000000');

        $this->assertResponseStatusCodeSame(404);

        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('error', $response);
        $this->assertStringContainsString('ungültig oder abgelaufen', $response['error']);
    }

    public function testVerifyEmailWithExpiredTokenReturns410(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();
        $email = 'vc-expired@example.com';
        $this->cleanup($email);

        $this->createUnverifiedUser($email, 'expired-token-abcdef1234567890', new DateTime('-1 day'));

        $client->request('GET', '/api/verify-email/expired-token-abcdef1234567890');

        $this->assertResponseStatusCodeSame(410);

        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('error', $response);
        $this->assertStringContainsString('abgelaufen', $response['error']);

        $this->cleanup($email);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/resend-verification/{userId}
    // ─────────────────────────────────────────────────────────────────────────

    public function testResendVerificationGeneratesNewToken(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();
        $email = 'vc-resend-token@example.com';
        $this->cleanup($email);

        $user = $this->createUnverifiedUser($email, 'old-token-abcdef1234567890');
        $oldToken = $user->getVerificationToken();

        // Give at least 1 second so expiry timestamp differs
        sleep(1);

        $client->request('POST', '/api/resend-verification/' . $user->getId());

        $this->assertResponseStatusCodeSame(200);

        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertTrue($response['success']);
        $this->assertStringContainsString('erneut gesendet', $response['message']);

        $em = $this->getEntityManager();
        $em->clear();
        $fresh = $em->getRepository(User::class)->find($user->getId());

        $this->assertNotNull($fresh->getVerificationToken());
        $this->assertNotEquals($oldToken, $fresh->getVerificationToken());
        $this->assertEquals(64, strlen($fresh->getVerificationToken()));
        // Still unverified after resend
        $this->assertFalse($fresh->isVerified());
        $this->assertFalse($fresh->isEnabled());

        $this->cleanup($email);
    }

    public function testResendVerificationWithUnknownUserReturns404(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        $client->request('POST', '/api/resend-verification/999999999');

        $this->assertResponseStatusCodeSame(404);

        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('error', $response);
        $this->assertStringContainsString('nicht gefunden', $response['error']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ROLE_USER assignment on verification
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * verifyEmail() must ensure the user has ROLE_USER after activation so
     * that all ROLE_USER-protected API endpoints (notifications, relations, …)
     * respond with 200 and not 403.
     */
    public function testVerifyEmailAssignsRoleUser(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();
        $email = 'vc-role-user@example.com';
        $this->cleanup($email);

        $this->createUnverifiedUser($email, 'role-user-token-abcdef1234567890');

        $client->request('GET', '/api/verify-email/role-user-token-abcdef1234567890');

        $this->assertResponseStatusCodeSame(200);

        $em = $this->getEntityManager();
        $em->clear();
        $fresh = $em->getRepository(User::class)->findOneBy(['email' => $email]);

        $this->assertContains(
            'ROLE_USER',
            $fresh->getRoles(),
            'Verified user must have ROLE_USER so protected endpoints are accessible.'
        );

        $this->cleanup($email);
    }

    /**
     * Before verification the user must NOT yet have ROLE_USER – only ROLE_GUEST.
     * This ensures the role is genuinely granted during verification and not
     * present on every unverified account.
     */
    public function testUnverifiedUserDoesNotHaveRoleUser(): void
    {
        self::ensureKernelShutdown();
        $email = 'vc-no-role-user@example.com';
        $this->cleanup($email);

        $user = $this->createUnverifiedUser($email, 'no-role-user-token-abcdef123456');

        $this->assertNotContains(
            'ROLE_USER',
            $user->getRoles(),
            'Unverified user must not have ROLE_USER.'
        );
        $this->assertContains('ROLE_GUEST', $user->getRoles());

        $this->cleanup($email);
    }
}
