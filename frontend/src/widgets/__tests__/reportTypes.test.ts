/**
 * Tests for report/reportTypes — type-level smoke test ensuring interfaces are usable.
 */
import type { FacetedPanel, ReportData } from '../report/reportTypes';

describe('reportTypes', () => {
  it('FacetedPanel objects are structurally correct', () => {
    const panel: FacetedPanel = {
      title: 'Rasen',
      labels: ['Tore', 'Vorlagen', 'Schüsse'],
      datasets: [
        { label: 'Spieler A', data: [3, 5, 12] },
        { label: 'Spieler B', data: [1, 7, 9] },
      ],
    };
    expect(panel.title).toBe('Rasen');
    expect(panel.labels).toHaveLength(3);
    expect(panel.datasets).toHaveLength(2);
    expect(panel.datasets[0].data).toEqual([3, 5, 12]);
  });

  it('ReportData for a standard bar chart', () => {
    const report: ReportData = {
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [{ label: 'Score', data: [10, 20, 30] }],
      diagramType: 'bar',
    };
    expect(report.diagramType).toBe('bar');
    expect(report.labels).toHaveLength(3);
  });

  it('ReportData for a faceted chart includes panels', () => {
    const report: ReportData = {
      labels: [],
      datasets: [],
      diagramType: 'faceted',
      panels: [
        {
          title: 'Kunstrasen',
          labels: ['Tore'],
          datasets: [{ label: 'A', data: [5] }],
        },
      ],
      facetSubType: 'radar',
      facetLayout: 'interactive',
    };
    expect(report.panels).toHaveLength(1);
    expect(report.facetSubType).toBe('radar');
    expect(report.facetLayout).toBe('interactive');
  });
});
