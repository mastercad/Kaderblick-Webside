import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { getZoneColor, truncateName } from '../helpers';
import type { PlayerData } from '../types';

interface PlayerTokenProps {
  player: PlayerData;
  isDragging: boolean;
  /** Highlighted when a squad-list player is being dragged over this token */
  isHighlighted?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}

/** Baut den Debug-Tooltip-Inhalt: Name + Rückennummer + Positionen. */
const buildTooltip = (player: PlayerData): React.ReactNode => {
  const posLine = [
    player.position ? 'Pos: ' + player.position : '',
    player.alternativePositions?.length ? 'Alt: ' + player.alternativePositions.join(', ') : '',
  ].filter(Boolean).join(' · ');

  const label = player.name + (player.isRealPlayer ? ' #' + String(player.number) : ' (Platzhalter)');

  return (
    <Box component="div">
      <Box component="div" sx={{ fontWeight: 700 }}>{label}</Box>
      {posLine && (
        <Box component="div" sx={{ fontSize: '0.72rem', opacity: 0.9, mt: 0.25 }}>
          {posLine}
        </Box>
      )}
    </Box>
  );
};

/**
 * A player token displayed on the pitch.
 * Shows the shirt number in a color-coded circle (by field zone)
 * and the player's name in a label beneath it.
 * Also renders a subtle dashed-border ring around placeholders.
 * The tooltip shows name, shirt number and position data for debugging.
 */
const PlayerToken: React.FC<PlayerTokenProps> = ({ player, isDragging, isHighlighted, onMouseDown, onTouchStart }) => (
  <Tooltip title={buildTooltip(player)} placement="top" disableInteractive>
    <Box
      sx={{
        position: 'absolute',
        left: player.x + '%',
        top: player.y + '%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 100 : isHighlighted ? 50 : 1,
        touchAction: 'none',
        userSelect: 'none',
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* Numbered circle */}
      <Box sx={{
        width: 44,
        height: 44,
        bgcolor: getZoneColor(player.y),
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: 15,
        border: isHighlighted
          ? '3px solid #fff'
          : player.isRealPlayer
            ? '2px solid rgba(255,255,255,0.85)'
            : '2px dashed rgba(255,255,255,0.6)',
        boxShadow: isHighlighted
          ? '0 0 0 3px rgba(255,255,255,0.9), 0 4px 16px rgba(0,0,0,0.7)'
          : '0 2px 8px rgba(0,0,0,0.55)',
        transition: 'box-shadow 0.15s, border 0.15s',
        transform: isHighlighted ? 'scale(1.2)' : 'scale(1)',
        flexShrink: 0,
        opacity: player.isRealPlayer ? 1 : 0.75,
      }}>
        {player.number}
      </Box>

      {/* Name label */}
      <Box sx={{
        mt: '2px',
        bgcolor: 'rgba(0,0,0,0.68)',
        color: 'white',
        borderRadius: '4px',
        px: '4px',
        lineHeight: '1.4',
        fontSize: '0.62rem',
        fontWeight: 600,
        maxWidth: 58,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {truncateName(player.name)}
      </Box>
    </Box>
  </Tooltip>
);

export default PlayerToken;
