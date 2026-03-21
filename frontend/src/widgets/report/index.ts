/**
 * Barrel export for the report sub-module.
 */
export { ReportWidget } from '../ReportWidget';
export type { FacetedPanel, ReportData } from './reportTypes';
export { defaultColors, rgbaColors, truncateLabel, heatColor, generateHeatmapCanvas, applyMovingAverage } from './chartHelpers';
export { useChartOptions } from './useChartOptions';
export { FacetedChart } from './FacetedChart';
export { ChartRenderer } from './ChartRenderer';
