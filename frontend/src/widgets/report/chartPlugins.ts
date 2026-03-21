/**
 * Custom Chart.js plugins: boxplot, heatmap overlay, heatmap grid.
 * Also handles global Chart.js component registration.
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Title,
  Filler,
} from 'chart.js';

// ── Chart.js component registration (once per app) ──
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Title,
  Filler,
);

// ── Boxplot Plugin ──
export const boxplotPlugin = {
  id: 'boxplot',
  beforeDatasetsDraw: (chart: any) => {
    if (!chart.options._drawBoxplots) return;
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    if (!chartArea) return;
    chart.data.datasets.forEach((dataset: any, dsIdx: number) => {
      if (!dataset._boxplot) return;
      const meta = chart.getDatasetMeta(dsIdx);
      (dataset.data || []).forEach((rawEntry: any, idx: number) => {
        if (!Array.isArray(rawEntry)) return;
        const nums = rawEntry.map(Number).filter((n: number) => !isNaN(n)).sort((a: number, b: number) => a - b);
        if (nums.length === 0) return;
        const q1Idx = Math.floor(nums.length * 0.25);
        const q3Idx = Math.floor(nums.length * 0.75);
        const medIdx = Math.floor(nums.length * 0.5);
        const q1 = nums[q1Idx];
        const q3 = nums[q3Idx];
        const median = nums[medIdx];
        const minVal = nums[0];
        const maxVal = nums[nums.length - 1];
        const yScale = chart.scales.y;
        if (!yScale) return;
        const yQ1 = yScale.getPixelForValue(q1);
        const yQ3 = yScale.getPixelForValue(q3);
        const yMed = yScale.getPixelForValue(median);
        const yMin = yScale.getPixelForValue(minVal);
        const yMax = yScale.getPixelForValue(maxVal);
        const element = meta.data[idx];
        if (!element) return;
        const x = element.x;
        const halfWidth = Math.min(30, (chartArea.right - chartArea.left) / (dataset.data.length * chart.data.datasets.length * 2.5));
        ctx.save();
        // Box (Q1..Q3)
        ctx.fillStyle = dataset.backgroundColor || 'rgba(100,150,255,0.35)';
        ctx.fillRect(x - halfWidth, yQ3, halfWidth * 2, yQ1 - yQ3);
        ctx.strokeStyle = dataset.borderColor || '#3366CC';
        ctx.lineWidth = dataset.borderWidth || 1.5;
        ctx.strokeRect(x - halfWidth, yQ3, halfWidth * 2, yQ1 - yQ3);
        // Median line
        ctx.beginPath();
        ctx.moveTo(x - halfWidth, yMed);
        ctx.lineTo(x + halfWidth, yMed);
        ctx.strokeStyle = '#c00';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Whiskers
        ctx.beginPath();
        ctx.moveTo(x, yQ3);
        ctx.lineTo(x, yMax);
        ctx.moveTo(x - halfWidth * 0.5, yMax);
        ctx.lineTo(x + halfWidth * 0.5, yMax);
        ctx.moveTo(x, yQ1);
        ctx.lineTo(x, yMin);
        ctx.moveTo(x - halfWidth * 0.5, yMin);
        ctx.lineTo(x + halfWidth * 0.5, yMin);
        ctx.strokeStyle = dataset.borderColor || '#3366CC';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });
    });
  },
};

ChartJS.register(boxplotPlugin as any);

// ── Heatmap Overlay Plugin ──
export const heatmapOverlayPlugin = {
  id: 'heatmapOverlay',
  beforeDatasetsDraw: (chart: any) => {
    const canvas = chart.options?.plugins?.heatmapOverlay?.canvas;
    if (!canvas) return;
    const chartArea = chart.chartArea;
    if (!chartArea) return;
    chart.ctx.save();
    chart.ctx.globalCompositeOperation = 'source-over';
    chart.ctx.drawImage(
      canvas,
      chartArea.left,
      chartArea.top,
      chartArea.right - chartArea.left,
      chartArea.bottom - chartArea.top,
    );
    chart.ctx.restore();
  },
};

ChartJS.register(heatmapOverlayPlugin as any);

// ── Heatmap Grid Plugin ──
export const heatmapGridPlugin = {
  id: 'heatmapGrid',
  beforeDatasetsDraw: (chart: any) => {
    const opts = chart.options?.plugins?.heatmapGrid;
    if (!opts || !opts.gridPoints) return;
    const gridPoints = opts.gridPoints as Array<{
      r: number;
      c: number;
      v: number;
      intensity: number;
    }>;
    const labels = opts.labels || [];
    const dsets = opts.dsets || [];
    const chartArea = chart.chartArea;
    if (!chartArea) return;
    const ctx = chart.ctx;
    const cellW = (chartArea.right - chartArea.left) / Math.max(1, labels.length);
    const cellH = (chartArea.bottom - chartArea.top) / Math.max(1, dsets.length);
    ctx.save();
    const mapColor = (intensity: number) => {
      const t = Math.max(0, Math.min(1, intensity));
      const alpha = t * 0.6;
      const r = Math.round(255 * t);
      const g = Math.round(140 * (1 - t));
      return `rgba(${r},${g},0,${alpha})`;
    };
    gridPoints.forEach((p) => {
      const x = chartArea.left + p.c * cellW;
      const y = chartArea.top + p.r * cellH;
      ctx.fillStyle = mapColor(p.intensity);
      ctx.fillRect(x, y, cellW, cellH);
    });
    ctx.restore();
  },
};

ChartJS.register(heatmapGridPlugin as any);
