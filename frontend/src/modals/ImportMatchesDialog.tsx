import React, { useState } from 'react';
import { apiRequest } from '../utils/api';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Input from '@mui/material/Input';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentId?: string;
  // initial matches to show in editor
  initialMatches?: any[];
  // when tournamentId is present, onImported is a notification; when not present, it may receive parsed payload
  onImported?: (payload?: any[]) => void;
}

function detectFormat(text: string) {
  const t = text.trim();
  if (!t) return 'empty';
  if (t.startsWith('{') || t.startsWith('[')) return 'json';
  // naive CSV detect: if first line contains ; or ,
  const firstLine = t.split(/\r?\n/)[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  if (semiCount > commaCount) return 'csv;';
  return 'csv,';
}

function splitCSVLine(line: string, delimiter: string) {
  const re = new RegExp(`${delimiter}(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)`);
  // fallback simple split if regex fails
  return line.split(re).map(s => s.replace(/^\"|\"$/g, '').trim());
}

function parseCSV(text: string) {
  const delimType = detectFormat(text);
  const delimiter = delimType === 'csv;' ? ';' : ',';
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCSVLine(lines[0], delimiter);
  const rows = lines.slice(1).map(line => {
    const values = splitCSVLine(line, delimiter);
    const obj: any = {};
    headers.forEach((h, idx) => { obj[h] = values[idx] !== undefined ? values[idx] : ''; });
    return obj;
  });
  return { headers, rows };
}

export default function ImportMatchesDialog({ open, onClose, tournamentId, onImported }: Props) {
  const [text, setText] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({ home: '', away: '', round: '', slot: '', scheduledAt: '' });
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f?: File) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result || '');
      setText(txt);
      parseText(txt);
    };
    reader.readAsText(f);
  };

  const parseText = (txt: string) => {
    setError(null);
    const fmt = detectFormat(txt);
    try {
      if (fmt === 'json') {
        const parsed = JSON.parse(txt);
        // expect array of objects or object with matches
        const arr = Array.isArray(parsed) ? parsed : (parsed.matches || []);
        if (!Array.isArray(arr)) throw new Error('JSON enthält kein Array von Matches');
        const inferredHeaders = Array.from(new Set(arr.flatMap((r:any) => Object.keys(r))));
        setHeaders(inferredHeaders);
        setRows(arr);
      } else if (fmt.startsWith('csv')) {
        const parsed = parseCSV(txt);
        setHeaders(parsed.headers);
        setRows(parsed.rows);
      } else {
        setHeaders([]);
        setRows([]);
      }
    } catch (e:any) {
      setError(e.message || 'Fehler beim Parsen');
      setHeaders([]);
      setRows([]);
    }
  };

  const generateMatchesPayload = () => {
    // require home and away mapping
    if (!mapping.home || !mapping.away) {
      setError('Bitte Spalten für Heim- und Auswärts-Team zuordnen');
      return null;
    }
    const out = rows.map(r => {
      const home = r[mapping.home] || r['home'] || r['homeTeam'] || r['homeTeamId'] || '';
      const away = r[mapping.away] || r['away'] || r['awayTeam'] || r['awayTeamId'] || '';
      const round = mapping.round ? (r[mapping.round] || '') : '';
      const slot = mapping.slot ? (r[mapping.slot] || '') : '';
      const scheduledAt = mapping.scheduledAt ? (r[mapping.scheduledAt] || '') : '';
      const obj: any = { homeTeamId: String(home), awayTeamId: String(away) };
      if (round) obj.round = round;
      if (slot) obj.slot = slot;
      if (scheduledAt) obj.scheduledAt = scheduledAt;
      return obj;
    });
    return out;
  };

  const submit = async () => {
    setError(null);
    const matches = generateMatchesPayload();
    if (!matches) return;
    // If no tournament selected, return payload to caller (draft mode)
    if (!tournamentId) {
      if (onImported) onImported(matches);
      onClose();
      return;
    }
    try {
      const res = await apiRequest(`/api/tournaments/${tournamentId}/generate-plan`, {
        method: 'POST',
        body: { matches, createGames: false },
      });
      if (!res.ok) {
        const txt = await res.text();
        setError(`Server-Fehler: ${res.status} ${txt}`);
        return;
      }
      if (onImported) onImported();
      onClose();
    } catch (e:any) {
      setError(e.message || 'Netzwerkfehler');
    }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    parseText(val);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Begegnungen importieren (CSV / JSON)</DialogTitle>
      <DialogContent>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Input type="file" inputProps={{ accept: '.csv,.json,text/csv,application/json' }} onChange={e => handleFile((e.target as HTMLInputElement).files?.[0])} />
            <div style={{ marginTop: 8 }}>
              <TextField
                label="Daten einfügen (oder URL/JSON/CSV)"
                value={text}
                onChange={e => handleTextChange(e.target.value)}
                fullWidth
                multiline
                minRows={6}
              />
            </div>
          </div>
          <div style={{ width: 380 }}>
            <div style={{ marginBottom: 8 }}>Spalten zuordnen (erforderlich: Heim / Auswärts)</div>
            <FormControl fullWidth margin="normal">
              <InputLabel id="map-home-label">Heim-Team</InputLabel>
              <Select labelId="map-home-label" value={mapping.home} label="Heim-Team" onChange={e => setMapping({ ...mapping, home: e.target.value as string })}>
                <MenuItem value=""><em>-- wählen --</em></MenuItem>
                {headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="map-away-label">Auswärts-Team</InputLabel>
              <Select labelId="map-away-label" value={mapping.away} label="Auswärts-Team" onChange={e => setMapping({ ...mapping, away: e.target.value as string })}>
                <MenuItem value=""><em>-- wählen --</em></MenuItem>
                {headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="map-round-label">Runde (optional)</InputLabel>
              <Select labelId="map-round-label" value={mapping.round} label="Runde" onChange={e => setMapping({ ...mapping, round: e.target.value as string })}>
                <MenuItem value=""><em>-- keine --</em></MenuItem>
                {headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="map-slot-label">Slot (optional)</InputLabel>
              <Select labelId="map-slot-label" value={mapping.slot} label="Slot" onChange={e => setMapping({ ...mapping, slot: e.target.value as string })}>
                <MenuItem value=""><em>-- keine --</em></MenuItem>
                {headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="map-scheduled-label">Datum/Zeit (optional)</InputLabel>
              <Select labelId="map-scheduled-label" value={mapping.scheduledAt} label="Datum/Zeit" onChange={e => setMapping({ ...mapping, scheduledAt: e.target.value as string })}>
                <MenuItem value=""><em>-- keine --</em></MenuItem>
                {headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </Select>
            </FormControl>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <strong>Vorschau:</strong>
          <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #eee', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {headers.map(h => <th key={h} style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 6 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 30).map((r, idx) => (
                  <tr key={idx}>
                    {headers.map(h => <td key={h} style={{ padding: 6, borderBottom: '1px solid #f6f6f6' }}>{String(r[h] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button onClick={submit} variant="contained" color="primary" disabled={!rows.length}>Importieren</Button>
      </DialogActions>
    </Dialog>
  );
}
