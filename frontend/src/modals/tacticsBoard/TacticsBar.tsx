// ─── TacticsBoard – tactic tab bar ────────────────────────────────────────────
import React from 'react';
import { Box, Typography } from '@mui/material';
import type { TacticEntry } from './types';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TacticsBarProps {
  tactics: TacticEntry[];
  activeTacticId: string;
  renamingId: string | null;
  renameValue: string;

  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onStartRename: (id: string, currentName: string) => void;
  onRenameChange: (v: string) => void;
  onConfirmRename: () => void;
  onCancelRename: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TacticsBar: React.FC<TacticsBarProps> = ({
  tactics, activeTacticId, renamingId, renameValue,
  onSelect, onNew, onDelete,
  onStartRename, onRenameChange, onConfirmRename, onCancelRename,
}) => (
  <Box sx={{
    display: 'flex', alignItems: 'center', gap: 0.75,
    px: 1.5, py: 0.5,
    bgcolor: 'rgba(0,0,0,0.2)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0, overflowX: 'auto',
  }}>
    <Typography variant="caption" sx={{
      color: 'rgba(255,255,255,0.3)', fontWeight: 700,
      fontSize: '0.6rem', letterSpacing: 2, flexShrink: 0,
    }}>
      TAKTIKEN
    </Typography>

    {tactics.map(tactic => {
      const isActive = tactic.id === activeTacticId;
      return (
        <Box
          key={tactic.id}
          onClick={() => onSelect(tactic.id)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.5,
            px: 1, py: 0.3,
            bgcolor: isActive ? 'rgba(33,150,243,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isActive ? 'rgba(33,150,243,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
            transition: 'all 0.15s',
            '&:hover': {
              bgcolor: isActive ? 'rgba(33,150,243,0.28)' : 'rgba(255,255,255,0.1)',
            },
          }}
        >
          {renamingId === tactic.id ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => onRenameChange(e.target.value)}
              onBlur={onConfirmRename}
              onKeyDown={e => {
                if (e.key === 'Enter')  onConfirmRename();
                if (e.key === 'Escape') onCancelRename();
              }}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: 'white', fontSize: '0.72rem', fontWeight: 700,
                width: `${Math.max(6, renameValue.length + 1)}ch`,
              }}
            />
          ) : (
            <Typography
              variant="caption"
              onDoubleClick={e => {
                e.stopPropagation();
                onStartRename(tactic.id, tactic.name);
              }}
              sx={{
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'primary.light' : 'rgba(255,255,255,0.55)',
                fontSize: '0.72rem', lineHeight: 1, userSelect: 'none',
              }}
            >
              {tactic.name}
            </Typography>
          )}

          {/* Delete button – hidden when only one tactic remains */}
          {tactics.length > 1 && (
            <Box
              onClick={e => { e.stopPropagation(); onDelete(tactic.id); }}
              sx={{
                width: 14, height: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', lineHeight: 1,
                '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              ×
            </Box>
          )}
        </Box>
      );
    })}

    {/* Add tactic button */}
    <Box
      onClick={onNew}
      sx={{
        display: 'flex', alignItems: 'center', px: 0.9, py: 0.3,
        bgcolor: 'transparent',
        border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '12px',
        cursor: 'pointer', color: 'rgba(255,255,255,0.35)',
        fontSize: '0.72rem', flexShrink: 0, transition: 'all 0.15s',
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.8)',
          borderColor: 'rgba(255,255,255,0.4)',
        },
      }}
    >
      + Neue Taktik
    </Box>
  </Box>
);
