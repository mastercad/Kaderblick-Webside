/**
 * ChartRenderer — renders the correct Chart.js chart component
 * based on diagram type. Handles all non-faceted chart types.
 */
import React from 'react';
import { Bar, Line, Pie, Doughnut, Radar, PolarArea, Bubble, Scatter } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import {
  defaultColors,
  rgbaColors,
  truncateLabel,
  heatColor,
  generateHeatmapCanvas,
  applyMovingAverage,
} from './chartHelpers';
import type { ReportData } from './reportTypes';

interface ChartRendererProps {
  type: string;
  data: ReportData;
  chartData: {
    labels: string[];
    datasets: any[];
  };
  options: any;
  dataLabelsPlugin: any;
  isMobile: boolean;
  isTablet: boolean;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  type,
  data,
  chartData,
  options,
  dataLabelsPlugin,
  isMobile,
  isTablet,
}) => {
  const chartProps = { data: chartData, options, plugins: [dataLabelsPlugin] };

  switch (type) {
    case 'bar':
      // key changes when indexAxis changes → forces Chart.js remount because
      // indexAxis cannot be updated on an existing chart instance.
      return <Bar key={options?.indexAxis ?? 'x'} {...chartProps} />;

    case 'line': {
      const lineData = {
        ...chartData,
        datasets: chartData.datasets.map((ds: any) => ({ ...ds, spanGaps: true })),
      };
      return <Line data={lineData} options={options} plugins={[dataLabelsPlugin]} />;
    }

    case 'area': {
      const areaData = {
        ...chartData,
        datasets: chartData.datasets.map((ds: any) => ({ ...ds, spanGaps: true })),
      };
      return <Line data={areaData} options={options} plugins={[dataLabelsPlugin]} />;
    }

    case 'stackedarea': {
      const stackedOptions = {
        ...options,
        scales: {
          x: { ...(options as any).scales?.x, stacked: true },
          y: { ...(options as any).scales?.y, stacked: true },
        },
      };
      const stackedData = {
        ...chartData,
        datasets: chartData.datasets.map((ds: any) => ({ ...ds, fill: true, spanGaps: true })),
      };
      let finalDatasets = stackedData.datasets;
      const maCfg = (data as any).config?.movingAverage;
      if (maCfg && maCfg.enabled && Number.isInteger(maCfg.window) && maCfg.window > 1) {
        const ma = applyMovingAverage(stackedData.datasets, maCfg.window);
        finalDatasets = [...stackedData.datasets, ...ma];
      }
      return <Line data={{ ...stackedData, datasets: finalDatasets }} options={stackedOptions} />;
    }

    case 'pie':
      return <Pie {...chartProps} />;

    case 'doughnut':
      return <Doughnut {...chartProps} />;

    case 'radar': {
      const radarMobileOptions = {
        ...chartProps.options,
        scales: {
          r: {
            ticks: {
              font: { size: isMobile ? 8 : 10 },
              backdropPadding: isMobile ? 1 : 3,
              ...(isMobile ? { maxTicksLimit: 5 } : {}),
            },
            pointLabels: {
              font: { size: isMobile ? 9 : isTablet ? 10 : 12 },
              ...(isMobile
                ? { callback: (label: string) => truncateLabel(label, 12) }
                : {}),
            },
          },
        },
      };
      return <Radar data={chartProps.data} options={radarMobileOptions as any} />;
    }

    case 'polararea':
      return <PolarArea {...chartProps} />;

    case 'bubble':
      return <Bubble {...chartProps} />;

    case 'scatter': {
      const scatterData = {
        labels: data.labels,
        datasets: data.datasets.map((ds: any, i: number) => ({
          label: ds.label,
          data: (ds.data || []).flatMap((v: number | null, idx: number) => v !== null ? [{ x: idx, y: Number(v) }] : []),
          backgroundColor: ds.backgroundColor || defaultColors[i % defaultColors.length],
          borderColor: ds.borderColor || defaultColors[i % defaultColors.length],
          showLine: false,
          pointRadius: isMobile ? 3 : 4,
          hitRadius: isMobile ? 12 : 8,
        })),
      };
      const scatterOptions = {
        ...options,
        scales: {
          x: {
            ...(options as any).scales?.x,
            type: 'linear' as const,
            ticks: {
              ...(options as any).scales?.x?.ticks,
              callback: function (val: any) {
                const labels = data.labels || [];
                if (typeof val === 'number' && Math.round(val) === val) {
                  const labelText = labels[val] ?? val;
                  if (isMobile && typeof labelText === 'string')
                    return truncateLabel(labelText, 10);
                  return labelText;
                }
                return '';
              },
            },
          },
          y: { ...(options as any).scales?.y },
        },
      };
      return <Scatter data={scatterData as any} options={scatterOptions as any} />;
    }

    case 'pitchheatmap': {
      return renderHeatmap(data, options, isMobile);
    }

    case 'boxplot': {
      return renderBoxplot(data, options, isMobile);
    }

    case 'radaroverlay': {
      return renderRadarOverlay(data, options, isMobile, isTablet);
    }

    default:
      return <Bar {...chartProps} />;
  }
};

// ── Heatmap sub-renderer ──

function renderHeatmap(data: ReportData, options: any, isMobile: boolean) {
  const firstDs = data.datasets[0];

  // Point-based input
  if (
    firstDs &&
    firstDs.data &&
    firstDs.data.length > 0 &&
    typeof firstDs.data[0] === 'object' &&
    ('x' in firstDs.data[0] || 'y' in firstDs.data[0])
  ) {
    const pts = firstDs.data;
    const heatDs = {
      label: firstDs.label || 'Heatmap',
      data: pts.map((p: any) => ({ x: Number(p.x), y: Number(p.y) })),
      backgroundColor: pts.map((p: any) =>
        heatColor(Math.min(1, Math.max(0, p.intensity ?? 0))),
      ),
      pointRadius: pts.map((p: any) => p.radius ?? 6),
    };
    const heatOptions = {
      ...options,
      scales: { x: { min: 0, max: 100 }, y: { min: 0, max: 100 } },
    };
    return (
      <Scatter
        data={{ labels: data.labels, datasets: [heatDs] } as any}
        options={heatOptions as any}
      />
    );
  }

  // Matrix-based input
  const labels = data.labels || [];
  const dsets = data.datasets || [];
  const points: any[] = [];
  let maxVal = 0;
  for (let r = 0; r < dsets.length; r++) {
    const row = dsets[r].data || [];
    for (let c = 0; c < labels.length; c++) {
      const v = Number(row[c] ?? 0);
      if (!isNaN(v) && v > maxVal) maxVal = v;
      points.push({ r, c, v });
    }
  }
  const gridPoints = points.map((p) => {
    const x = (p.c / Math.max(1, labels.length - 1)) * 100;
    const y = (p.r / Math.max(1, dsets.length - 1)) * 100;
    const intensity = maxVal > 0 ? p.v / maxVal : 0;
    return { x, y, intensity, radius: 12 };
  });

  const baseRadius = 12;
  const heatDs2 = {
    label: 'Heatmap',
    data: gridPoints.map((p: any) => ({ x: p.x, y: p.y })),
    backgroundColor: gridPoints.map((p: any) => heatColor(p.intensity)),
    pointRadius: gridPoints.map((p: any) =>
      Math.max(3, Math.round(baseRadius * (0.4 + 1.4 * p.intensity))),
    ),
  };
  const xStep = labels.length > 1 ? 100 / Math.max(1, labels.length - 1) : 100;
  const yStep = dsets.length > 1 ? 100 / Math.max(1, dsets.length - 1) : 100;
  const overlayCanvas = generateHeatmapCanvas(
    gridPoints,
    400,
    300,
    Math.max(18, Math.round(baseRadius * 1.5)),
  );

  const heatOptions2: any = {
    ...options,
    plugins: {
      ...(options.plugins || {}),
      heatmapOverlay: { canvas: overlayCanvas },
      tooltip: {
        enabled: true,
        callbacks: {
          title: (items: any[]) => {
            if (!items || items.length === 0) return '';
            const it = items[0];
            const raw = it.raw || it;
            const colIdx = Math.round(
              (raw.x / 100) * Math.max(0, labels.length - 1),
            );
            const rowIdx = Math.round(
              (raw.y / 100) * Math.max(0, dsets.length - 1),
            );
            const colLabel = labels[colIdx] ?? '';
            const rowLabel = dsets[rowIdx]?.label ?? '';
            return `${rowLabel} — ${colLabel}`;
          },
          label: (context: any) => {
            const raw = context.raw || context;
            const colIdx = Math.round(
              (raw.x / 100) * Math.max(0, labels.length - 1),
            );
            const rowIdx = Math.round(
              (raw.y / 100) * Math.max(0, dsets.length - 1),
            );
            const val = dsets[rowIdx]?.data?.[colIdx] ?? 0;
            return `Wert: ${val}`;
          },
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: xStep,
          font: { size: isMobile ? 9 : 12 },
          callback: function (val: any) {
            if (typeof val === 'number') {
              const idx = Math.round((val / 100) * (labels.length - 1));
              const lbl = labels[idx] ?? '';
              return isMobile && typeof lbl === 'string' ? truncateLabel(lbl, 8) : lbl;
            }
            return '';
          },
        },
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: yStep,
          font: { size: isMobile ? 9 : 12 },
          callback: function (val: any) {
            if (typeof val === 'number') {
              const idx = Math.round((val / 100) * (dsets.length - 1));
              const lbl = dsets[idx]?.label ?? '';
              return isMobile && typeof lbl === 'string' ? truncateLabel(lbl, 10) : lbl;
            }
            return '';
          },
        },
      },
    },
  };

  // Classic/grid heatmap style
  const style = (data as any).config?.heatmapStyle || 'smoothed';
  if (style === 'classic' || style === 'both') {
    heatOptions2.plugins.heatmapGrid = { gridPoints: points, labels, dsets };
  }

  return (
    <Scatter
      data={{ labels, datasets: [heatDs2] } as any}
      options={heatOptions2 as any}
    />
  );
}

// ── Boxplot sub-renderer ──

/** Extract sorted numerics from a raw boxplot entry */
function bpNums(entry: unknown): number[] {
  if (!Array.isArray(entry)) return [];
  return entry.map(Number).filter((n) => !isNaN(n)).sort((a: number, b: number) => a - b);
}

/** Compute median from a sorted numeric array */
function arrayMedian(sorted: number[]): number {
  const m = sorted.length;
  if (m === 0) return 0;
  return m % 2 === 1 ? sorted[(m - 1) / 2] : (sorted[m / 2 - 1] + sorted[m / 2]) / 2;
}

function renderBoxplot(data: ReportData, options: any, isMobile: boolean) {
  const labels = data.labels || [];
  const bpDatasets: any[] = [];

  data.datasets.forEach((ds: any, i: number) => {
    const rawArrays: unknown[] = Array.isArray(ds.data) ? ds.data : [];
    const strokeColor = ds.borderColor     || defaultColors[i % defaultColors.length];
    const fillColor   = ds.backgroundColor || rgbaColors[i % rgbaColors.length];

    // Chart.js floating bars use [min, max] array format.
    // NEVER pass null: Chart.js parseObjectData crashes with "Cannot read properties of null (reading 'x')".
    // Use [0, 0] for months with no data → invisible zero-height bar, no crash.
    const boxData = rawArrays.map((entry) => {
      const nums = bpNums(entry);
      if (nums.length === 0) return [0, 0];
      const q1 = nums[Math.floor(nums.length * 0.25)];
      const q3 = nums[Math.floor(nums.length * 0.75)];
      // If Q1 === Q3 (only one game): tiny offset so the bar is still visible
      return q1 === q3 ? [Math.max(0, q1 - 0.1), q3 + 0.1] : [q1, q3];
    });

    bpDatasets.push({
      label: ds.label,
      data: boxData,
      backgroundColor: fillColor,
      borderColor: strokeColor,
      borderWidth: 2,
      borderSkipped: false,
      _rawArrays: rawArrays,
      _boxplotBox: true,
    });
  });

  const bpOptions: any = {
    ...(options as any),
    _drawWhiskers: true,
    scales: { x: { stacked: false }, y: { stacked: false, beginAtZero: true } },
    plugins: {
      ...(options?.plugins ?? {}),
      tooltip: {
        filter: (item: any) => (item.dataset as any)._boxplotBox === true,
        callbacks: {
          label: (context: any) => {
            const rawArrays = (context.dataset._rawArrays as unknown[]) ?? [];
            const entry = rawArrays[context.dataIndex];
            const nums = bpNums(entry);
            if (nums.length === 0) return `${context.dataset.label}: keine Daten`;
            const q1     = nums[Math.floor(nums.length * 0.25)];
            const median = arrayMedian(nums);
            const q3     = nums[Math.floor(nums.length * 0.75)];
            return [
              `${context.dataset.label} (${nums.length} Spiele)`,
              `Median: ${median}`,
              `Q1–Q3: ${q1} – ${q3}`,
              `Min: ${nums[0]}  ·  Max: ${nums[nums.length - 1]}`,
            ];
          },
        },
      },
    },
  };

  const maCfg = (data as any).config?.movingAverage;
  let finalDatasets: any[] = bpDatasets;
  if (maCfg && maCfg.enabled && Number.isInteger(maCfg.window) && maCfg.window > 1) {
    const tempNumericDs = data.datasets.map((ds: any, idx: number) => {
      const rawArrays: unknown[] = Array.isArray(ds.data) ? ds.data : [];
      return {
        label: ds.label,
        data: rawArrays.map((e) => { const s = bpNums(e); return s.length > 0 ? arrayMedian(s) : 0; }),
        borderColor: ds.borderColor || defaultColors[idx % defaultColors.length],
      };
    });
    const maDs = applyMovingAverage(tempNumericDs, maCfg.window);
    finalDatasets = [...bpDatasets, ...maDs];
  }

  return <Bar data={{ labels, datasets: finalDatasets } as any} options={bpOptions as any} />;
}

// ── Radar Overlay sub-renderer ──

function renderRadarOverlay(
  data: ReportData,
  options: any,
  isMobile: boolean,
  isTablet: boolean,
) {
  const labels = data.labels || [];
  const rawDsets = data.datasets || [];
  const normalize = (data as any).config?.radarNormalize === true;

  let maxGlobal = 0;
  rawDsets.forEach((ds: any) => {
    (ds.data || []).forEach((v: any) => {
      const n = Number(v) || 0;
      if (n > maxGlobal) maxGlobal = n;
    });
  });

  const radarDatasets = rawDsets.map((ds: any, i: number) => {
    const arr = (ds.data || []).map((v: any) => Number(v) || 0);
    let values = arr;
    if (normalize) {
      const localMax = Math.max(1, ...arr);
      values = arr.map((v: number) => (localMax > 0 ? v / localMax : 0));
    }
    return {
      label: ds.label || `Series ${i}`,
      data: values,
      backgroundColor: ds.backgroundColor || rgbaColors[i % rgbaColors.length],
      borderColor: ds.borderColor || defaultColors[i % defaultColors.length],
      borderWidth: isMobile ? 1.5 : 2,
      fill: true,
      tension: 0.2,
    };
  });

  const radarScaleBase = {
    ticks: {
      font: { size: isMobile ? 8 : 10 },
      backdropPadding: isMobile ? 1 : 3,
      ...(isMobile ? { maxTicksLimit: 5 } : {}),
    },
    pointLabels: {
      font: { size: isMobile ? 9 : isTablet ? 10 : 12 },
      ...(isMobile
        ? { callback: (label: string) => truncateLabel(label, 12) }
        : {}),
    },
  };

  const radarOptions: any = {
    ...options,
    scales: undefined,
    elements: { line: { borderWidth: isMobile ? 1.5 : 2 } },
    plugins: { ...(options.plugins || {}) },
  };

  if (normalize) {
    radarOptions.scales = {
      r: {
        min: 0,
        max: 1,
        ticks: { ...radarScaleBase.ticks, stepSize: 0.25 },
        pointLabels: radarScaleBase.pointLabels,
      },
    };
  } else {
    radarOptions.scales = {
      r: {
        min: 0,
        max: Math.max(1, maxGlobal),
        ticks: radarScaleBase.ticks,
        pointLabels: radarScaleBase.pointLabels,
      },
    };
  }

  return (
    <Radar data={{ labels, datasets: radarDatasets } as any} options={radarOptions as any} />
  );
}
