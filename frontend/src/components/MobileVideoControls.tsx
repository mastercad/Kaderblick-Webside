import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, IconButton, Typography, Button, ButtonGroup, useTheme, useMediaQuery, Chip } from '@mui/material';
import {
  FastRewind as FastRewindIcon,
  FastForward as FastForwardIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  SportsScore as EventIcon,
  ContentCut as CutIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';

interface MobileVideoControlsProps {
  /** Ref to YouTube player to poll current time */
  playerRef: React.RefObject<any>;
  /** Whether the player is ready */
  playerReady: boolean;
  /** Total video duration in seconds */
  duration: number;
  /** Seek the video to an absolute position (seconds) */
  onSeek: (seconds: number) => void;
  /** Callback when user wants to create an event at the current position */
  onCreateEvent?: (videoPositionSeconds: number) => void;
  /** Callback when user wants to set a cut marker start/end at the current position */
  onSetCutMarker?: (videoPositionSeconds: number) => void;
  /** Whether cut mode is currently active */
  cutModeActive?: boolean;
  /** Current cut marker state: null = no pending marker, number = start position set */
  pendingCutStart?: number | null;
  /** Whether the "create event" action should be available */
  canCreateEvents?: boolean;
  /** gameStart offset for displaying game time */
  gameStart?: number;
  /** Cumulative offset for multi-video setups */
  cumulativeOffset?: number;
}

/**
 * Zeigt Sekunden als MM:SS an.
 */
function formatTime(seconds: number): string {
  const isNegative = seconds < 0;
  const abs = Math.abs(Math.round(seconds));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Mobile-optimierte Videosteuerung mit Jog-Buttons (±1s/±5s),
 * aktueller Positionsanzeige und Schnellzugriff-Buttons für
 * Spielereignisse und Schnittmarken.
 *
 * Wird NUR auf mobilen Geräten (< md Breakpoint) angezeigt.
 */
const MobileVideoControls: React.FC<MobileVideoControlsProps> = ({
  playerRef,
  playerReady,
  duration,
  onSeek,
  onCreateEvent,
  onSetCutMarker,
  cutModeActive = false,
  pendingCutStart = null,
  canCreateEvents = false,
  gameStart = 0,
  cumulativeOffset = 0,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pollt die aktuelle Videoposition alle 250ms
  useEffect(() => {
    if (!isMobile || !playerReady) return;

    pollingRef.current = setInterval(() => {
      try {
        const player = playerRef.current;
        if (!player) return;

        const time = player.getCurrentTime?.();
        if (typeof time === 'number' && !isNaN(time)) {
          setCurrentTime(time);
        }

        const state = player.getPlayerState?.();
        // YouTube states: 1 = playing, 2 = paused
        setIsPlaying(state === 1);
      } catch {
        // Player not ready yet
      }
    }, 250);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isMobile, playerReady, playerRef]);

  const handleJog = useCallback((deltaSeconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + deltaSeconds));
    onSeek(newTime);
    setCurrentTime(newTime);
  }, [currentTime, duration, onSeek]);

  const handlePlayPause = useCallback(() => {
    try {
      const player = playerRef.current;
      if (!player) return;
      const state = player.getPlayerState?.();
      if (state === 1) {
        player.pauseVideo?.();
        setIsPlaying(false);
      } else {
        player.playVideo?.();
        setIsPlaying(true);
      }
    } catch {
      // ignore
    }
  }, [playerRef]);

  const handleCreateEventHere = useCallback(() => {
    onCreateEvent?.(currentTime);
  }, [currentTime, onCreateEvent]);

  const handleSetCutMarkerHere = useCallback(() => {
    onSetCutMarker?.(currentTime);
  }, [currentTime, onSetCutMarker]);

  // Nicht auf Desktop anzeigen
  if (!isMobile) return null;

  // Spielzeit berechnen (Videoposition minus gameStart + kumulativer Offset)
  const gameTime = currentTime - gameStart + cumulativeOffset;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        py: 1.5,
        px: 1,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        mb: 1,
      }}
    >
      {/* Zeile 1: Zeitanzeige */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5 }}>
        <Chip
          label={`Video: ${formatTime(currentTime)}`}
          size="small"
          variant="outlined"
          sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem' }}
        />
        {gameStart > 0 && (
          <Chip
            label={`Spielzeit: ${formatTime(gameTime)}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem' }}
          />
        )}
      </Box>

      {/* Zeile 2: Jog-Buttons + Play/Pause */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
        <IconButton
          onClick={() => handleJog(-5)}
          size="medium"
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 1.5,
            minWidth: 48,
            minHeight: 48,
          }}
          aria-label="5 Sekunden zurück"
        >
          <FastRewindIcon fontSize="small" />
          <Typography variant="caption" sx={{ fontSize: '0.65rem', position: 'absolute', bottom: 2 }}>5s</Typography>
        </IconButton>

        <IconButton
          onClick={() => handleJog(-1)}
          size="medium"
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 1.5,
            minWidth: 48,
            minHeight: 48,
          }}
          aria-label="1 Sekunde zurück"
        >
          <ChevronLeftIcon />
          <Typography variant="caption" sx={{ fontSize: '0.65rem', position: 'absolute', bottom: 2 }}>1s</Typography>
        </IconButton>

        <IconButton
          onClick={handlePlayPause}
          size="medium"
          color="primary"
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 1.5,
            minWidth: 52,
            minHeight: 52,
            '&:hover': { bgcolor: 'primary.dark' },
          }}
          aria-label={isPlaying ? 'Pause' : 'Abspielen'}
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>

        <IconButton
          onClick={() => handleJog(1)}
          size="medium"
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 1.5,
            minWidth: 48,
            minHeight: 48,
          }}
          aria-label="1 Sekunde vor"
        >
          <ChevronRightIcon />
          <Typography variant="caption" sx={{ fontSize: '0.65rem', position: 'absolute', bottom: 2 }}>1s</Typography>
        </IconButton>

        <IconButton
          onClick={() => handleJog(5)}
          size="medium"
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 1.5,
            minWidth: 48,
            minHeight: 48,
          }}
          aria-label="5 Sekunden vor"
        >
          <FastForwardIcon fontSize="small" />
          <Typography variant="caption" sx={{ fontSize: '0.65rem', position: 'absolute', bottom: 2 }}>5s</Typography>
        </IconButton>
      </Box>

      {/* Zeile 3: Aktionsbuttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
        {canCreateEvents && (
          <Button
            variant="contained"
            size="small"
            startIcon={<EventIcon />}
            onClick={handleCreateEventHere}
            sx={{
              flex: '1 1 auto',
              maxWidth: 220,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
          >
            Ereignis hier setzen
          </Button>
        )}

        {cutModeActive && (
          <Button
            variant={pendingCutStart !== null ? 'contained' : 'outlined'}
            size="small"
            color={pendingCutStart !== null ? 'secondary' : 'primary'}
            startIcon={<CutIcon />}
            onClick={handleSetCutMarkerHere}
            sx={{
              flex: '1 1 auto',
              maxWidth: 220,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
          >
            {pendingCutStart !== null
              ? `Ende setzen (Start: ${formatTime(pendingCutStart)})`
              : 'Schnittmarke Start'}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default MobileVideoControls;
