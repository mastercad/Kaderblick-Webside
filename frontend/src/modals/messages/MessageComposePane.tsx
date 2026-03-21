import React from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { ComposeForm, MessageGroup, User } from './types';
import { senderInitials, avatarColor } from './helpers';

interface Props {
  users:             User[];
  groups:            MessageGroup[];
  form:              ComposeForm;
  onChange:          (form: ComposeForm) => void;
  isMobile:          boolean;
  loading:           boolean;
  contactsLoading:   boolean;
  recipientsLocked?: boolean;
  error:             string | null;
  success:           boolean;
  onSend:            () => void;
  onDiscard:         () => void;
}

export const MessageComposePane: React.FC<Props> = ({
  users, groups, form, onChange, isMobile, loading, contactsLoading, recipientsLocked, error, success, onSend, onDiscard,
}) => {
  const set = (partial: Partial<ComposeForm>) => onChange({ ...form, ...partial });

  // Im Antwort-Modus (recipientsLocked) sind Empfänger bereits fest – Formular bleibt nutzbar
  const noContacts = !recipientsLocked && !contactsLoading && users.length === 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, minWidth: 0, width: '100%', overflow: 'hidden' }}>

      {/* Toolbar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 1.25, flexShrink: 0,
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile && (
            <IconButton size="small" onClick={onDiscard}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="subtitle1" fontWeight={700}>Neue Nachricht</Typography>
        </Box>
        {!isMobile && (
          <IconButton size="small" onClick={onDiscard}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Form */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pt: 2, pb: 1 }}>
        <Stack spacing={2}>

          {success && (
            <Alert severity="success">Nachricht wurde erfolgreich gesendet!</Alert>
          )}

          {noContacts && (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon fontSize="inherit" />}
            >
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Kein Zugriff auf die interne Kommunikation
              </Typography>
              <Typography variant="caption">
                Dein Konto ist weder mit einem Spieler noch mit einem Trainer
                verknüpft. Bitte wende dich an einen Administrator, damit du
                einem Team oder Verein zugewiesen wirst.
              </Typography>
            </Alert>
          )}

          {/* Recipients */}
          {recipientsLocked ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <LockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                <InputLabel shrink sx={{ position: 'static', transform: 'none', fontSize: '0.78rem' }}>
                  Empfänger
                </InputLabel>
              </Box>
              <Box sx={{
                display: 'flex', flexWrap: 'wrap', gap: 0.75,
                border: '1px solid', borderColor: 'divider',
                borderRadius: 1, px: 1.5, py: 1, bgcolor: 'action.disabledBackground',
              }}>
                {form.recipients.map(r => (
                  <Chip
                    key={r.id}
                    size="small"
                    avatar={
                      <Avatar sx={{ bgcolor: avatarColor(r.fullName), fontSize: 10 }}>
                        {senderInitials(r.fullName)}
                      </Avatar>
                    }
                    label={r.context ? `${r.fullName} (${r.context})` : r.fullName}
                  />
                ))}
                {form.recipients.length === 0 && (
                  <Typography variant="caption" color="text.disabled">Keine Empfänger</Typography>
                )}
              </Box>
            </Box>
          ) : (
          <Autocomplete
            multiple
            disabled={noContacts}
            options={users}
            getOptionLabel={o => o.context ? `${o.fullName} (${o.context})` : o.fullName}
            value={form.recipients}
            onChange={(_, v) => set({ recipients: v })}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: avatarColor(option.fullName) }}>
                  {senderInitials(option.fullName)}
                </Avatar>
                <Box>
                  <Typography variant="body2">{option.fullName}</Typography>
                  {option.context && (
                    <Typography variant="caption" color="text.secondary">{option.context}</Typography>
                  )}
                </Box>
              </Box>
            )}
            renderInput={params => (
              <TextField
                {...params} label="Empfänger" size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.disabled' }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  sx: { flexWrap: 'wrap' },
                }}
              />
            )}
          />
          )}

          {/* Optional: group */}
          {groups.length > 0 && (
            <TextField
              label="Oder Gruppe" select size="small" fullWidth
              value={form.groupId}
              onChange={e => set({ groupId: e.target.value })}
            >
              <MenuItem value="">Keine Gruppe</MenuItem>
              {groups.map(g => (
                <MenuItem key={g.id} value={g.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon fontSize="small" />
                    {g.name} ({g.memberCount} Mitglieder)
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            label="Betreff" size="small" fullWidth required
            disabled={noContacts}
            value={form.subject}
            onChange={e => set({ subject: e.target.value })}
          />

          <TextField
            label="Nachricht" multiline rows={isMobile ? 6 : 8} fullWidth required
            disabled={noContacts}
            value={form.content}
            onChange={e => set({ content: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.9rem' } }}
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Box>

      {/* Footer */}
      <Box sx={{
        px: 2, py: 1.5, flexShrink: 0,
        borderTop: '1px solid', borderColor: 'divider',
        display: 'flex', justifyContent: 'flex-end', gap: 1,
      }}>
        <Button variant="outlined" onClick={onDiscard}>Verwerfen</Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          onClick={onSend}
          disabled={loading || noContacts}
        >
          {loading ? 'Sende…' : 'Senden'}
        </Button>
      </Box>
    </Box>
  );
};
