/**
 * Custom hook that builds responsive Chart.js options and derived layout values.
 */
import { useMemo } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { Chart as ChartJS } from 'chart.js';
import { truncateLabel } from './chartHelpers';

export interface ChartOptionsDeps {
  /** Current diagram type (lowercase) */
  type: string;
  /** Number of labels in chart data */
  labelCount: number;
  /** Number of datasets */
  datasetCount: number;
  /** Safe labels array */
  safeLabels: string[];
  /** Legend visibility from config */
  cfgShowLegend: boolean;
  /** Data-label visibility from config */
  cfgShowLabels: boolean;
}

/**
 * Returns { options, chartHeight, isMobile, isTablet, dataLabelsPlugin }.
 */
export function useChartOptions(deps: ChartOptionsDeps) {
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.between('sm', 'md'));

  const { type, labelCount, datasetCount, safeLabels, cfgShowLegend, cfgShowLabels } = deps;

  const isPieType = ['pie', 'doughnut', 'polararea'].includes(type);
  const isRadarType = ['radar', 'radaroverlay'].includes(type);
  const hasManylabels = labelCount > 6;

  const options = useMemo(() => {
    const legendFontSize = isMobile ? 10 : isTablet ? 11 : 12;
    const tickFontSize = isMobile ? 9 : isTablet ? 10 : 12;
    const tooltipFontSize = isMobile ? 11 : 13;

    const legendPosition = isMobile ? ('bottom' as const) : ('top' as const);
    const legendBoxWidth = isMobile ? 8 : isTablet ? 10 : 14;
    const legendPadding = isMobile ? 8 : isTablet ? 12 : 18;
    const pieLegendPosition = isMobile ? ('bottom' as const) : ('right' as const);

    const xTickRotation = isMobile && hasManylabels ? 45 : isTablet && hasManylabels ? 30 : 0;
    const maxTicksLimit = isMobile
      ? Math.min(labelCount, 8)
      : isTablet
        ? Math.min(labelCount, 12)
        : undefined;

    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: isMobile
          ? { left: 2, right: 2, top: 4, bottom: 4 }
          : { left: 8, right: 8, top: 8, bottom: 8 },
      },
      plugins: {
        legend: {
          display: cfgShowLegend,
          position: isPieType ? pieLegendPosition : legendPosition,
          maxWidth: undefined as number | undefined,
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: legendBoxWidth,
            boxHeight: isMobile ? 6 : 8,
            padding: legendPadding,
            font: { size: legendFontSize },
            ...(isMobile
              ? {
                  generateLabels: (chart: any) => {
                    const original = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
                    return original.map((item: any) => ({
                      ...item,
                      text: truncateLabel(item.text || '', isPieType ? 14 : 18),
                    }));
                  },
                }
              : {}),
          },
          ...(isMobile ? { maxHeight: isPieType ? 80 : 60 } : {}),
        },
        title: { display: false },
        tooltip: {
          enabled: true,
          titleFont: { size: tooltipFontSize },
          bodyFont: { size: tooltipFontSize },
          padding: isMobile ? 6 : 10,
          ...(isMobile
            ? {
                intersect: false,
                mode: 'nearest' as const,
              }
            : {}),
        },
      },
      hover: {
        mode: 'nearest' as const,
        intersect: !isMobile,
      },
      ...(!isPieType && !isRadarType
        ? {
            scales: {
              x: {
                ticks: {
                  font: { size: tickFontSize },
                  maxRotation: xTickRotation,
                  minRotation: xTickRotation > 0 ? xTickRotation : 0,
                  ...(maxTicksLimit ? { maxTicksLimit } : {}),
                  callback: function (this: any, value: any, index: number) {
                    const label = this.getLabelForValue
                      ? this.getLabelForValue(value)
                      : safeLabels[index] || value;
                    if (typeof label !== 'string') return label;
                    const maxLen = isMobile ? 10 : isTablet ? 16 : 30;
                    return truncateLabel(label, maxLen);
                  },
                },
                grid: { display: !isMobile },
              },
              y: {
                ticks: {
                  font: { size: tickFontSize },
                  ...(isMobile ? { maxTicksLimit: 6 } : {}),
                },
                grid: {
                  ...(isMobile ? { color: 'rgba(0,0,0,0.05)' } : {}),
                },
              },
            },
          }
        : {}),
      elements: {
        point: {
          radius: isMobile ? 2 : 3,
          hoverRadius: isMobile ? 4 : 6,
          hitRadius: isMobile ? 12 : 8,
        },
        line: { borderWidth: isMobile ? 1.5 : 2 },
        bar: { borderWidth: isMobile ? 1 : 2 },
      },
    };
  }, [
    isMobile,
    isTablet,
    isPieType,
    isRadarType,
    hasManylabels,
    labelCount,
    datasetCount,
    safeLabels,
    type,
    cfgShowLegend,
    cfgShowLabels,
  ]);

  const chartHeight = useMemo(() => {
    if (isMobile) {
      if (isPieType) return Math.max(320, 280 + Math.min(datasetCount, labelCount) * 5);
      if (isRadarType) return 320;
      return 300;
    }
    if (isTablet) return 340;
    return 400;
  }, [isMobile, isTablet, isPieType, isRadarType, datasetCount, labelCount]);

  const dataLabelsPlugin = useMemo(
    () => ({
      id: 'inlineDataLabels',
      afterDatasetsDraw(chart: any) {
        if (!cfgShowLabels) return;
        const ctx = chart.ctx;
        ctx.save();
        chart.data.datasets.forEach((dataset: any, dsIdx: number) => {
          const meta = chart.getDatasetMeta(dsIdx);
          if (meta.hidden) return;
          meta.data.forEach((element: any, idx: number) => {
            const raw = dataset.data[idx];
            if (raw == null || (Array.isArray(raw) && raw.length === 0)) return;
            const value =
              typeof raw === 'object' && raw !== null && !Array.isArray(raw)
                ? (raw.y ?? raw.r ?? '')
                : raw;
            if (value === '' || value === undefined) return;
            const label =
              typeof value === 'number'
                ? Number.isInteger(value)
                  ? String(value)
                  : value.toFixed(1)
                : String(value);
            ctx.fillStyle = chart.options?.color || '#666';
            ctx.font = `${isMobile ? 9 : 11}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const { x, y } = element.tooltipPosition();
            ctx.fillText(label, x, y - 4);
          });
        });
        ctx.restore();
      },
    }),
    [cfgShowLabels, isMobile],
  );

  return { options, chartHeight, isMobile, isTablet, dataLabelsPlugin };
}
