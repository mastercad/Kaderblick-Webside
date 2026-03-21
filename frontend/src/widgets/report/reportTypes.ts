/**
 * Shared type definitions for the Report widget system.
 */

export interface FacetedPanel {
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    [key: string]: any;
  }>;
}

export interface ReportData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
    [key: string]: any;
  }>;
  diagramType: string;
  panels?: FacetedPanel[];
  config?: Record<string, any>;
  facetSubType?: string;
  facetLayout?: string;
  meta?: Record<string, any>;
}
