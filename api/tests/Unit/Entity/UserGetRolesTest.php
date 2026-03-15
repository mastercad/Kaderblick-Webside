<?php

namespace App\Tests\Unit\Entity;

use App\Entity\User;
use App\Entity\UserRelation;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for User::getRoles().
 *
 * Key invariant (restored fix):
 *  – Verified users always receive ROLE_USER automatically, even if their
 *    raw DB `roles` array is empty.
 *  – Unverified users receive ROLE_GUEST instead.
 *  – Users with at least one UserRelation also receive ROLE_RELATED_USER.
 *  – Duplicate roles are deduplicated via array_unique.
 */
class UserGetRolesTest extends TestCase
{
    // ─────────────────────────────────────────────────────────────────────────
    // Unverified user
    // ─────────────────────────────────────────────────────────────────────────

    public function testUnverifiedUserGetsRoleGuest(): void
    {
        $user = new User();
        $user->setIsVerified(false);

        $this->assertContains('ROLE_GUEST', $user->getRoles());
    }

    public function testUnverifiedUserDoesNotGetRoleUser(): void
    {
        $user = new User();
        $user->setIsVerified(false);

        $this->assertNotContains('ROLE_USER', $user->getRoles());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Verified user
    // ─────────────────────────────────────────────────────────────────────────

    public function testVerifiedUserGetsRoleUser(): void
    {
        $user = new User();
        $user->setIsVerified(true);

        $this->assertContains('ROLE_USER', $user->getRoles());
    }

    public function testVerifiedUserDoesNotGetRoleGuest(): void
    {
        $user = new User();
        $user->setIsVerified(true);

        $this->assertNotContains('ROLE_GUEST', $user->getRoles());
    }

    public function testVerifiedUserWithEmptyDbRolesStillGetsRoleUser(): void
    {
        $user = new User();
        $user->setIsVerified(true);
        $user->setRoles([]);

        $roles = $user->getRoles();

        $this->assertContains('ROLE_USER', $roles);
    }

    public function testVerifiedUserWithExistingDbRolesRetainsThem(): void
    {
        $user = new User();
        $user->setIsVerified(true);
        $user->setRoles(['ROLE_ADMIN']);

        $roles = $user->getRoles();

        $this->assertContains('ROLE_ADMIN', $roles);
        $this->assertContains('ROLE_USER', $roles);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UserRelations
    // ─────────────────────────────────────────────────────────────────────────

    public function testVerifiedUserWithRelationsGetsRoleRelatedUser(): void
    {
        $relation = new UserRelation();

        $user = new User();
        $user->setIsVerified(true);
        $user->addUserRelation($relation);

        $this->assertContains('ROLE_RELATED_USER', $user->getRoles());
    }

    public function testVerifiedUserWithoutRelationsDoesNotGetRoleRelatedUser(): void
    {
        $user = new User();
        $user->setIsVerified(true);

        $this->assertNotContains('ROLE_RELATED_USER', $user->getRoles());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // No duplicates
    // ─────────────────────────────────────────────────────────────────────────

    public function testGetRolesDeduplicates(): void
    {
        // Store ROLE_USER explicitly in DB roles AND getRoles() also adds it
        $user = new User();
        $user->setIsVerified(true);
        $user->setRoles(['ROLE_USER']);

        $roles = $user->getRoles();

        $this->assertSame(array_unique($roles), $roles, 'getRoles() must not contain duplicate entries.');
        $this->assertCount(1, array_filter($roles, fn ($r) => 'ROLE_USER' === $r));
    }
}
