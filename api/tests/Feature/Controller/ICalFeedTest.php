<?php

namespace App\Tests\Feature\Controller;

use App\Entity\User;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Feature-Tests für den öffentlichen iCal-Feed-Endpoint.
 *
 * URL-Muster: /ical/{token}/{scope}.ics
 * Scopes:     personal | club | platform
 *
 * Da der Endpunkt keine Authentifizierung benötigt (Stateless, security: false),
 * müssen hier besonders die Token-Validierung und die Missbrauchssicherheit
 * getestet werden.
 *
 * Sicherheitstests:
 *  – Tokens ohne kcal_-Präfix werden mit 404 abgelehnt
 *  – kbak_-API-Tokens werden explizit abgelehnt (dürfen nicht funktionieren)
 *  – JWT-artige Tokens (Header.Payload.Signature) werden abgelehnt
 *  – Unbekannte kcal_-Tokens → 404
 *  – Gültige kcal_-Tokens → 200 mit korrektem Content-Type
 *  – Inhalt ist valides VCALENDAR (RFC 5545)
 *  – Content-Disposition schützt vor direkt eingebettetem Inhalt (attachment)
 */
class ICalFeedTest extends WebTestCase
{
    private const PREFIX = 'ical-test-';

    private KernelBrowser $client;
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        self::ensureKernelShutdown();
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
    }

    // =========================================================================
    //  SICHERHEIT: Token-Präfix-Validierung
    // =========================================================================

    /**
     * KRITISCHER SICHERHEITSTEST: Tokens ohne kcal_-Präfix werden abgelehnt.
     * Dies verhindert, dass API-Tokens, JWTs oder andere Credentials hier
     * missbraucht werden können.
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('invalidTokenPrefixProvider')]
    public function testInvalidTokenPrefixReturns404(string $token, string $description): void
    {
        $this->client->request('GET', "/ical/{$token}/personal.ics");

        $this->assertResponseStatusCodeSame(
            404,
            "Token mit Format '{$description}' muss einen 404 zurückgeben – nur kcal_-Tokens sind erlaubt."
        );
    }

    /** @return array<string, array{string, string}> */
    public static function invalidTokenPrefixProvider(): array
    {
        return [
            'api token kbak_' => ['kbak_' . str_repeat('a', 48), 'kbak_-API-Token'],
            'jwt like token' => ['eyJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3MDAwMDAwMDB9.signature', 'JWT-Token'],
            'plain hex token' => [str_repeat('f', 64), 'Hex-Token ohne Präfix'],
            'random string' => ['random-value-without-prefix', 'Zufälliger String'],
            'empty-like' => ['_invalid_prefix_token', 'Ungültiger Präfix'],
            'uppercase KCAL' => ['KCAL_' . str_repeat('a', 56), 'Groß-KCAL-Präfix'],
            'no prefix' => [str_repeat('0', 61), 'Nullen ohne Präfix'],
        ];
    }

    public function testKbakApiTokenExplicitlyRejectedAtIcalEndpoint(): void
    {
        // Benutzer mit API-Token anlegen
        $user = $this->createUser(self::PREFIX . 'kbak-reject@test.example');
        $apiToken = 'kbak_' . bin2hex(random_bytes(24));
        $user->setApiToken($apiToken);
        $this->em->flush();

        // Versuche, den kbak_-Token als iCal-Token zu verwenden
        $this->client->request('GET', "/ical/{$apiToken}/personal.ics");

        $this->assertResponseStatusCodeSame(
            404,
            'Ein kbak_-API-Token darf niemals einen iCal-Feed liefern.'
        );
    }

    // =========================================================================
    //  Unbekannte kcal_-Tokens → 404
    // =========================================================================

    public function testUnknownKcalTokenReturns404(): void
    {
        $unknownToken = 'kcal_' . bin2hex(random_bytes(28));

        $this->client->request('GET', "/ical/{$unknownToken}/personal.ics");

        $this->assertResponseStatusCodeSame(
            404,
            'Ein gültig formatierter, aber unbekannter kcal_-Token muss 404 zurückgeben.'
        );
    }

    public function testUnknownKcalTokenReturnsVcalendarContent(): void
    {
        $unknownToken = 'kcal_' . bin2hex(random_bytes(28));

        $this->client->request('GET', "/ical/{$unknownToken}/club.ics");

        $body = $this->client->getResponse()->getContent();
        $this->assertStringContainsString(
            'BEGIN:VCALENDAR',
            $body,
            'Auch ein 404 muss einen validen VCALENDAR-Body liefern (Kompatibilität mit Kalender-Clients).'
        );
        $this->assertStringContainsString('END:VCALENDAR', $body);
    }

    // =========================================================================
    //  Gültige Tokens → 200
    // =========================================================================

    public function testValidTokenReturns200(): void
    {
        $user = $this->createUserWithCalendarToken(self::PREFIX . 'valid-200@test.example');
        $token = $user->getCalendarToken();

        $this->client->request('GET', "/ical/{$token}/personal.ics");

        $this->assertResponseStatusCodeSame(200);
    }

    public function testResponseContentTypeIsTextCalendar(): void
    {
        $user = $this->createUserWithCalendarToken(self::PREFIX . 'ct-check@test.example');
        $token = $user->getCalendarToken();

        $this->client->request('GET', "/ical/{$token}/club.ics");

        $contentType = $this->client->getResponse()->headers->get('Content-Type');
        $this->assertStringContainsString(
            'text/calendar',
            $contentType,
            'Content-Type muss text/calendar sein.'
        );
        $this->assertStringContainsString(
            'UTF-8',
            strtoupper($contentType),
            'Content-Type muss den Zeichensatz UTF-8 angeben.'
        );
    }

    public function testResponseBodyIsValidVcalendar(): void
    {
        $user = $this->createUserWithCalendarToken(self::PREFIX . 'vcal-valid@test.example');
        $token = $user->getCalendarToken();

        $this->client->request('GET', "/ical/{$token}/platform.ics");

        $body = $this->client->getResponse()->getContent();
        $this->assertStringStartsWith(
            'BEGIN:VCALENDAR',
            $body,
            'Der Body muss mit BEGIN:VCALENDAR beginnen.'
        );
        $this->assertStringContainsString('VERSION:2.0', $body);
        $this->assertStringContainsString('PRODID:', $body);
        $this->assertStringContainsString(
            'END:VCALENDAR',
            $body,
            'Der Body muss mit END:VCALENDAR abschließen.'
        );
    }

    public function testResponseHasContentDispositionAttachment(): void
    {
        $user = $this->createUserWithCalendarToken(self::PREFIX . 'disposition@test.example');
        $token = $user->getCalendarToken();

        $this->client->request('GET', "/ical/{$token}/personal.ics");

        $disposition = $this->client->getResponse()->headers->get('Content-Disposition');
        $this->assertNotNull($disposition);
        $this->assertStringContainsString(
            'attachment',
            $disposition,
            'Content-Disposition: attachment verhindert das automatische Einbetten in Browser.'
        );
    }

    // =========================================================================
    //  Verschiedene Scopes → alle akzeptiert
    // =========================================================================

    #[\PHPUnit\Framework\Attributes\DataProvider('validScopeProvider')]
    public function testAllValidScopesReturn200(string $scope): void
    {
        $user = $this->createUserWithCalendarToken(self::PREFIX . "scope-{$scope}@test.example");
        $token = $user->getCalendarToken();

        $this->client->request('GET', "/ical/{$token}/{$scope}.ics");

        $this->assertResponseStatusCodeSame(200, "Scope '{$scope}' muss 200 zurückgeben.");
    }

    /** @return array<string, array{string}> */
    public static function validScopeProvider(): array
    {
        return [
            'personal' => ['personal'],
            'club' => ['club'],
            'platform' => ['platform'],
        ];
    }

    public function testUnknownScopeFallsBackGracefully(): void
    {
        $user = $this->createUserWithCalendarToken(self::PREFIX . 'bad-scope@test.example');
        $token = $user->getCalendarToken();

        // Ungültiger Scope → kein Fehler, fällt auf 'personal' zurück
        $this->client->request('GET', "/ical/{$token}/unknownscope.ics");

        $this->assertResponseStatusCodeSame(200, 'Ein ungültiger Scope darf keinen 500-Fehler erzeugen.');

        $body = $this->client->getResponse()->getContent();
        $this->assertStringContainsString('BEGIN:VCALENDAR', $body);
    }

    // =========================================================================
    //  Sicherheit: Kein sensitiver Inhalt im Response
    // =========================================================================

    public function testIcalFeedDoesNotLeakCalendarToken(): void
    {
        $user = $this->createUserWithCalendarToken(self::PREFIX . 'no-leak@test.example');
        $token = $user->getCalendarToken();

        $this->client->request('GET', "/ical/{$token}/personal.ics");

        $body = $this->client->getResponse()->getContent();
        // Der Token selbst sollte nicht im Feed-Inhalt erscheinen
        $this->assertStringNotContainsString(
            $token,
            $body,
            'Der Kalender-Token darf nicht im Feed-Inhalt erscheinen.'
        );
    }

    public function testIcalFeedDoesNotLeakUserEmail(): void
    {
        $user = $this->createUserWithCalendarToken(self::PREFIX . 'no-email@test.example');
        $token = $user->getCalendarToken();
        $email = $user->getEmail();

        $this->client->request('GET', "/ical/{$token}/personal.ics");

        $body = $this->client->getResponse()->getContent();
        $this->assertStringNotContainsString(
            $email,
            $body,
            'Die E-Mail-Adresse des Benutzers darf nicht im Feed erscheinen.'
        );
    }

    // =========================================================================
    //  Widerrufener Token → 404
    // =========================================================================

    public function testRevokedTokenReturns404(): void
    {
        $user = $this->createUserWithCalendarToken(self::PREFIX . 'revoked@test.example');
        $token = $user->getCalendarToken();

        // Token widerrufen
        $user->setCalendarToken(null);
        $user->setCalendarTokenCreatedAt(null);
        $this->em->flush();

        $this->client->request('GET', "/ical/{$token}/personal.ics");

        $this->assertResponseStatusCodeSame(
            404,
            'Nach dem Widerruf muss ein vorher gültiger Token 404 zurückgeben.'
        );
    }

    // =========================================================================
    //  Endpoint gibt keine Authentifizierung weiter (kein Login nötig)
    // =========================================================================

    public function testIcalEndpointIsPubliclyAccessible(): void
    {
        $user = $this->createUserWithCalendarToken(self::PREFIX . 'public-access@test.example');
        $token = $user->getCalendarToken();

        // Kein Login, kein JWT – nur der Token in der URL
        self::ensureKernelShutdown();
        $anonClient = static::createClient();
        $anonClient->request('GET', "/ical/{$token}/personal.ics");

        $this->assertResponseStatusCodeSame(
            200,
            'Der iCal-Endpoint muss ohne Authentifizierung erreichbar sein.'
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
        $user->setFirstName('iCal');
        $user->setLastName('FeedTest');
        $user->setPassword('password');
        $user->setRoles($roles);
        $user->setIsEnabled(true);
        $user->setIsVerified(true);
        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    private function createUserWithCalendarToken(string $email): User
    {
        $user = $this->createUser($email);
        $token = 'kcal_' . bin2hex(random_bytes(28));
        $user->setCalendarToken($token);
        $user->setCalendarTokenCreatedAt(new DateTime());
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
