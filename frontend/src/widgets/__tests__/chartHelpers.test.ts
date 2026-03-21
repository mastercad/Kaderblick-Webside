/**
 * Tests for report/chartHelpers — pure utility functions.
 */
import {
  defaultColors,
  rgbaColors,
  truncateLabel,
  heatColor,
  applyMovingAverage,
} from '../report/chartHelpers';

// ── truncateLabel ──

describe('truncateLabel', () => {
  it('returns the original label when shorter than maxLen', () => {
    expect(truncateLabel('abc', 10)).toBe('abc');
  });

  it('returns the original label when exactly maxLen', () => {
    expect(truncateLabel('abcde', 5)).toBe('abcde');
  });

  it('truncates and appends ellipsis when label is longer than maxLen', () => {
    expect(truncateLabel('abcdef', 5)).toBe('abcd…');
  });

  it('handles empty string', () => {
    expect(truncateLabel('', 5)).toBe('');
  });

  it('handles null-ish input gracefully', () => {
    expect(truncateLabel(undefined as any, 5)).toBe(undefined);
    expect(truncateLabel(null as any, 5)).toBe(null);
  });

  it('handles maxLen=1 (just ellipsis)', () => {
    expect(truncateLabel('hello', 1)).toBe('…');
  });
});

// ── heatColor ──

describe('heatColor', () => {
  it('returns an rgba string for t=0', () => {
    const color = heatColor(0);
    expect(color).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
  });

  it('returns an rgba string for t=1', () => {
    const color = heatColor(1);
    expect(color).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
  });

  it('returns an rgba string for t=0.5', () => {
    const color = heatColor(0.5);
    expect(color).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
  });

  it('clamps values below 0', () => {
    const color = heatColor(-0.5);
    // Should not throw, returns valid rgba
    expect(color).toMatch(/^rgba\(/);
  });

  it('clamps values above 1', () => {
    const color = heatColor(1.5);
    expect(color).toMatch(/^rgba\(/);
  });
});

// ── applyMovingAverage ──

describe('applyMovingAverage', () => {
  it('returns an empty array when datasets is empty', () => {
    const result = applyMovingAverage([], 3);
    expect(result).toEqual([]);
  });

  it('computes a simple moving average with window=1 (identity)', () => {
    const datasets = [{ label: 'A', data: [10, 20, 30, 40, 50] }];
    const result = applyMovingAverage(datasets, 1);
    expect(result).toHaveLength(1);
    expect(result[0].data).toEqual([10, 20, 30, 40, 50]);
    expect(result[0].label).toBe('A (MA 1)');
  });

  it('computes a moving average with window=3', () => {
    const datasets = [{ label: 'Goals', data: [3, 6, 9, 12, 15] }];
    const result = applyMovingAverage(datasets, 3);
    expect(result).toHaveLength(1);
    // i=0: 3/1 = 3
    // i=1: (3+6)/2 = 4.5
    // i=2: (3+6+9)/3 = 6
    // i=3: (6+9+12)/3 = 9
    // i=4: (9+12+15)/3 = 12
    expect(result[0].data).toEqual([3, 4.5, 6, 9, 12]);
  });

  it('applies moving average to multiple datasets independently', () => {
    const datasets = [
      { label: 'A', data: [2, 4, 6] },
      { label: 'B', data: [10, 20, 30] },
    ];
    const result = applyMovingAverage(datasets, 2);
    expect(result).toHaveLength(2);
    // A: [2, (2+4)/2=3, (4+6)/2=5]
    expect(result[0].data).toEqual([2, 3, 5]);
    // B: [10, (10+20)/2=15, (20+30)/2=25]
    expect(result[1].data).toEqual([10, 15, 25]);
  });

  it('returns dashed line datasets', () => {
    const datasets = [{ label: 'X', data: [1, 2, 3] }];
    const result = applyMovingAverage(datasets, 2);
    expect(result[0].borderDash).toEqual([6, 4]);
    expect(result[0].fill).toBe(false);
    expect(result[0].type).toBe('line');
  });

  it('uses default color when borderColor is missing', () => {
    const datasets = [{ label: 'X', data: [1, 2] }];
    const result = applyMovingAverage(datasets, 2);
    expect(result[0].borderColor).toBe(defaultColors[0]);
  });

  it('preserves provided borderColor', () => {
    const datasets = [{ label: 'X', data: [1, 2], borderColor: '#ff0000' }];
    const result = applyMovingAverage(datasets, 2);
    expect(result[0].borderColor).toBe('#ff0000');
  });

  it('handles NaN values gracefully', () => {
    const datasets = [{ label: 'X', data: [NaN, 10, NaN, 20] as any }];
    const result = applyMovingAverage(datasets, 2);
    // i=0: NaN skipped → 0/0 → 0
    // i=1: only 10 valid → 10/1 = 10
    // i=2: only 10 valid → 10/1 = 10
    // i=3: only 20 valid → 20/1 = 20
    expect(result[0].data).toEqual([0, 10, 10, 20]);
  });
});

// ── Color arrays ──

describe('color palettes', () => {
  it('defaultColors has at least 10 entries', () => {
    expect(defaultColors.length).toBeGreaterThanOrEqual(10);
  });

  it('rgbaColors has at least 10 entries', () => {
    expect(rgbaColors.length).toBeGreaterThanOrEqual(10);
  });

  it('defaultColors entries are valid hex strings', () => {
    defaultColors.forEach((c) => {
      expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('rgbaColors entries are valid rgba strings', () => {
    rgbaColors.forEach((c) => {
      expect(c).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
    });
  });
});
