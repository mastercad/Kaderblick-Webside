import React from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Collapse,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import { ReportWidget } from '../../widgets/ReportWidget';
import { WidgetRefreshProvider } from '../../context/WidgetRefreshContext';
import type { ReportBuilderState } from './types';

interface PreviewPanelProps {
  state: ReportBuilderState;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ state }) => {
  const {
    previewData,
    isLoading,
    hasPreview,
    isSuperAdmin,
    showAdvancedMeta,
    setShowAdvancedMeta,
    computePreviewWarnings,
  } = state;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={250} width="100%">
        <Typography color="text.secondary">Lade Vorschau...</Typography>
      </Box>
    );
  }

  if (!hasPreview) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight={250}
        textAlign="center"
        sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 2, width: '100%' }}
      >
        <BarChartIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Noch keine Vorschau
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Wähle X- und Y-Achse im Schritt &quot;Daten &amp; Chart&quot;
        </Typography>
      </Box>
    );
  }

  if (previewData) {
    const warnings = computePreviewWarnings();
    return (
      <Box sx={{ width: '100%' }}>
        {/* Preview meta warnings */}
        {previewData.meta && (
          <Box sx={{ mb: 1 }}>
            {previewData.meta.userMessage && (
              <Alert severity={previewData.meta.eventsCount === 0 ? 'warning' : 'info'} sx={{ mb: 1 }}>
                {previewData.meta.userMessage}
              </Alert>
            )}
            {isSuperAdmin && (
              <Box sx={{ mt: 0.5 }}>
                <Button size="small" onClick={() => setShowAdvancedMeta(s => !s)}>
                  {showAdvancedMeta ? 'Erweiterte Details verbergen' : 'Erweiterte Details'}
                </Button>
                <Collapse in={showAdvancedMeta}>
                  <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {previewData.meta.dbAggregate === true && (
                      <Alert severity="info" variant="outlined">DB-Aggregate aktiv.</Alert>
                    )}
                    {Array.isArray(previewData.meta.warnings) &&
                      previewData.meta.warnings.map((w: string, idx: number) => (
                        <Alert key={`warn-${idx}`} severity="warning" variant="outlined">{w}</Alert>
                      ))}
                    {Array.isArray(previewData.meta.suggestions) &&
                      previewData.meta.suggestions.map((s: string, idx: number) => (
                        <Alert key={`sug-${idx}`} severity="info" variant="outlined">{s}</Alert>
                      ))}
                    {warnings.movingAverageWindowTooLarge && (
                      <Alert severity="warning" variant="outlined">
                        Gleitschnitt-Fenster größer als Datenpunkte
                      </Alert>
                    )}
                    {warnings.boxplotFormatInvalid && (
                      <Alert severity="warning" variant="outlined">
                        Boxplot erwartet pro Label Arrays
                      </Alert>
                    )}
                    {warnings.scatterNonNumeric && (
                      <Alert severity="warning" variant="outlined">
                        Scatter enthält nicht-numerische Werte
                      </Alert>
                    )}
                  </Box>
                </Collapse>
              </Box>
            )}
          </Box>
        )}
        <WidgetRefreshProvider>
          <ReportWidget config={previewData} />
        </WidgetRefreshProvider>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={250} width="100%">
      <Typography color="text.secondary">Preview wird geladen...</Typography>
    </Box>
  );
};
