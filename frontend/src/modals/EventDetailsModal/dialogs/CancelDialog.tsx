import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CancelIcon from '@mui/icons-material/EventBusy';

interface CancelDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reason: string;
  onReasonChange: (value: string) => void;
  cancelling: boolean;
}

export const CancelDialog: React.FC<CancelDialogProps> = ({
  open,
  onClose,
  onConfirm,
  reason,
  onReasonChange,
  cancelling,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CancelIcon color="warning" />
      Event absagen
    </DialogTitle>
    <DialogContent>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Alle Teilnehmer und Fahrer/Mitfahrer werden per Push-Benachrichtigung informiert.
      </Typography>
      <TextField
        label="Grund der Absage *"
        value={reason}
        onChange={e => onReasonChange(e.target.value)}
        fullWidth
        multiline
        minRows={2}
        maxRows={5}
        autoFocus
        placeholder="z.B. Schlechtes Wetter, Platz gesperrt, …"
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} disabled={cancelling} sx={{ borderRadius: 2 }}>
        Abbrechen
      </Button>
      <Button
        onClick={onConfirm}
        color="warning"
        variant="contained"
        disabled={cancelling || !reason.trim()}
        startIcon={<CancelIcon />}
        sx={{ borderRadius: 2 }}
      >
        {cancelling ? 'Wird abgesagt…' : 'Absagen'}
      </Button>
    </DialogActions>
  </Dialog>
);
