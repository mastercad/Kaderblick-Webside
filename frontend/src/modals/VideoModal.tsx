import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  MenuItem,
  Box
} from '@mui/material';
import { Video, VideoType, Camera } from '../services/videos';
import BaseModal from './BaseModal';

interface VideoDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  videoTypes: VideoType[];
  cameras: Camera[];
  initialData?: Partial<Video>;
  loading?: boolean;
}

export default function VideoModal({ open, onClose, onSave, videoTypes, cameras, initialData = {}, loading }: VideoDialogProps) {
  const [form, setForm] = useState({
    video_id: initialData.id || '',
    name: initialData.name || '',
    url: initialData.url || '',
    filePath: initialData.filePath || '',
    gameStart: initialData.gameStart || '',
    sort: initialData.sort || '',
    videoType: initialData.videoType?.id ? initialData.videoType.id : '',
    camera: initialData.camera?.id ? initialData.camera.id : '',
    length: initialData.length || ''
  });

  useEffect(() => {
    setForm({
      video_id: initialData.id || '',
      name: initialData.name || '',
      url: initialData.url || '',
      filePath: initialData.filePath || '',
      gameStart: initialData.gameStart || '',
      sort: initialData.sort || '',
      videoType: initialData.videoType?.id ? initialData.videoType.id : '',
      camera: initialData.camera?.id ? initialData.camera.id : '',
      length: initialData.length || ''
    });
  }, [open, initialData?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Länge in Sekunden konvertieren (verschiedene Formate unterstützen)
    let newForm = { ...form };

    // Startzeit konvertieren (gleiche Formate wie Länge)
    if (form.gameStart) {
      const input = form.gameStart.toString().trim();
      let totalSeconds = 0;
      if (input.includes(':')) {
        const parts = input.split(':').map(p => parseInt(p, 10));
        if (parts.length === 2) {
          totalSeconds = (parts[0] * 60) + parts[1];
        } else if (parts.length === 3) {
          totalSeconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        }
      } else {
        totalSeconds = parseInt(input, 10);
      }
      newForm.gameStart = isNaN(totalSeconds) ? '' : totalSeconds.toString();
    }

    if (form.length) {
      const input = form.length.toString().trim();
      let totalSeconds = 0;
      
      // Format prüfen: xx:yy:zz (Stunden:Minuten:Sekunden) oder xx:yy (Minuten:Sekunden) oder nur Sekunden
      if (input.includes(':')) {
        const parts = input.split(':').map(p => parseInt(p, 10));
        if (parts.length === 2) {
          // Format mm:ss
          const [minutes, seconds] = parts;
          totalSeconds = (minutes * 60) + seconds;
        } else if (parts.length === 3) {
          // Format hh:mm:ss
          const [hours, minutes, seconds] = parts;
          totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        }
      } else {
        // Nur Sekunden
        totalSeconds = parseInt(input, 10);
      }
      
      newForm.length = isNaN(totalSeconds) ? '' : totalSeconds.toString();
    }
    onSave(newForm);
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={form.video_id ? 'Video bearbeiten' : 'Video hinzufügen'}
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose} color="secondary" variant="outlined">
            Abbrechen
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading} onClick={handleSubmit}>
            {form.video_id ? 'Speichern' : 'Hinzufügen'}
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          fullWidth
          autoFocus
        />
        <TextField
          label="YouTube-Link oder Datei-URL"
          name="url"
          value={form.url}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Dateipfad (optional)"
          name="filePath"
          value={form.filePath}
          onChange={handleChange}
          fullWidth
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Startzeit (Sek. oder mm:ss oder hh:mm:ss)"
            name="gameStart"
            value={form.gameStart}
            onChange={handleChange}
            fullWidth
            helperText="z.B. 90, 1:30 oder 1:30:00"
          />
          <TextField
            label="Sortierung"
            name="sort"
            value={form.sort}
            onChange={handleChange}
            type="number"
            fullWidth
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            label="Video-Typ"
            name="videoType"
            value={form.videoType}
            onChange={handleChange}
            required
            fullWidth
          >
            <MenuItem value="">Keine</MenuItem>
            {videoTypes.map((type) => (
              <MenuItem key={type.id} value={String(type.id)}>{type.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Kamera"
            name="camera"
            value={form.camera}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="">Keine</MenuItem>
            {cameras.map((cam) => (
              <MenuItem key={cam.id} value={String(cam.id)}>{cam.name}</MenuItem>
            ))}
          </TextField>
        </Box>
        <TextField
          label="Länge (Sek. oder mm:ss oder hh:mm:ss)"
          name="length"
          value={form.length}
          onChange={handleChange}
          fullWidth
          helperText="Eingabe: Sekunden (z.B. 1559) oder mm:ss (z.B. 25:59) oder hh:mm:ss (z.B. 1:30:45)"
        />
      </Box>
    </BaseModal>
  );
}
