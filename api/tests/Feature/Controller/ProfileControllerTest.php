<?php

namespace Tests\Feature\Controller;

use App\Entity\Coach;
use App\Entity\Player;
use App\Entity\RegistrationRequest;
use App\Entity\RelationType;
use App\Entity\SystemSetting;
use App\Entity\User;
use App\Entity\UserRelation;
use App\Service\SystemSettingService;
use Symfony\Component\HttpFoundation\Response;
use Tests\Feature\ApiWebTestCase;

/**
 * Tests for GET /api/about-me.
 *
 * Critical invariant: the needsRegistrationContext flag must correctly reflect
 * whether the logged-in user still needs to submit a relation request,
 * AND whether the feature flag is enabled.
 *   true  → feature ON  AND user has NO UserRelations AND NO RegistrationRequests AND NOT admin
 *   false → feature OFF OR  user has at least one UserRelation OR a RegistrationRequest OR is ROLE_ADMIN/SUPERADMIN
 */
class ProfileControllerTest extends ApiWebTestCase
{
    // ────────────────────────────── Helpers ──────────────────────────────

    private function setRegistrationContextFeature(bool $enabled): void
    {
        $em = static::getContainer()->get('doctrine')->getManager();
        $setting = $em->getRepository(SystemSetting::class)
            ->findOneBy(['key' => SystemSettingService::KEY_REGISTRATION_CONTEXT_ENABLED]);
        if (null === $setting) {
            $setting = new SystemSetting(SystemSettingService::KEY_REGISTRATION_CONTEXT_ENABLED, $enabled ? 'true' : 'false');
            $em->persist($setting);
        } else {
            $setting->setValue($enabled ? 'true' : 'false');
        }
        $em->flush();
    }
    // ────────────────────────────── Auth ──────────────────────────────

    public function testAboutMeRequiresAuthentication(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/about-me');

        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    // ────────────────────────────── Response shape ──────────────────────────────

    public function testAboutMeReturnsExpectedFields(): void
    {
        $client = static::createClient();
        $this->authenticateUser($client, 'user9@example.com');

        $client->request('GET', '/api/about-me');

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);

        foreach (['id', 'email', 'firstName', 'lastName', 'roles', 'isPlayer', 'isCoach', 'needsRegistrationContext'] as $field) {
            $this->assertArrayHasKey($field, $data, "Field \"$field\" missing from /api/about-me response.");
        }
    }

    // ────────────────────────────── needsRegistrationContext = true ──────────────────────────────

    /**
     * user9 has no UserRelations and no RegistrationRequests in the test fixtures.
     * The flag must be true when the feature is enabled.
     */
    public function testNeedsRegistrationContextTrueForFreshUser(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get('doctrine')->getManager();

        $this->setRegistrationContextFeature(true);

        /** @var User $user */
        $user = $em->getRepository(User::class)->findOneBy(['email' => 'user9@example.com']);
        $this->assertNotNull($user, 'Fixture user9@example.com not found.');

        // Ensure the user is truly clean before testing
        foreach ($em->getRepository(UserRelation::class)->findBy(['user' => $user]) as $rel) {
            $em->remove($rel);
        }
        foreach ($em->getRepository(RegistrationRequest::class)->findBy(['user' => $user]) as $req) {
            $em->remove($req);
        }
        $em->flush();

        $this->authenticateUser($client, 'user9@example.com');
        $client->request('GET', '/api/about-me');

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertTrue(
            $data['needsRegistrationContext'],
            'needsRegistrationContext must be true when user has no relations and no requests and feature is enabled.'
        );
    }

    // ────────────────────────────── needsRegistrationContext = false (UserRelation exists) ──────────────────────────────

    /**
     * user6 already has a UserRelation in the test fixtures.
     * The flag must be false.
     */
    public function testNeedsRegistrationContextFalseWhenUserRelationExists(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get('doctrine')->getManager();

        $user = $em->getRepository(User::class)->findOneBy(['email' => 'user6@example.com']);
        $this->assertNotNull($user, 'Fixture user6@example.com not found.');

        $relations = $em->getRepository(UserRelation::class)->findBy(['user' => $user]);
        $this->assertNotEmpty($relations, 'user6 should have at least one UserRelation in the fixtures.');

        $this->authenticateUser($client, 'user6@example.com');
        $client->request('GET', '/api/about-me');

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertFalse(
            $data['needsRegistrationContext'],
            'needsRegistrationContext must be false when user already has a UserRelation.'
        );
    }

    // ────────────────────────────── needsRegistrationContext = false (pending request exists) ──────────────────────────────

    /**
     * When a user has a pending RegistrationRequest but no UserRelation yet,
     * the flag must still be false — the user already took action.
     */
    public function testNeedsRegistrationContextFalseWhenPendingRequestExists(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get('doctrine')->getManager();

        /** @var User $user */
        $user = $em->getRepository(User::class)->findOneBy(['email' => 'user9@example.com']);
        $this->assertNotNull($user, 'Fixture user9@example.com not found.');

        // Start clean
        foreach ($em->getRepository(UserRelation::class)->findBy(['user' => $user]) as $rel) {
            $em->remove($rel);
        }
        foreach ($em->getRepository(RegistrationRequest::class)->findBy(['user' => $user]) as $req) {
            $em->remove($req);
        }
        $em->flush();

        // Create a pending RegistrationRequest for this user
        $player = $em->getRepository(Player::class)->findOneBy([]);
        $this->assertNotNull($player, 'No Player fixture found.');

        $relationType = $em->getRepository(RelationType::class)->findOneBy(['category' => 'player']);
        $this->assertNotNull($relationType, 'No player RelationType fixture found.');

        $request = new RegistrationRequest();
        $request->setUser($user);
        $request->setPlayer($player);
        $request->setRelationType($relationType);
        $request->setStatus('pending');
        $em->persist($request);
        $em->flush();

        $this->authenticateUser($client, 'user9@example.com');
        $client->request('GET', '/api/about-me');

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertFalse(
            $data['needsRegistrationContext'],
            'needsRegistrationContext must be false when user has a pending RegistrationRequest.'
        );

        // Cleanup
        $em->remove($request);
        $em->flush();
    }

    /**
     * Same as above but with a coach request.
     */
    public function testNeedsRegistrationContextFalseWhenPendingCoachRequestExists(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get('doctrine')->getManager();

        /** @var User $user */
        $user = $em->getRepository(User::class)->findOneBy(['email' => 'user9@example.com']);
        $this->assertNotNull($user, 'Fixture user9@example.com not found.');

        foreach ($em->getRepository(UserRelation::class)->findBy(['user' => $user]) as $rel) {
            $em->remove($rel);
        }
        foreach ($em->getRepository(RegistrationRequest::class)->findBy(['user' => $user]) as $req) {
            $em->remove($req);
        }
        $em->flush();

        $coach = $em->getRepository(Coach::class)->findOneBy([]);
        $this->assertNotNull($coach, 'No Coach fixture found.');

        $relationType = $em->getRepository(RelationType::class)->findOneBy(['category' => 'coach']);
        $this->assertNotNull($relationType, 'No coach RelationType fixture found.');

        $request = new RegistrationRequest();
        $request->setUser($user);
        $request->setCoach($coach);
        $request->setRelationType($relationType);
        $request->setStatus('pending');
        $em->persist($request);
        $em->flush();

        $this->authenticateUser($client, 'user9@example.com');
        $client->request('GET', '/api/about-me');

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertFalse(
            $data['needsRegistrationContext'],
            'needsRegistrationContext must be false when user has a pending coach RegistrationRequest.'
        );

        $em->remove($request);
        $em->flush();
    }

    // ────────────────────────────── needsRegistrationContext = false (rejected request — already processed) ──────────────────────────────

    /**
     * Even a rejected request should suppress the dialog — the admin already
     * saw this user. The user can resubmit manually if needed.
     */
    public function testNeedsRegistrationContextFalseWhenRejectedRequestExists(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get('doctrine')->getManager();

        /** @var User $user */
        $user = $em->getRepository(User::class)->findOneBy(['email' => 'user9@example.com']);
        $this->assertNotNull($user, 'Fixture user9@example.com not found.');

        foreach ($em->getRepository(UserRelation::class)->findBy(['user' => $user]) as $rel) {
            $em->remove($rel);
        }
        foreach ($em->getRepository(RegistrationRequest::class)->findBy(['user' => $user]) as $req) {
            $em->remove($req);
        }
        $em->flush();

        $player = $em->getRepository(Player::class)->findOneBy([]);
        $relationType = $em->getRepository(RelationType::class)->findOneBy(['category' => 'player']);

        $request = new RegistrationRequest();
        $request->setUser($user);
        $request->setPlayer($player);
        $request->setRelationType($relationType);
        $request->setStatus('rejected');
        $em->persist($request);
        $em->flush();

        $this->authenticateUser($client, 'user9@example.com');
        $client->request('GET', '/api/about-me');

        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertFalse(
            $data['needsRegistrationContext'],
            'needsRegistrationContext must be false even when request was rejected (user already interacted).'
        );

        $em->remove($request);
        $em->flush();
    }

    // ────────────────────────────── Feature flag OFF ──────────────────────────────

    /**
     * When the registration_context_enabled setting is 'false',
     * needsRegistrationContext must always be false — no matter how clean the user is.
     */
    public function testNeedsRegistrationContextFalseWhenFeatureDisabled(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get('doctrine')->getManager();

        $this->setRegistrationContextFeature(false);

        /** @var User $user */
        $user = $em->getRepository(User::class)->findOneBy(['email' => 'user9@example.com']);
        $this->assertNotNull($user, 'Fixture user9@example.com not found.');

        // Ensure user is completely clean
        foreach ($em->getRepository(UserRelation::class)->findBy(['user' => $user]) as $rel) {
            $em->remove($rel);
        }
        foreach ($em->getRepository(RegistrationRequest::class)->findBy(['user' => $user]) as $req) {
            $em->remove($req);
        }
        $em->flush();

        $this->authenticateUser($client, 'user9@example.com');
        $client->request('GET', '/api/about-me');

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertFalse(
            $data['needsRegistrationContext'],
            'needsRegistrationContext must be false when the feature flag is disabled, even for a fresh user.'
        );

        // Restore the default so other tests are not affected
        $this->setRegistrationContextFeature(true);
    }

    /**
     * When the feature flag is re-enabled, a fresh user should see the dialog again.
     */
    public function testNeedsRegistrationContextTrueAfterFeatureReEnabled(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get('doctrine')->getManager();

        $this->setRegistrationContextFeature(true);

        /** @var User $user */
        $user = $em->getRepository(User::class)->findOneBy(['email' => 'user9@example.com']);

        foreach ($em->getRepository(UserRelation::class)->findBy(['user' => $user]) as $rel) {
            $em->remove($rel);
        }
        foreach ($em->getRepository(RegistrationRequest::class)->findBy(['user' => $user]) as $req) {
            $em->remove($req);
        }
        $em->flush();

        $this->authenticateUser($client, 'user9@example.com');
        $client->request('GET', '/api/about-me');

        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertTrue(
            $data['needsRegistrationContext'],
            'needsRegistrationContext must be true again after the feature flag is re-enabled.'
        );
    }

    public function testNeedsRegistrationContextFalseForAdminWithNoRelations(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get('doctrine')->getManager();

        $this->setRegistrationContextFeature(true);

        // user16 = ROLE_ADMIN — ensure they have no relations or requests
        /** @var User $user */
        $user = $em->getRepository(User::class)->findOneBy(['email' => 'user16@example.com']);
        $this->assertNotNull($user);

        foreach ($em->getRepository(UserRelation::class)->findBy(['user' => $user]) as $rel) {
            $em->remove($rel);
        }
        foreach ($em->getRepository(RegistrationRequest::class)->findBy(['user' => $user]) as $req) {
            $em->remove($req);
        }
        $em->flush();

        $this->authenticateUser($client, 'user16@example.com');
        $client->request('GET', '/api/about-me');

        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertFalse(
            $data['needsRegistrationContext'],
            'ROLE_ADMIN users must never see the registration context dialog, even without any relations.'
        );
    }

    public function testNeedsRegistrationContextFalseForSuperadminWithNoRelations(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get('doctrine')->getManager();

        $this->setRegistrationContextFeature(true);

        // user21 = ROLE_SUPERADMIN — ensure no relations or requests
        /** @var User $user */
        $user = $em->getRepository(User::class)->findOneBy(['email' => 'user21@example.com']);
        $this->assertNotNull($user);

        foreach ($em->getRepository(UserRelation::class)->findBy(['user' => $user]) as $rel) {
            $em->remove($rel);
        }
        foreach ($em->getRepository(RegistrationRequest::class)->findBy(['user' => $user]) as $req) {
            $em->remove($req);
        }
        $em->flush();

        $this->authenticateUser($client, 'user21@example.com');
        $client->request('GET', '/api/about-me');

        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertFalse(
            $data['needsRegistrationContext'],
            'ROLE_SUPERADMIN users must never see the registration context dialog, even without any relations.'
        );
    }
}
