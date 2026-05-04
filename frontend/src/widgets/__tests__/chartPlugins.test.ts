/**
 * Tests for report/chartPlugins — verifies plugins are valid Chart.js plugin objects.
 */
import { boxplotPlugin, heatmapOverlayPlugin, heatmapGridPlugin } from '../report/chartPlugins';

// ── Canvas 2D context fake ──
function makeFakeCtx() {
  return {
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    strokeStyle: '',
    lineWidth: 0,
  };
}

function makeFakeChart(overrides: Partial<{
  drawWhiskers: boolean;
  datasets: any[];
  metas: any[];
  yScale: any;
  ctx: any;
}> = {}) {
  const yScale = overrides.yScale ?? { getPixelForValue: (v: number) => 100 - v * 2 };
  const ctx = overrides.ctx ?? makeFakeCtx();
  const datasets = overrides.datasets ?? [];
  const metas = overrides.metas ?? datasets.map(() => ({ data: [] }));
  return {
    options: { _drawWhiskers: overrides.drawWhiskers ?? false },
    ctx,
    scales: { y: yScale },
    data: { datasets },
    getDatasetMeta: (i: number) => metas[i],
  };
}

describe('chartPlugins', () => {
  describe('boxplotPlugin', () => {
    it('has id "boxplot"', () => {
      expect(boxplotPlugin.id).toBe('boxplot');
    });

    it('has an afterDatasetsDraw hook (not beforeDatasetsDraw)', () => {
      expect(typeof (boxplotPlugin as any).afterDatasetsDraw).toBe('function');
      expect((boxplotPlugin as any).beforeDatasetsDraw).toBeUndefined();
    });

    it('exits early when _drawWhiskers is false', () => {
      const ctx = makeFakeCtx();
      const chart = makeFakeChart({ drawWhiskers: false, ctx });
      (boxplotPlugin as any).afterDatasetsDraw(chart);
      expect(ctx.beginPath).not.toHaveBeenCalled();
    });

    it('exits early when y scale is missing', () => {
      const ctx = makeFakeCtx();
      const chart = makeFakeChart({ drawWhiskers: true, ctx });
      (chart as any).scales = {}; // no y scale
      (boxplotPlugin as any).afterDatasetsDraw(chart);
      expect(ctx.beginPath).not.toHaveBeenCalled();
    });

    it('skips datasets without _boxplotBox flag', () => {
      const ctx = makeFakeCtx();
      const dataset = { label: 'DS', _boxplotBox: false, _rawArrays: [[1, 2, 3]] };
      const meta = { data: [{ x: 50, width: 20 }] };
      const chart = makeFakeChart({ drawWhiskers: true, datasets: [dataset], metas: [meta], ctx });
      (boxplotPlugin as any).afterDatasetsDraw(chart);
      expect(ctx.beginPath).not.toHaveBeenCalled();
    });

    it('skips entry when rawArrays entry is empty', () => {
      const ctx = makeFakeCtx();
      const dataset = { label: 'DS', _boxplotBox: true, _rawArrays: [[]] };
      const meta = { data: [{ x: 50, width: 20 }] };
      const chart = makeFakeChart({ drawWhiskers: true, datasets: [dataset], metas: [meta], ctx });
      (boxplotPlugin as any).afterDatasetsDraw(chart);
      expect(ctx.beginPath).not.toHaveBeenCalled();
    });

    it('draws whiskers and median for valid data', () => {
      const ctx = makeFakeCtx();
      // 5 sorted values: min=1 q1=2 median=3 q3=4 max=5
      const dataset = {
        label: 'DS',
        _boxplotBox: true,
        borderColor: '#3366CC',
        _rawArrays: [[1, 2, 3, 4, 5]],
      };
      const meta = { data: [{ x: 50, width: 30 }] };
      const chart = makeFakeChart({ drawWhiskers: true, datasets: [dataset], metas: [meta], ctx });
      (boxplotPlugin as any).afterDatasetsDraw(chart);
      // beginPath called at least twice: whiskers + median
      expect(ctx.beginPath).toHaveBeenCalledTimes(2);
      // save/restore wrapping
      expect(ctx.save).toHaveBeenCalledTimes(1);
      expect(ctx.restore).toHaveBeenCalledTimes(1);
    });

    it('draws median line in red (#cc0000)', () => {
      const ctx = makeFakeCtx();
      const strokeStyles: string[] = [];
      Object.defineProperty(ctx, 'strokeStyle', {
        get: () => strokeStyles[strokeStyles.length - 1] ?? '',
        set: (v: string) => strokeStyles.push(v),
      });
      const dataset = {
        label: 'DS',
        _boxplotBox: true,
        _rawArrays: [[1, 2, 3, 4, 5]],
      };
      const meta = { data: [{ x: 50, width: 30 }] };
      const chart = makeFakeChart({ drawWhiskers: true, datasets: [dataset], metas: [meta], ctx });
      (boxplotPlugin as any).afterDatasetsDraw(chart);
      expect(strokeStyles).toContain('#cc0000');
    });

    it('does not throw when chart has no _drawWhiskers option', () => {
      const fakeChart = { options: {}, ctx: {}, scales: {}, data: { datasets: [] } };
      expect(() => (boxplotPlugin as any).afterDatasetsDraw(fakeChart)).not.toThrow();
    });
  });

  describe('heatmapOverlayPlugin', () => {
    it('has a correct id', () => {
      expect(heatmapOverlayPlugin.id).toBe('heatmapOverlay');
    });

    it('has a beforeDatasetsDraw hook', () => {
      expect(typeof heatmapOverlayPlugin.beforeDatasetsDraw).toBe('function');
    });

    it('does not throw when no canvas is provided', () => {
      const fakeChart = { options: { plugins: {} }, ctx: {}, chartArea: null };
      expect(() => heatmapOverlayPlugin.beforeDatasetsDraw(fakeChart)).not.toThrow();
    });
  });

  describe('heatmapGridPlugin', () => {
    it('has a correct id', () => {
      expect(heatmapGridPlugin.id).toBe('heatmapGrid');
    });

    it('has a beforeDatasetsDraw hook', () => {
      expect(typeof heatmapGridPlugin.beforeDatasetsDraw).toBe('function');
    });

    it('does not throw when no grid options are provided', () => {
      const fakeChart = { options: { plugins: {} }, ctx: {}, chartArea: null };
      expect(() => heatmapGridPlugin.beforeDatasetsDraw(fakeChart)).not.toThrow();
    });
  });
});
