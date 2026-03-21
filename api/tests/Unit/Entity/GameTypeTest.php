<?php

namespace App\Tests\Unit\Entity;

use App\Entity\GameType;
use PHPUnit\Framework\TestCase;

/**
 * Unit-Tests für GameType::halfDuration.
 *
 * halfDuration gibt an, wie lange eine Halbzeit in Minuten dauert
 * (z.B. 20 für Jugend, 30 für Halbfeld, 45 für Erwachsene).
 */
class GameTypeTest extends TestCase
{
    // ─────────────────────────────────────────────────────────────────────────
    // Standardwert
    // ─────────────────────────────────────────────────────────────────────────

    public function testHalfDurationDefaultsToNull(): void
    {
        $gameType = new GameType();

        $this->assertNull($gameType->getHalfDuration());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Setzen/Lesen
    // ─────────────────────────────────────────────────────────────────────────

    public function testSetHalfDuration(): void
    {
        $gameType = new GameType();
        $gameType->setHalfDuration(45);

        $this->assertSame(45, $gameType->getHalfDuration());
    }

    public function testSetHalfDurationJuniors(): void
    {
        $gameType = new GameType();
        $gameType->setHalfDuration(20);

        $this->assertSame(20, $gameType->getHalfDuration());
    }

    public function testSetHalfDurationHalfeld(): void
    {
        $gameType = new GameType();
        $gameType->setHalfDuration(30);

        $this->assertSame(30, $gameType->getHalfDuration());
    }

    public function testSetHalfDurationToNullClearsValue(): void
    {
        $gameType = new GameType();
        $gameType->setHalfDuration(45);
        $gameType->setHalfDuration(null);

        $this->assertNull($gameType->getHalfDuration());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fluent API
    // ─────────────────────────────────────────────────────────────────────────

    public function testSetHalfDurationReturnsSelf(): void
    {
        $gameType = new GameType();
        $result = $gameType->setHalfDuration(45);

        $this->assertSame($gameType, $result, 'setHalfDuration() muss $this zurückgeben (fluent API)');
    }

    public function testSetHalfDurationNullReturnsSelf(): void
    {
        $gameType = new GameType();
        $result = $gameType->setHalfDuration(null);

        $this->assertSame($gameType, $result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Name bleibt unberührt
    // ─────────────────────────────────────────────────────────────────────────

    public function testSetHalfDurationDoesNotAffectName(): void
    {
        $gameType = new GameType();
        $gameType->setName('Freundschaftsspiel');
        $gameType->setHalfDuration(30);

        $this->assertSame('Freundschaftsspiel', $gameType->getName());
        $this->assertSame(30, $gameType->getHalfDuration());
    }
}
