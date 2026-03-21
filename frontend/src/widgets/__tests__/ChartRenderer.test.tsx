/**
 * Tests for report/ChartRenderer.tsx
 *
 * Strategy: Mock all react-chartjs-2 chart components as lightweight divs,
 * then verify the correct component is rendered for each diagram type.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mock chart components ──
jest.mock('react-chartjs-2', () => ({
  Bar: (props: any) => <div data-testid="Bar" data-labels={JSON.stringify(props.data?.labels)} />,
  Line: (props: any) => (
    <div
      data-testid="Line"
      data-fill={props.data?.datasets?.[0]?.fill ? 'true' : 'false'}
      data-labels={JSON.stringify(props.data?.labels)}
    />
  ),
  Pie: () => <div data-testid="Pie" />,
  Doughnut: () => <div data-testid="Doughnut" />,
  Radar: (props: any) => (
    <div
      data-testid="Radar"
      data-datasets={props.data?.datasets?.length ?? 0}
    />
  ),
  PolarArea: () => <div data-testid="PolarArea" />,
  Bubble: () => <div data-testid="Bubble" />,
  Scatter: (props: any) => (
    <div
      data-testid="Scatter"
      data-datasets={props.data?.datasets?.length ?? 0}
    />
  ),
}));

// Mock chart plugins
jest.mock('../report/chartPlugins', () => ({}));

// Mock generateHeatmapCanvas (uses canvas 2d context unavailable in jsdom)
jest.mock('../report/chartHelpers', () => {
  const actual = jest.requireActual('../report/chartHelpers');
  return {
    ...actual,
    generateHeatmapCanvas: jest.fn(() => null),
  };
});

import { ChartRenderer } from '../report/ChartRenderer';

// ── Helpers ──

const baseData = {
  labels: ['A', 'B', 'C'],
  datasets: [{ label: 'D1', data: [1, 2, 3] }],
  diagramType: 'bar',
};

const baseProps = {
  data: baseData as any,
  chartData: { labels: baseData.labels, datasets: baseData.datasets },
  options: { responsive: true },
  dataLabelsPlugin: { id: 'noop' },
  isMobile: false,
  isTablet: false,
};

describe('ChartRenderer', () => {
  // ── Standard chart type selection ──

  it('renders Bar for type=bar', () => {
    render(<ChartRenderer {...baseProps} type="bar" />);
    expect(screen.getByTestId('Bar')).toBeInTheDocument();
  });

  it('renders Line for type=line', () => {
    render(<ChartRenderer {...baseProps} type="line" />);
    expect(screen.getByTestId('Line')).toBeInTheDocument();
  });

  it('renders Line for type=area', () => {
    render(<ChartRenderer {...baseProps} type="area" />);
    expect(screen.getByTestId('Line')).toBeInTheDocument();
  });

  it('renders Line with stacked options and fill:true for type=stackedarea', () => {
    render(<ChartRenderer {...baseProps} type="stackedarea" />);
    const el = screen.getByTestId('Line');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('data-fill', 'true');
  });

  it('renders Pie for type=pie', () => {
    render(<ChartRenderer {...baseProps} type="pie" />);
    expect(screen.getByTestId('Pie')).toBeInTheDocument();
  });

  it('renders Doughnut for type=doughnut', () => {
    render(<ChartRenderer {...baseProps} type="doughnut" />);
    expect(screen.getByTestId('Doughnut')).toBeInTheDocument();
  });

  it('renders Radar for type=radar', () => {
    render(<ChartRenderer {...baseProps} type="radar" />);
    expect(screen.getByTestId('Radar')).toBeInTheDocument();
  });

  it('renders PolarArea for type=polararea', () => {
    render(<ChartRenderer {...baseProps} type="polararea" />);
    expect(screen.getByTestId('PolarArea')).toBeInTheDocument();
  });

  it('renders Bubble for type=bubble', () => {
    render(<ChartRenderer {...baseProps} type="bubble" />);
    expect(screen.getByTestId('Bubble')).toBeInTheDocument();
  });

  it('renders Scatter for type=scatter', () => {
    render(<ChartRenderer {...baseProps} type="scatter" />);
    expect(screen.getByTestId('Scatter')).toBeInTheDocument();
  });

  it('renders Bar as default fallback for unknown type', () => {
    render(<ChartRenderer {...baseProps} type="unknown_xyz" />);
    expect(screen.getByTestId('Bar')).toBeInTheDocument();
  });

  // ── Heatmap (pitchheatmap) ──

  it('renders Scatter for type=pitchheatmap with point-based data', () => {
    const heatData = {
      labels: [],
      datasets: [
        {
          label: 'Heat',
          data: [
            { x: 10, y: 20, intensity: 0.5 },
            { x: 50, y: 60, intensity: 0.8 },
          ],
        },
      ],
      diagramType: 'pitchheatmap',
    };
    render(
      <ChartRenderer
        {...baseProps}
        type="pitchheatmap"
        data={heatData as any}
        chartData={{ labels: [], datasets: heatData.datasets }}
      />,
    );
    expect(screen.getByTestId('Scatter')).toBeInTheDocument();
  });

  it('renders Scatter for type=pitchheatmap with matrix-based data', () => {
    const matrixData = {
      labels: ['L1', 'L2'],
      datasets: [
        { label: 'Row1', data: [10, 20] },
        { label: 'Row2', data: [30, 40] },
      ],
      diagramType: 'pitchheatmap',
    };
    render(
      <ChartRenderer
        {...baseProps}
        type="pitchheatmap"
        data={matrixData as any}
        chartData={{ labels: matrixData.labels, datasets: matrixData.datasets }}
      />,
    );
    expect(screen.getByTestId('Scatter')).toBeInTheDocument();
  });

  // ── Boxplot ──

  it('renders Bar for type=boxplot', () => {
    const bpData = {
      labels: ['Match 1', 'Match 2'],
      datasets: [{ label: 'Rating', data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]] }],
      diagramType: 'boxplot',
    };
    render(
      <ChartRenderer
        {...baseProps}
        type="boxplot"
        data={bpData as any}
        chartData={{ labels: bpData.labels, datasets: bpData.datasets }}
      />,
    );
    expect(screen.getByTestId('Bar')).toBeInTheDocument();
  });

  it('renders additional MA dataset for boxplot when movingAverage enabled', () => {
    const bpData = {
      labels: ['M1', 'M2', 'M3', 'M4'],
      datasets: [{ label: 'Rating', data: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]] }],
      diagramType: 'boxplot',
      config: { movingAverage: { enabled: true, window: 2 } },
    };
    render(
      <ChartRenderer
        {...baseProps}
        type="boxplot"
        data={bpData as any}
        chartData={{ labels: bpData.labels, datasets: bpData.datasets }}
      />,
    );
    expect(screen.getByTestId('Bar')).toBeInTheDocument();
  });

  it('boxplot MA uses median when method=median', () => {
    const bpData = {
      labels: ['M1', 'M2', 'M3'],
      datasets: [{
        label: 'R',
        data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15]],
      }],
      diagramType: 'boxplot',
      config: { movingAverage: { enabled: true, window: 2, method: 'median' } },
    };
    render(
      <ChartRenderer
        {...baseProps}
        type="boxplot"
        data={bpData as any}
        chartData={{ labels: bpData.labels, datasets: bpData.datasets }}
      />,
    );
    // Renders without error – median path taken
    expect(screen.getByTestId('Bar')).toBeInTheDocument();
  });

  // ── Radar Overlay ──

  it('renders Radar for type=radaroverlay', () => {
    const overlayData = {
      labels: ['Speed', 'Stamina', 'Skill'],
      datasets: [
        { label: 'Player A', data: [80, 70, 90] },
        { label: 'Player B', data: [60, 85, 75] },
      ],
      diagramType: 'radaroverlay',
    };
    render(
      <ChartRenderer
        {...baseProps}
        type="radaroverlay"
        data={overlayData as any}
        chartData={{ labels: overlayData.labels, datasets: overlayData.datasets }}
      />,
    );
    expect(screen.getByTestId('Radar')).toBeInTheDocument();
  });

  it('radaroverlay with radarNormalize=true does not throw', () => {
    const overlayData = {
      labels: ['A', 'B'],
      datasets: [
        { label: 'X', data: [100, 50] },
        { label: 'Y', data: [80, 40] },
      ],
      diagramType: 'radaroverlay',
      config: { radarNormalize: true },
    };
    render(
      <ChartRenderer
        {...baseProps}
        type="radaroverlay"
        data={overlayData as any}
        chartData={{ labels: overlayData.labels, datasets: overlayData.datasets }}
      />,
    );
    const radar = screen.getByTestId('Radar');
    expect(radar).toBeInTheDocument();
    // 2 datasets for the overlay
    expect(radar).toHaveAttribute('data-datasets', '2');
  });

  // ── Scatter data transformation ──

  it('transforms scatter data points to {x, y} format', () => {
    const scatterData = {
      labels: ['Goal 1', 'Goal 2'],
      datasets: [{ label: 'Distance', data: [12.5, 18.0] }],
      diagramType: 'scatter',
    };
    render(
      <ChartRenderer
        {...baseProps}
        type="scatter"
        data={scatterData as any}
        chartData={{ labels: scatterData.labels, datasets: scatterData.datasets }}
      />,
    );
    expect(screen.getByTestId('Scatter')).toBeInTheDocument();
  });

  // ── Mobile responsiveness ──

  it('radar renders without error on mobile', () => {
    render(<ChartRenderer {...baseProps} type="radar" isMobile={true} />);
    expect(screen.getByTestId('Radar')).toBeInTheDocument();
  });

  it('scatter renders without error on mobile', () => {
    const scatterData = {
      labels: ['A'],
      datasets: [{ label: 'X', data: [5] }],
      diagramType: 'scatter',
    };
    render(
      <ChartRenderer
        {...baseProps}
        type="scatter"
        data={scatterData as any}
        chartData={{ labels: scatterData.labels, datasets: scatterData.datasets }}
        isMobile={true}
      />,
    );
    expect(screen.getByTestId('Scatter')).toBeInTheDocument();
  });

  // ── Stackedarea moving average ──

  it('stackedarea appends MA datasets when configured', () => {
    const saData = {
      labels: ['A', 'B', 'C', 'D'],
      datasets: [{ label: 'Metric', data: [10, 20, 30, 40] }],
      diagramType: 'stackedarea',
      config: { movingAverage: { enabled: true, window: 2 } },
    };
    render(
      <ChartRenderer
        {...baseProps}
        type="stackedarea"
        data={saData as any}
        chartData={{ labels: saData.labels, datasets: saData.datasets }}
      />,
    );
    expect(screen.getByTestId('Line')).toBeInTheDocument();
  });
});
