/**
 * Tests for report/chartPlugins — verifies plugins are valid Chart.js plugin objects.
 */
import { boxplotPlugin, heatmapOverlayPlugin, heatmapGridPlugin } from '../report/chartPlugins';

describe('chartPlugins', () => {
  describe('boxplotPlugin', () => {
    it('has a correct id', () => {
      expect(boxplotPlugin.id).toBe('boxplot');
    });

    it('has a beforeDatasetsDraw hook', () => {
      expect(typeof boxplotPlugin.beforeDatasetsDraw).toBe('function');
    });

    it('does not throw when chart has no _drawBoxplots option', () => {
      const fakeChart = { options: {}, ctx: {}, chartArea: null, data: { datasets: [] } };
      expect(() => boxplotPlugin.beforeDatasetsDraw(fakeChart)).not.toThrow();
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
