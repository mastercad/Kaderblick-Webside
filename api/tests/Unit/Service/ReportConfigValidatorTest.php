<?php

namespace App\Tests\Unit\Service;

use App\Service\ReportConfigValidator;
use PHPUnit\Framework\TestCase;

class ReportConfigValidatorTest extends TestCase
{
    private ReportConfigValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new ReportConfigValidator();
    }

    public function testValidateAppliesDefaultsForEmptyConfig(): void
    {
        $result = $this->validator->validate([]);

        $this->assertSame('bar', $result['diagramType']);
        $this->assertSame('player', $result['xField']);
        $this->assertSame('goals', $result['yField']);
    }

    public function testValidateAppliesDefaultsForEmptyStrings(): void
    {
        $result = $this->validator->validate([
            'diagramType' => '',
            'xField' => '',
            'yField' => '',
        ]);

        $this->assertSame('bar', $result['diagramType']);
        $this->assertSame('player', $result['xField']);
        $this->assertSame('goals', $result['yField']);
    }

    public function testValidatePreservesExistingValues(): void
    {
        $result = $this->validator->validate([
            'diagramType' => 'line',
            'xField' => 'team',
            'yField' => 'assists',
        ]);

        $this->assertSame('line', $result['diagramType']);
        $this->assertSame('team', $result['xField']);
        $this->assertSame('assists', $result['yField']);
    }

    public function testValidatePreservesExtraKeys(): void
    {
        $result = $this->validator->validate([
            'diagramType' => 'radar',
            'xField' => 'player',
            'yField' => 'goals',
            'groupBy' => ['team'],
            'filters' => ['team' => 5],
        ]);

        $this->assertSame('radar', $result['diagramType']);
        $this->assertSame(['team'], $result['groupBy']);
        $this->assertSame(['team' => 5], $result['filters']);
    }

    public function testValidatePartialDefaultsOnlyFillsMissing(): void
    {
        $result = $this->validator->validate([
            'diagramType' => 'pie',
        ]);

        $this->assertSame('pie', $result['diagramType']);
        $this->assertSame('player', $result['xField']);
        $this->assertSame('goals', $result['yField']);
    }

    public function testValidateDoesNotModifyNullValues(): void
    {
        // null is treated as "not set" by isset(), so defaults should apply
        $result = $this->validator->validate([
            'diagramType' => null,
            'xField' => null,
            'yField' => null,
        ]);

        $this->assertSame('bar', $result['diagramType']);
        $this->assertSame('player', $result['xField']);
        $this->assertSame('goals', $result['yField']);
    }
}
