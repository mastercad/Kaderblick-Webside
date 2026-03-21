import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ReplyIcon from '@mui/icons-material/Reply';
import ReplyAllIcon from '@mui/icons-material/ReplyAll';
import SendIcon from '@mui/icons-material/Send';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { Message } from './types';
import { senderInitials, avatarColor } from './helpers';

interface Props {
  message:     Message | null;
  loading:     boolean;
  isMobile:    boolean;
  isOutbox:    boolean;
  /** Darf der aktuelle User antworten (hat Kontakte ODER Absender ist Superadmin) */
  canReply:    boolean;
  onBack:      () => void;
  onReply:     () => void;
  onReplyAll:  () => void;
  onResend:    () => void;
  onForward:   (prefill: { subject: string; content: string }) => void;
  onDelete:    () => void;
}

export const MessageDetailPane: React.FC<Props> = ({
  message, loading, isMobile, isOutbox, canReply, onBack, onReply, onReplyAll, onResend, onForward, onDelete,
}) => {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* Mobile back button */}
      {isMobile && (
        <Box sx={{ px: 1.5, py: 1, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Button startIcon={<ArrowBackIcon />} size="small" onClick={onBack}>
            Zurück
          </Button>
        </Box>
      )}

      {/* Empty state */}
      {!message ? (
        <Box sx={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100%', color: 'text.disabled',
        }}>
          <MailOutlineIcon sx={{ fontSize: 56, mb: 1.5 }} />
          <Typography variant="body2">Nachricht auswählen</Typography>
        </Box>

      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>

      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <Box sx={{
            px: 2.5, py: 2, flexShrink: 0,
            background: isDark
              ? alpha(theme.palette.primary.dark, 0.2)
              : alpha(theme.palette.primary.main, 0.05),
            borderBottom: '1px solid', borderColor: 'divider',
          }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              {message.subject}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} alignItems={{ sm: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: avatarColor(message.sender) }}>
                  {senderInitials(message.sender)}
                </Avatar>
                <Typography variant="body2" fontWeight={600}>{message.sender}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {new Date(message.sentAt).toLocaleString('de-DE', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Typography>
            </Stack>
            {message.recipients && message.recipients.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                An: {message.recipients.map(r => r.name).join(', ')}
              </Typography>
            )}
          </Box>

          {/* Body */}
          <Box sx={{ px: 2.5, py: 2.5, flex: 1 }}>
            <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {message.content}
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{
            px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider',
            display: 'flex', gap: 1, flexWrap: 'wrap', flexShrink: 0,
            justifyContent: 'space-between', alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {isOutbox ? (
                /* Gesendet: Nachrichten wurden von mir versendet → erneut senden sinnvoll */
                <Button variant="contained" size="small" startIcon={<SendIcon />} onClick={onResend}>
                  Erneut senden
                </Button>
              ) : (
                /* Posteingang: Antwort-Optionen – nur wenn User antworten darf */
                <>
                  {canReply && (
                    <Button variant="contained" size="small" startIcon={<ReplyIcon />} onClick={onReply}>
                      Antworten
                    </Button>
                  )}
                  {canReply && message.recipients && message.recipients.length > 1 && (
                    <Button variant="outlined" size="small" startIcon={<ReplyAllIcon />} onClick={onReplyAll}>
                      Allen antworten
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="outlined" size="small" startIcon={<ForwardToInboxIcon />}
                onClick={() => onForward({ subject: `Fw: ${message.subject}`, content: message.content || '' })}
              >
                Weiterleiten
              </Button>
            </Box>

            {/* Löschen – rechts ausgerichtet */}
            <Button
              variant="outlined" size="small" color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => setConfirmOpen(true)}
            >
              Löschen
            </Button>
          </Box>
        </Box>
      )}

      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nachricht löschen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Die Nachricht <strong>„{message?.subject}"</strong> wird unwiderruflich gelöscht.
            Dieser Vorgang kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Abbrechen</Button>
          <Button
            color="error" variant="contained"
            onClick={() => { setConfirmOpen(false); onDelete(); }}
          >
            Endgültig löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
