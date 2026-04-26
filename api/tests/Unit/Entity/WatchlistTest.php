<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Coach;
use App\Entity\Player;
use App\Entity\User;
use App\Entity\Watchlist;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\TestCase;

#[AllowMockObjectsWithoutExpectations]
class WatchlistTest extends TestCase
{
    // ─── id ───────────────────────────────────────────────────────────────────

    public function testIdIsNullByDefault(): void
    {
        $w = new Watchlist();
        $this->assertNull($w->getId());
    }

    // ─── createdAt ────────────────────────────────────────────────────────────

    public function testCreatedAtIsSetOnConstruction(): void
    {
        $before = new DateTimeImmutable();
        $w = new Watchlist();
        $after = new DateTimeImmutable();

        $this->assertGreaterThanOrEqual($before, $w->getCreatedAt());
        $this->assertLessThanOrEqual($after, $w->getCreatedAt());
    }

    // ─── isAnonymous ──────────────────────────────────────────────────────────

    public function testIsAnonymousDefaultsToTrue(): void
    {
        $w = new Watchlist();
        $this->assertTrue($w->isAnonymous());
    }

    public function testSetIsAnonymousFalse(): void
    {
        $w = new Watchlist();
        $result = $w->setIsAnonymous(false);

        $this->assertFalse($w->isAnonymous());
        $this->assertSame($w, $result);
    }

    public function testSetIsAnonymousTrue(): void
    {
        $w = new Watchlist();
        $w->setIsAnonymous(false);
        $w->setIsAnonymous(true);

        $this->assertTrue($w->isAnonymous());
    }

    // ─── watcher ──────────────────────────────────────────────────────────────

    public function testSetAndGetWatcher(): void
    {
        $w = new Watchlist();
        $user = $this->createMock(User::class);
        $result = $w->setWatcher($user);

        $this->assertSame($user, $w->getWatcher());
        $this->assertSame($w, $result);
    }

    // ─── watchedPlayer ────────────────────────────────────────────────────────

    public function testWatchedPlayerDefaultsToNull(): void
    {
        $w = new Watchlist();
        $this->assertNull($w->getWatchedPlayer());
    }

    public function testSetAndGetWatchedPlayer(): void
    {
        $w = new Watchlist();
        $player = $this->createMock(Player::class);
        $result = $w->setWatchedPlayer($player);

        $this->assertSame($player, $w->getWatchedPlayer());
        $this->assertSame($w, $result);
    }

    public function testSetWatchedPlayerToNull(): void
    {
        $w = new Watchlist();
        $player = $this->createMock(Player::class);
        $w->setWatchedPlayer($player);
        $w->setWatchedPlayer(null);

        $this->assertNull($w->getWatchedPlayer());
    }

    // ─── watchedCoach ─────────────────────────────────────────────────────────

    public function testWatchedCoachDefaultsToNull(): void
    {
        $w = new Watchlist();
        $this->assertNull($w->getWatchedCoach());
    }

    public function testSetAndGetWatchedCoach(): void
    {
        $w = new Watchlist();
        $coach = $this->createMock(Coach::class);
        $result = $w->setWatchedCoach($coach);

        $this->assertSame($coach, $w->getWatchedCoach());
        $this->assertSame($w, $result);
    }

    public function testSetWatchedCoachToNull(): void
    {
        $w = new Watchlist();
        $coach = $this->createMock(Coach::class);
        $w->setWatchedCoach($coach);
        $w->setWatchedCoach(null);

        $this->assertNull($w->getWatchedCoach());
    }

    // ─── mutual exclusivity (business rule) ───────────────────────────────────

    public function testPlayerAndCoachCanBeSetIndependently(): void
    {
        $w = new Watchlist();
        $player = $this->createMock(Player::class);
        $coach = $this->createMock(Coach::class);

        $w->setWatchedPlayer($player);
        $this->assertSame($player, $w->getWatchedPlayer());
        $this->assertNull($w->getWatchedCoach());

        $w->setWatchedPlayer(null);
        $w->setWatchedCoach($coach);
        $this->assertSame($coach, $w->getWatchedCoach());
        $this->assertNull($w->getWatchedPlayer());
    }
}
