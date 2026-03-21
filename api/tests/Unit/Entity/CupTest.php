<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Cup;
use PHPUnit\Framework\TestCase;

class CupTest extends TestCase
{
    // -------------------------------------------------------------------------
    // id
    // -------------------------------------------------------------------------

    public function testIdDefaultsToNull(): void
    {
        $cup = new Cup();

        $this->assertNull($cup->getId());
    }

    // -------------------------------------------------------------------------
    // name
    // -------------------------------------------------------------------------

    public function testNameDefaultsToNull(): void
    {
        $cup = new Cup();

        $this->assertNull($cup->getName());
    }

    public function testSetName(): void
    {
        $cup = new Cup();
        $result = $cup->setName('DFB-Pokal');

        $this->assertSame('DFB-Pokal', $cup->getName());
    }

    public function testSetNameReturnsFluentSelf(): void
    {
        $cup = new Cup();

        $this->assertSame($cup, $cup->setName('Kreispokal'));
    }

    public function testSetNameOverwritesPreviousValue(): void
    {
        $cup = new Cup();
        $cup->setName('Alter Name');
        $cup->setName('Neuer Name');

        $this->assertSame('Neuer Name', $cup->getName());
    }

    // -------------------------------------------------------------------------
    // __toString
    // -------------------------------------------------------------------------

    public function testToStringReturnsName(): void
    {
        $cup = new Cup();
        $cup->setName('Stadtpokal');

        $this->assertSame('Stadtpokal', (string) $cup);
    }

    public function testToStringFallbackWhenNameIsNull(): void
    {
        $cup = new Cup();

        $this->assertSame('UNKNOWN CUP', (string) $cup);
    }
}
