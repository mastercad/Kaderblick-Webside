import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

interface EventModalActionsProps {
  currentStep: number;
  isLastStep: boolean;
  loading: boolean;
  showDelete: boolean;
  onDelete?: () => void;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
}

/**
 * Footer action bar for the EventModal wizard.
 * Left side: Cancel + optional Delete.
 * Right side: Back + Next/Save.
 */
export const EventModalActions: React.FC<EventModalActionsProps> = ({
  currentStep,
  isLastStep,
  loading,
  showDelete,
  onDelete,
  onClose,
  onBack,
  onNext,
  onSave,
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      flexWrap: 'wrap',
      gap: 1,
    }}
  >
    {/* Left: Cancel + Delete */}
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        onClick={onClose}
        color="secondary"
        variant="outlined"
        disabled={loading}
        size="small"
      >
        Abbrechen
      </Button>
      {showDelete && onDelete && (
        <Button
          onClick={onDelete}
          color="error"
          variant="outlined"
          disabled={loading}
          size="small"
          startIcon={<DeleteOutlineIcon />}
        >
          Löschen
        </Button>
      )}
    </Box>

    {/* Right: Back + Next / Save */}
    <Box sx={{ display: 'flex', gap: 1 }}>
      {currentStep > 0 && (
        <Button
          onClick={onBack}
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          disabled={loading}
          size="small"
        >
          Zurück
        </Button>
      )}
      {!isLastStep ? (
        <Button
          onClick={onNext}
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          size="small"
        >
          Weiter
        </Button>
      ) : (
        <Button
          onClick={onSave}
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={loading}
          size="small"
        >
          {loading ? 'Wird gespeichert …' : 'Speichern'}
        </Button>
      )}
    </Box>
  </Box>
);
