<?php

namespace Tests\Feature;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

abstract class ApiWebTestCase extends WebTestCase
{
    protected function authenticateUser(KernelBrowser $client, string $email): void
    {
        $user = static::getContainer()->get('doctrine')->getRepository(User::class)->findOneBy(['email' => $email]);
        self::assertNotNull($user, sprintf('Fixture-User "%s" nicht gefunden. Bitte Fixtures laden (--group=master --group=test).', $email));

        $jwtManager = static::getContainer()->get(JWTTokenManagerInterface::class);
        $token = $jwtManager->create($user);

        $client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer ' . $token);
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        restore_exception_handler();
    }
}
