import React, { useState, useEffect, useRef } from 'react';
import { getApiErrorMessage } from '../utils/api';
import {
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  ListSubheader,
  Box,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import {
  fetchGameEventTypes,
  fetchSubstitutionReasons,
  createGameEvent,
  updateGameEvent,
  fetchGameSquad,
  type SquadPlayer,
} from '../services/games';
import { Game, GameEvent, GameEventType, SubstitutionReason } from '../types/games';
import { getGameEventIconByCode } from '../constants/gameEventIcons';
import BaseModal from './BaseModal';
import {
  secondsToMinute,
  minuteToSeconds,
  secondsToFootballTime,
  elapsedSecondsToFormTime,
  formatFootballTime,
  isNearHalfEnd,
  DEFAULT_HALF_DURATION,
} from '../utils/gameEventTime';

// ── Props ────────────────────────────────────────────────────────────────────

interface GameEventModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gameId: number;
  game: Game;
  existingEvent?: GameEvent | null;
  /** Sekunden ab Spielstart, vorausgewählt (z.B. vom Video-Klick) */
  initialMinute?: number;
}

// ── Komponente ───────────────────────────────────────────────────────────────

export const GameEventModal: React.FC<GameEventModalProps> = ({
  open,
  onClose,
  onSuccess,
  gameId,
  game,
  existingEvent = null,
  initialMinute,
}) => {
  const halfDuration: number = game.halfDuration ?? game.gameType?.halfDuration ?? DEFAULT_HALF_DURATION;

  const parseExistingSeconds = (): { minute: number; stoppage: number } => {
    let sec = 0;
    if (existingEvent?.timestamp && game.calendarEvent?.startDate) {
      sec = Math.floor(
        (new Date(existingEvent.timestamp).getTime() -
          new Date(game.calendarEvent.startDate).getTime()) / 1000
      );
    } else if (existingEvent?.minute && !isNaN(Number(existingEvent.minute))) {
      sec = Number(existingEvent.minute);
    }
    return secondsToFootballTime(sec, halfDuration);
  };

  const getInitialFormData = () => {
    if (existingEvent) {
      const { minute, stoppage } = parseExistingSeconds();
      return {
        team: existingEvent.team?.id?.toString() || existingEvent.teamId?.toString() || '',
        eventType: existingEvent.gameEventType?.id?.toString() || existingEvent.typeId?.toString() || '',
        player: existingEvent.player?.id?.toString() || existingEvent.playerId?.toString() || '',
        relatedPlayer: existingEvent.relatedPlayer?.id?.toString() || existingEvent.relatedPlayerId?.toString() || '',
        minute: String(minute),
        stoppage: String(stoppage),
        description: existingEvent.description || '',
        reason: (existingEvent as any).reason?.id || 0,
        playerId: existingEvent.playerId || 0,
        teamId: existingEvent.teamId || 0,
      };
    }
    return {
      team: '',
      eventType: '',
      player: '',
      relatedPlayer: '',
      minute: initialMinute !== undefined ? String(secondsToMinute(initialMinute)) : '',
      stoppage: '0',
      description: '',
      reason: 0,
      playerId: 0,
      teamId: 0,
    };
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [eventTypes, setEventTypes] = useState<GameEventType[]>([]);
  const [substitutionReasons, setSubstitutionReasons] = useState<SubstitutionReason[]>([]);
  const [formData, setFormData] = useState(getInitialFormData);
  /** Squad (Zugesagte) pro teamId */
  const [squadByTeam, setSquadByTeam] = useState<Record<number, SquadPlayer[]>>({});
  /** Alle aktiven Teamspieler pro teamId */
  const [allPlayersByTeam, setAllPlayersByTeam] = useState<Record<number, SquadPlayer[]>>({});
  const [hasParticipationData, setHasParticipationData] = useState(false);
  const prevOpen = useRef(false);

  // ── Uhr ───────────────────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open && game.calendarEvent?.startDate) {
      const start = new Date(game.calendarEvent.startDate);
      const update = () => {
        setCurrentTime(new Date());
        setElapsedSeconds(Math.floor((Date.now() - start.getTime()) / 1000));
      };
      update();
      timerRef.current = setInterval(update, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
    // eslint-disable-next-line
  }, [open, game.calendarEvent?.startDate]);

  // ── Modal-Open ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open && !prevOpen.current) {
      setFormData(getInitialFormData());
    }
    prevOpen.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existingEvent, initialMinute]);

  useEffect(() => {
    if (open && !existingEvent && typeof initialMinute === 'number') {
      setFormData(prev => ({
        ...prev,
        minute: String(secondsToMinute(initialMinute)),
        stoppage: '0',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMinute, open, existingEvent]);

  // ── Daten laden ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);



  const loadInitialData = async () => {
    try {
      const [eventTypesRaw, reasonsData, squadData] = await Promise.all([
        fetchGameEventTypes(),
        fetchSubstitutionReasons(),
        fetchGameSquad(gameId).catch(() => ({ squad: [], allPlayers: [], hasParticipationData: false })),
      ]);
      const eventTypesData = Array.isArray(eventTypesRaw)
        ? eventTypesRaw
        : ((eventTypesRaw as any).gameEventTypes || []);
      setEventTypes(eventTypesData);
      setSubstitutionReasons(reasonsData);

      // Squad (Zugesagte) nach teamId gruppieren
      const byTeam: Record<number, SquadPlayer[]> = {};
      for (const p of squadData.squad) {
        if (!byTeam[p.teamId]) byTeam[p.teamId] = [];
        byTeam[p.teamId].push(p);
      }
      setSquadByTeam(byTeam);

      // Alle aktiven Spieler nach teamId gruppieren
      const allByTeam: Record<number, SquadPlayer[]> = {};
      for (const p of (squadData.allPlayers ?? [])) {
        if (!allByTeam[p.teamId]) allByTeam[p.teamId] = [];
        allByTeam[p.teamId].push(p);
      }
      setAllPlayersByTeam(allByTeam);
      setHasParticipationData(squadData.hasParticipationData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleInputChange = (field: string, value: string | number) => {
    if (field === 'team') {
      setFormData(prev => ({ ...prev, team: String(value), player: '', relatedPlayer: '' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  /**
   * Gibt gruppierte MenuItems zurück:
   * – "Kader" (zugesagte Spieler, fett + grün)
   * – "Weitere Spieler" (alle aktiven Teamspieler, die nicht im Kader sind)
   */
  const renderPlayerOptions = (selectedTeamId: string | number): React.ReactNode[] => {
    if (!selectedTeamId) return [<MenuItem key="" value="">Spieler wählen…</MenuItem>];
    const teamId = Number(selectedTeamId);
    const squadPlayers = squadByTeam[teamId] ?? [];
    const allForTeam = allPlayersByTeam[teamId] ?? [];
    const squadIds = new Set(squadPlayers.map(p => p.id));
    const nonSquadPlayers = allForTeam.filter(p => !squadIds.has(p.id));

    const items: React.ReactNode[] = [
      <MenuItem key="__empty" value="">Spieler wählen…</MenuItem>,
    ];

    if (squadPlayers.length > 0) {
      items.push(
        <ListSubheader key="__header-kader" sx={{ lineHeight: '32px', fontWeight: 'bold' }}>
          Kader
        </ListSubheader>
      );
      for (const player of squadPlayers) {
        items.push(
          <MenuItem
            key={`squad-${player.id}`}
            value={player.id}
            sx={{ fontWeight: 700, color: 'success.main' }}
          >
            {player.shirtNumber ? `#${player.shirtNumber} ` : ''}{player.fullName}
          </MenuItem>
        );
      }
    }

    if (nonSquadPlayers.length > 0) {
      items.push(
        <ListSubheader key="__header-weitere" sx={{ lineHeight: '32px', fontWeight: 'bold' }}>
          Weitere Spieler
        </ListSubheader>
      );
      for (const player of nonSquadPlayers) {
        items.push(
          <MenuItem key={`all-${player.id}`} value={player.id}>
            {player.shirtNumber ? `#${player.shirtNumber} ` : ''}{player.fullName}
          </MenuItem>
        );
      }
    }

    return items;
  };

  const isSubstitution = () => {
    const et = eventTypes.find(e => e.id === Number(formData.eventType));
    if (!et) return false;
    return et.name.toLowerCase().includes('wechsel') || et.code.toLowerCase().includes('sub');
  };

  /** Setzt Minute auf aktuelle Spielzeit und erkennt Nachspielzeit automatisch */
  const handleSetNow = () => {
    const { minute, stoppage } = elapsedSecondsToFormTime(elapsedSeconds, halfDuration);
    setFormData(prev => ({ ...prev, minute: String(minute), stoppage: String(stoppage) }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const sec = minuteToSeconds(
        parseInt(formData.minute, 10) || 0,
        parseInt(formData.stoppage, 10) || 0,
      );
      const submitData = {
        eventType: Number(formData.eventType),
        player: formData.player ? Number(formData.player) : undefined,
        relatedPlayer: formData.relatedPlayer ? Number(formData.relatedPlayer) : undefined,
        minute: String(sec),
        description: formData.description,
        reason: formData.reason ? Number(formData.reason) : undefined,
      };
      if (existingEvent) {
        await updateGameEvent(gameId, existingEvent.id, submitData);
      } else {
        await createGameEvent(gameId, submitData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving game event:', error);
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitError(null);
    setFormData({
      team: '', eventType: '', player: '', relatedPlayer: '',
      minute: '', stoppage: '0', description: '', reason: 0, playerId: 0, teamId: 0,
    });
    onClose();
  };

  // ── Anzeige-Berechnungen ───────────────────────────────────────────────────
  const min = parseInt(formData.minute, 10) || 0;
  const stopp = parseInt(formData.stoppage, 10) || 0;
  const timeDisplay = formatFootballTime(min, stopp);
  const isTimeValid = min > 0;
  const showStoppageChips = isNearHalfEnd(min, halfDuration);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title={existingEvent ? 'Ereignis bearbeiten' : 'Neues Spielereignis'}
      maxWidth="md"
      actions={
        <>
          <Button onClick={handleClose} disabled={loading} variant="outlined" color="secondary"
            sx={{ minHeight: 48 }}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading || !formData.eventType || !formData.team || !formData.player || !isTimeValid}
            sx={{ minHeight: 48, flex: 1 }}
          >
            {loading ? 'Speichere…' : 'Speichern'}
          </Button>
        </>
      }
    >
      <Box>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {/* ── Spielzeit-Block ──────────────────────────────────────────────── */}
        <Box sx={{
          border: '2px solid',
          borderColor: 'primary.main',
          borderRadius: 2,
          p: 2,
          mb: 3,
        }}>
          {/* Uhrzeit + Jetzt-Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ letterSpacing: 1, lineHeight: 1 }}>
                {currentTime.toLocaleTimeString()}
              </Typography>
              {elapsedSeconds > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {Math.floor(elapsedSeconds / 60)} min seit Anpfiff
                </Typography>
              )}
            </Box>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleSetNow}
              sx={{ minHeight: 56, minWidth: 110, fontSize: '1rem', fontWeight: 'bold' }}
            >
              <i className="fas fa-clock" style={{ marginRight: 8 }} />
              Jetzt
            </Button>
          </Box>

          {/* Minute + Nachspielzeit */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            {/* Minuten-Eingabe */}
            <Box sx={{ flex: '0 0 120px' }}>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Spielminute
              </Typography>
              <TextField
                type="number"
                value={formData.minute}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '');
                  setFormData(prev => ({ ...prev, minute: v, stoppage: '0' }));
                }}
                inputProps={{
                  min: 1,
                  max: 200,
                  inputMode: 'numeric',
                  style: {
                    fontSize: '1.6rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '12px 8px',
                  },
                }}
                placeholder="–"
                required
                fullWidth
              />
            </Box>

            {/* Nachspielzeit-Chips */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                + Nachspielzeit
                {!showStoppageChips && min > 0 && (
                <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                  (bei {halfDuration}' / {halfDuration * 2}')
                </Typography>
              )}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                  <Chip
                    key={n}
                    label={`+${n}`}
                    onClick={() => handleInputChange('stoppage', String(n))}
                    color={stopp === n ? 'primary' : 'default'}
                    variant={stopp === n ? 'filled' : 'outlined'}
                    disabled={!showStoppageChips && n > 0}
                    sx={{
                      minWidth: 44,
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      opacity: (!showStoppageChips && n > 0) ? 0.3 : 1,
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {/* Vorschau */}
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">Ereignis bei:</Typography>
            <Typography variant="h6" fontWeight="bold" color="primary.main">
              {timeDisplay}
            </Typography>
          </Box>
        </Box>

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {game.homeTeam.name} vs {game.awayTeam.name}
        </Typography>

        {/* ── Event-Details ─────────────────────────────────────────────────── */}
        <FormControl fullWidth required sx={{ mb: 2 }}>
          <InputLabel>Team</InputLabel>
          <Select
            value={formData.team}
            onChange={e => handleInputChange('team', e.target.value)}
            label="Team"
          >
            <MenuItem value="">Team wählen…</MenuItem>
            <MenuItem value={game.homeTeam.id}>{game.homeTeam.name}</MenuItem>
            <MenuItem value={game.awayTeam.id}>{game.awayTeam.name}</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth required sx={{ mb: 2 }}>
          <InputLabel>Event-Typ</InputLabel>
          <Select
            value={formData.eventType}
            onChange={e => handleInputChange('eventType', e.target.value)}
            label="Event-Typ"
          >
            <MenuItem value="">Event-Typ wählen…</MenuItem>
            {eventTypes.map(type => (
              <MenuItem key={type.id} value={type.id}>
                <span style={{ color: type.color, marginLeft: 8 }}>
                  {getGameEventIconByCode(type.code)}
                </span>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* ── Kader-Indikator: Chip wenn Participation-Daten vorhanden ── */}
        {formData.team && hasParticipationData && (() => {
          const teamId = Number(formData.team);
          const squadCount = squadByTeam[teamId]?.length ?? 0;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Chip
                size="small"
                color={squadCount > 0 ? 'success' : 'default'}
                variant={squadCount > 0 ? 'filled' : 'outlined'}
                label={squadCount > 0 ? `${squadCount} zugesagt` : 'Keine Zusagen'}
                sx={{ fontSize: '0.75rem', cursor: 'default' }}
              />
            </Box>
          );
        })()}

        <FormControl fullWidth required sx={{ mb: 2 }}>
          <InputLabel>Spieler</InputLabel>
          <Select
            value={formData.player}
            onChange={e => handleInputChange('player', e.target.value)}
            label="Spieler"
          >
            {renderPlayerOptions(formData.team)}
          </Select>
        </FormControl>

        {isSubstitution() && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Eingewechselter Spieler</InputLabel>
            <Select
              value={formData.relatedPlayer}
              onChange={e => handleInputChange('relatedPlayer', e.target.value)}
              label="Eingewechselter Spieler"
            >
              {renderPlayerOptions(formData.team)}
            </Select>
          </FormControl>
        )}

        {isSubstitution() && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Grund für Wechsel</InputLabel>
            <Select
              value={formData.reason}
              onChange={e => handleInputChange('reason', e.target.value)}
              label="Grund für Wechsel"
            >
              <MenuItem value="">Grund wählen…</MenuItem>
              {substitutionReasons.map(reason => (
                <MenuItem key={reason.id} value={reason.id}>
                  {reason.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          label="Beschreibung (optional)"
          value={formData.description}
          onChange={e => handleInputChange('description', e.target.value)}
          fullWidth
          multiline
          minRows={1}
          sx={{ mb: 1 }}
        />
      </Box>
    </BaseModal>
  );
};
