import React, { useEffect, useState } from 'react';
import { Button, TextField, Checkbox, FormControlLabel, CircularProgress, Autocomplete, Box, Typography } from '@mui/material';
import { apiJson } from '../utils/api';
import BaseModal from './BaseModal';

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  context?: string;
}

interface Task {
  id?: number;
  title: string;
  description?: string;
  isRecurring: boolean;
  recurrenceMode?: string;
  recurrenceRule?: string;
  rotationUsers?: User[];
  rotationCount?: number;
  assignments?: Assignment[];
}

interface Assignment {
  id?: number;
  user: User;
  assignedDate: string;
  status: string;
}

interface TaskEditModalProps {
  open: boolean;
  onClose: (changed: boolean) => void;
  task: Task | null;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({ open, onClose, task }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring || false);
  const [recurrenceMode, setRecurrenceMode] = useState<string>(task?.recurrenceMode || 'classic');
  const [freq, setFreq] = useState<string>('WEEKLY');
  const [interval, setInterval] = useState<number>(1);
  const [byDay, setByDay] = useState<string>('MO');
  const [byMonthDay, setByMonthDay] = useState<number>(1);
  const [recurrenceRule, setRecurrenceRule] = useState<string>(task?.recurrenceRule || '');
  const [users, setUsers] = useState<User[]>([]);
  const [userLoadError, setUserLoadError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>(task?.assignments || []);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [assignedDate, setAssignedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [rotationUsers, setRotationUsers] = useState<User[]>([]);
  const [rotationCount, setRotationCount] = useState<number>(1);

  useEffect(() => {
    apiJson<{ users: User[] }>('/api/users/contacts')
      .then(data => {
        if (Array.isArray(data.users)) {
          setUsers(data.users);
          setUserLoadError(null);
        } else {
          setUsers([]);
          setUserLoadError('Benutzerliste konnte nicht geladen werden.');
        }
      })
      .catch(() => {
        setUsers([]);
        setUserLoadError('Fehler beim Laden der Benutzerliste!');
      });
  }, []);

  useEffect(() => {
    setTitle(task?.title || '');
    setDescription(task?.description || '');
    setIsRecurring(task?.isRecurring || false);
    setRecurrenceMode(task?.recurrenceMode || 'classic');
    setRecurrenceRule(task?.recurrenceRule || '');
    setRotationUsers(task?.rotationUsers || []);
    setRotationCount(task?.rotationCount || 1);
    // Falls ein bestehender Task geladen wird, Recurrence-Rule parsen
    if (task?.recurrenceRule) {
      try {
        const rule = JSON.parse(task.recurrenceRule);
        setFreq(rule.freq || 'WEEKLY');
        setInterval(rule.interval || 1);
        setByDay(rule.byday ? rule.byday[0] : 'MO');
        setByMonthDay(rule.bymonthday || 1);
      } catch {}
    }
    setAssignments(task?.assignments || []);
  }, [task]);

  const handleSave = async () => {
    setLoading(true);
  // Recurrence-Rule als JSON generieren
  let ruleString = '';
  if (isRecurring && recurrenceMode === 'classic') {
    const rule: any = { freq, interval };
    if (freq === 'WEEKLY') rule.byday = [byDay];
    if (freq === 'MONTHLY') rule.bymonthday = byMonthDay;
    ruleString = JSON.stringify(rule);
  }
  if (isRecurring && recurrenceMode === 'per_match') {
    ruleString = '';
  }
  const payload = { title, description, isRecurring, recurrenceMode, recurrenceRule: ruleString, rotationUsers: rotationUsers.map(u => u.id), rotationCount };
    try {
      if (task && task.id) {
        await apiJson(`/api/tasks/${task.id}`, { method: 'PUT', body: payload });
      } else {
        await apiJson('/api/tasks', { method: 'POST', body: payload });
      }
      onClose(true);
    } catch (e) {
      // Fehlerbehandlung
    }
    setLoading(false);
  };

  const handleAddAssignment = async () => {
    if (!task || !selectedUser || !assignedDate) return;
    setLoading(true);
    try {
      await apiJson(`/api/tasks/${task.id}/assignments`, {
        method: 'POST',
        body: {
          userId: selectedUser.id,
          assignedDate,
          status: 'offen',
        },
      });
      // assignments neu laden
      // ...
      onClose(true);
    } catch (e) {}
    setLoading(false);
  };

  return (
    <BaseModal
      open={open}
      onClose={() => onClose(false)}
      maxWidth="sm"
      title={`Aufgabe ${task ? 'bearbeiten' : 'anlegen'}`}
      actions={
        <>
          <Button onClick={() => onClose(false)} variant="outlined" color="secondary" disabled={loading}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Speichern'}
          </Button>
        </>
      }
    >
      <TextField
        label="Titel"
        value={title}
        onChange={e => setTitle(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
          label="Beschreibung"
          value={description}
          onChange={e => setDescription(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Autocomplete
          multiple
          options={users}
          getOptionLabel={u => {
            const name = u.fullName
              ? u.fullName
              : u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName || u.lastName || `User #${u.id}`;
            return u.context ? `${name} (${u.context})` : name;
          }}
          value={rotationUsers}
          onChange={(_, val) => setRotationUsers(val)}
          renderOption={(props, option) => (
            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box>
                <Typography variant="body2">
                  {option.fullName || `${option.firstName} ${option.lastName}`}
                </Typography>
                {option.context && (
                  <Typography variant="caption" color="text.secondary">{option.context}</Typography>
                )}
              </Box>
            </Box>
          )}
          renderInput={params => <TextField {...params} label="Benutzer-Rotation" margin="normal" />}
          sx={{ mt: 2, mb: 2 }}
        />
        {userLoadError && (
          <div style={{ color: 'red', margin: '8px 0 16px 0' }}>{userLoadError}</div>
        )}
        {users.length === 0 && !userLoadError && (
          <div style={{ color: 'orange', margin: '8px 0 16px 0' }}>Keine Benutzer zur Auswahl vorhanden.</div>
        )}
        <TextField
          label="Personen pro Aufgabe gleichzeitig"
          type="number"
          value={rotationCount}
          onChange={e => setRotationCount(Number(e.target.value))}
          fullWidth
          margin="normal"
          inputProps={{ min: 1, max: rotationUsers.length || 99 }}
        />
        <FormControlLabel
          control={<Checkbox checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} />}
          label="Wiederkehrend"
        />
        {isRecurring && (
          <>
            <TextField
              select
              label="Wiederkehr-Modus"
              value={recurrenceMode}
              onChange={e => setRecurrenceMode(e.target.value)}
              fullWidth
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value="classic">Regelmäßig (z.B. wöchentlich)</option>
              <option value="per_match">Pro Spiel (laut Spielplan)</option>
            </TextField>
            {recurrenceMode === 'classic' && (
              <>
                <TextField
                  select
                  label="Frequenz"
                  value={freq}
                  onChange={e => setFreq(e.target.value)}
                  fullWidth
                  margin="normal"
                  SelectProps={{ native: true }}
                >
                  <option value="DAILY">Täglich</option>
                  <option value="WEEKLY">Wöchentlich</option>
                  <option value="MONTHLY">Monatlich</option>
                </TextField>
                <TextField
                  label="Intervall (z.B. alle 2 Wochen)"
                  type="number"
                  value={interval}
                  onChange={e => setInterval(Number(e.target.value))}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 1 }}
                />
                {(freq === 'WEEKLY' || (freq === 'DAILY' && interval > 7)) && (
                  <TextField
                    select
                    label="Wochentag"
                    value={byDay}
                    onChange={e => setByDay(e.target.value)}
                    fullWidth
                    margin="normal"
                    SelectProps={{ native: true }}
                  >
                    <option value="MO">Montag</option>
                    <option value="TU">Dienstag</option>
                    <option value="WE">Mittwoch</option>
                    <option value="TH">Donnerstag</option>
                    <option value="FR">Freitag</option>
                    <option value="SA">Samstag</option>
                    <option value="SU">Sonntag</option>
                  </TextField>
                )}
                {freq === 'MONTHLY' && (
                  <TextField
                    label="Tag des Monats"
                    type="number"
                    value={byMonthDay}
                    onChange={e => setByMonthDay(Number(e.target.value))}
                    fullWidth
                    margin="normal"
                    inputProps={{ min: 1, max: 31 }}
                  />
                )}
              </>
            )}
            {recurrenceMode === 'per_match' && (
              <>
                <p>Die Aufgabe wird automatisch jedem Spiel zugeordnet.</p>
              </>
            )}
          </>
        )}
    </BaseModal>
  );
};

export default TaskEditModal;
