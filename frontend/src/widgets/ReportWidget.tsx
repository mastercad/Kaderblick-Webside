/**
 * ReportWidget — main entry-point for rendering a report chart.
 *
 * This is a thin composition layer that delegates to:
 *   - report/chartPlugins.ts   – Chart.js plugin registrations
 *   - report/chartHelpers.ts   – colors, truncation, moving average, heatmap canvas
 *   - report/reportTypes.ts    – shared interfaces
 *   - report/useChartOptions.ts – responsive chart options hook
 *   - report/FacetedChart.tsx  – faceted multi-panel renderer
 *   - report/ChartRenderer.tsx – single-chart type switch
 */
import React, { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { apiJson } from '../utils/api';
import { useWidgetRefresh } from '../context/WidgetRefreshContext';

// Side-effect import: registers Chart.js components & plugins globally
import './report/chartPlugins';

import type { ReportData, FacetedPanel } from './report/reportTypes';
import { defaultColors, rgbaColors, applyMovingAverage } from './report/chartHelpers';
import { useChartOptions } from './report/useChartOptions';
import { FacetedChart } from './report/FacetedChart';
import { ChartRenderer } from './report/ChartRenderer';

export const ReportWidget: React.FC<{ config?: any; reportId?: number; widgetId?: string }> = ({
  config,
  reportId,
  widgetId,
}) => {
  const { getRefreshTrigger } = useWidgetRefresh();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePanelIdx, setActivePanelIdx] = useState(0);

  const refreshTrigger = widgetId ? getRefreshTrigger(widgetId) : 0;

  // ── Data fetching ──
  useEffect(() => {
    if (config && ((config.labels && config.datasets) || config.panels)) {
      setData(config);
      setLoading(false);
      return;
    }
    if (!reportId) return;
    setLoading(true);
    setError(null);
    apiJson(`/api/report/widget/${reportId}/data`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [reportId, refreshTrigger, config]);

  // ── Derived values (computed before early returns to keep hook order stable) ──
  const effectiveType = data
    ? ((data.diagramType as string) || (data as any).config?.diagramType || '').toLowerCase()
    : '';
  const type = effectiveType;

  const labelCount = data?.labels?.length || 0;
  const datasetCount = data?.datasets?.length || 0;
  const safeLabels = data?.labels || [];
  const cfgShowLegend = (data as any)?.config?.showLegend ?? true;
  const cfgShowLabels = (data as any)?.config?.showLabels ?? false;

  // ── Responsive options hook (must be called unconditionally) ──
  const { options, chartHeight, isMobile, isTablet, dataLabelsPlugin } = useChartOptions({
    type,
    labelCount,
    datasetCount,
    safeLabels,
    cfgShowLegend,
    cfgShowLabels,
  });

  // ── Early returns (AFTER all hooks) ──
  if (!reportId && !config) {
    return <Typography color="text.secondary">Kein Report ausgewählt.</Typography>;
  }
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  const isFaceted =
    data?.diagramType === 'faceted' &&
    Array.isArray((data as any)?.panels) &&
    (data as any).panels.length > 0;
  if (!data || (!isFaceted && (!data.labels || !data.datasets || !data.datasets.length))) {
    return <Typography color="text.secondary">Keine Daten für diesen Report.</Typography>;
  }

  // ── Build chart data ──
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((ds, i) => {
      const isPie = ['pie', 'doughnut', 'polararea'].includes(effectiveType);
      const isArea = effectiveType === 'area';

      const computedBackground =
        ds.backgroundColor ||
        (isPie
          ? data.labels.map((_, idx) => defaultColors[idx % defaultColors.length])
          : isArea
            ? rgbaColors[i % rgbaColors.length]
            : defaultColors[i % defaultColors.length]);
      const computedBorder =
        ds.borderColor ||
        (isPie
          ? data.labels.map((_, idx) => defaultColors[idx % defaultColors.length])
          : defaultColors[i % defaultColors.length]);

      const enforcedProps: any = {};
      if (isArea) {
        enforcedProps.fill = ds.fill === false ? false : true;
        enforcedProps.tension = ds.tension ?? 0.3;
        if (!ds.backgroundColor) {
          enforcedProps.backgroundColor = computedBackground;
        }
      }

      return {
        ...ds,
        backgroundColor: ds.backgroundColor || computedBackground,
        borderColor: ds.borderColor || computedBorder,
        borderWidth: ds.borderWidth ?? 2,
        ...enforcedProps,
      };
    }),
  };

  // ── Moving average overlay (for simple chart types) ──
  let finalChartData = chartData;
  try {
    const maCfgGlobal = (data as any).config?.movingAverage;
    const diagGlobal = type;
    if (
      maCfgGlobal &&
      maCfgGlobal.enabled &&
      Number.isInteger(maCfgGlobal.window) &&
      maCfgGlobal.window > 1
    ) {
      if (['line', 'area', 'bar'].includes(diagGlobal)) {
        const ma = applyMovingAverage(chartData.datasets || [], maCfgGlobal.window);
        if (Array.isArray(ma) && ma.length > 0) {
          finalChartData = { ...chartData, datasets: [...chartData.datasets, ...ma] };
        }
      }
    }
  } catch {
    // don't block rendering on MA computation errors
  }

  // ── Faceted rendering ──
  if (type === 'faceted' && Array.isArray((data as any).panels)) {
    const panels: FacetedPanel[] = (data as any).panels;
    const facetSubType: string =
      (data as any).facetSubType || (data as any).meta?.facetSubType || 'bar';
    const facetLayout: string =
      (data as any).facetLayout || (data as any).meta?.facetLayout || 'grid';

    return (
      <FacetedChart
        panels={panels}
        facetSubType={facetSubType}
        facetLayout={facetLayout}
        isMobile={isMobile}
        isTablet={isTablet}
        activePanelIdx={activePanelIdx}
        onActivePanelChange={setActivePanelIdx}
      />
    );
  }

  // ── Standard chart rendering ──
  return (
    <Box
      sx={{
        width: '100%',
        height: chartHeight,
        minHeight: isMobile ? 280 : 220,
        position: 'relative',
      }}
    >
      <ChartRenderer
        type={type}
        data={data}
        chartData={finalChartData}
        options={options}
        dataLabelsPlugin={dataLabelsPlugin}
        isMobile={isMobile}
        isTablet={isTablet}
      />
    </Box>
  );
};
