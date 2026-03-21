import React from 'react';
import { Alert, Button } from '@mui/material';
import BaseModal from '../BaseModal';
import type { ReportBuilderModalProps } from './types';
import { useReportBuilder } from './useReportBuilder';
import { MobileWizard } from './MobileWizard';
import { DesktopLayout } from './DesktopLayout';
import { HelpDialog } from './HelpDialog';

export { type Report } from './types';

export const ReportBuilderModal: React.FC<ReportBuilderModalProps> = ({
  open,
  onClose,
  onSave,
  report,
}) => {
  const state = useReportBuilder(open, report, onSave, onClose);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullScreen={state.fullScreen}
      title={report ? 'Report bearbeiten' : 'Neuer Report'}
      actions={
        state.isMobile ? undefined : (
          <>
            <Button onClick={onClose} variant="outlined" color="secondary">
              Abbrechen
            </Button>
            <Button
              onClick={state.handleSave}
              variant="contained"
              color="primary"
              disabled={!state.canSave}
            >
              Speichern
            </Button>
          </>
        )
      }
    >
      {state.currentReport.isTemplate && !state.isAdmin && (
        <Alert severity="info" sx={{ mb: 2, flexShrink: 0 }}>
          Du bearbeitest eine Vorlage. Deine Änderungen werden als persönliche Kopie für dich gespeichert — die Vorlage selbst bleibt unverändert.
        </Alert>
      )}
      {state.isMobile ? <MobileWizard state={state} /> : <DesktopLayout state={state} />}

      <HelpDialog open={state.helpOpen} onClose={() => state.setHelpOpen(false)} />
    </BaseModal>
  );
};
