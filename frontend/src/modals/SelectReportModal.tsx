import React from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import BaseModal from './BaseModal';

interface SelectReportModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
  loading?: boolean;
  children?: React.ReactNode; // For report list
}

export const SelectReportModal: React.FC<SelectReportModalProps> = ({
  open,
  onClose,
  onAdd,
  loading = false,
  children,
}) => (
  <BaseModal
    open={open}
    onClose={onClose}
    maxWidth="lg"
    title="Auswertung auswählen"
    actions={
      <>
        <Button onClick={onClose} variant="outlined" color="secondary">Abbrechen</Button>
        <Button onClick={onAdd} variant="contained" color="primary">Hinzufügen</Button>
      </>
    }
  >
    {loading ? (
      <div style={{ textAlign: 'center', margin: '2em 0' }}>
        <CircularProgress />
      </div>
    ) : (
      <div id="reportListContainer">
        {children}
      </div>
    )}
  </BaseModal>
);
