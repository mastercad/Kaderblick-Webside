/**
 * Shared helper utilities for the Report widget system:
 * color palettes, label truncation, heatColor, heatmap canvas generation,
 * and moving-average computation.
 */

// ── Color palettes ──

export const defaultColors = [
  '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
  '#0099C6', '#DD4477', '#66AA00', '#B82E2E', '#316395',
  '#994499', '#22AA99', '#AAAA11', '#6633CC', '#E67300',
  '#8B0707', '#329262', '#5574A6', '#3B3EAC',
];

export const rgbaColors = [
  'rgba(51,102,204,0.35)', 'rgba(220,57,18,0.35)', 'rgba(255,153,0,0.35)',
  'rgba(16,150,24,0.35)', 'rgba(153,0,153,0.35)', 'rgba(0,153,198,0.35)',
  'rgba(221,68,119,0.35)', 'rgba(102,170,0,0.35)', 'rgba(184,46,46,0.35)',
  'rgba(49,99,149,0.35)',
];

// ── Label helpers ──

/**
 * Truncate a label to `maxLen` characters, appending '…' if trimmed.
 */
export const truncateLabel = (label: string, maxLen: number): string => {
  if (!label || label.length <= maxLen) return label;
  return label.substring(0, maxLen - 1) + '…';
};

// ── Heat-color mapping ──

/**
 * Map an intensity value (0..1) to an rgba heat-color string.
 */
export const heatColor = (t: number): string => {
  const r = Math.round(255 * Math.min(1, Math.max(0, 2 * t)));
  const g = Math.round(255 * Math.min(1, Math.max(0, 2 * (1 - Math.abs(t - 0.5)))));
  const b = Math.round(255 * Math.min(1, Math.max(0, 2 * (1 - t))));
  return `rgba(${r},${g},${b},0.6)`;
};

// ── Heatmap canvas ──

/**
 * Generate an offscreen canvas with radial blobs for kernel-smoothed heatmap overlays.
 */
export function generateHeatmapCanvas(
  points: Array<{ x: number; y: number; intensity: number }>,
  width = 400,
  height = 300,
  radius = 40,
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'lighter';
  points.forEach((p) => {
    const px = (p.x / 100) * width;
    const py = (p.y / 100) * height;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
    const alpha = Math.max(0, Math.min(1, p.intensity));
    grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
    grad.addColorStop(0.2, `rgba(255,200,0,${alpha * 0.9})`);
    grad.addColorStop(0.5, `rgba(255,80,0,${alpha * 0.6})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad as any;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  // Apply a color map by sampling and remapping pixels
  const image = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < image.data.length; i += 4) {
    const alphaVal = image.data[i + 3] / 255;
    if (alphaVal <= 0) continue;
    const rr = Math.round(255 * Math.min(1, Math.max(0, 2 * alphaVal)));
    const gg = Math.round(255 * Math.min(1, Math.max(0, 2 * (1 - Math.abs(alphaVal - 0.5)))));
    const bb = Math.round(255 * Math.min(1, Math.max(0, 2 * (1 - alphaVal))));
    image.data[i] = rr;
    image.data[i + 1] = gg;
    image.data[i + 2] = bb;
    image.data[i + 3] = Math.round(255 * Math.min(1, alphaVal));
  }
  ctx.putImageData(image, 0, 0);
  return c;
}

// ── Moving average ──

/**
 * Compute a simple moving-average overlay for each dataset.
 * Returns new line-type datasets styled as dashed overlay lines.
 */
export function applyMovingAverage(
  datasets: Array<{ label: string; data: number[]; borderColor?: string; [key: string]: any }>,
  windowSize: number,
): any[] {
  const maDatasets: any[] = [];
  datasets.forEach((ds, idx) => {
    const raw = ds.data as number[];
    if (!Array.isArray(raw)) return;
    const ma: number[] = [];
    for (let i = 0; i < raw.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
        const v = Number(raw[j]);
        if (!isNaN(v)) {
          sum += v;
          count++;
        }
      }
      ma.push(count > 0 ? sum / count : 0);
    }
    maDatasets.push({
      label: `${ds.label} (MA ${windowSize})`,
      data: ma,
      borderColor: ds.borderColor || defaultColors[idx % defaultColors.length],
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [6, 4],
      fill: false,
      yAxisID: ds.yAxisID ?? 'y',
      type: 'line',
    });
  });
  return maDatasets;
}
