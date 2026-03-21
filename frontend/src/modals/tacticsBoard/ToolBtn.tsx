// ─── TacticsBoard – shared UI atoms ───────────────────────────────────────────
import React from 'react';
import { IconButton, Tooltip } from '@mui/material';

// ── Arrow / Run SVG icon ──────────────────────────────────────────────────────

export const ArrowToolIcon: React.FC<{ dashed?: boolean }> = ({ dashed }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
    stroke="currentColor" strokeWidth="2">
    <path
      d="M4 18 Q12 4 18 6"
      strokeDasharray={dashed ? '3 2' : undefined}
      strokeLinecap="round"
    />
    <polyline points="13,4 18,6 16,11" strokeLinejoin="round" />
  </svg>
);

// ── Generic icon button with consistent active / hover styling ────────────────

export interface ToolBtnProps {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const ToolBtn: React.FC<ToolBtnProps> = ({
  active, title, onClick, children, disabled,
}) => (
  <Tooltip title={title} arrow placement="bottom">
    {/* Tooltip needs a focusable element; wrap disabled buttons in <span> */}
    <span>
      <IconButton
        size="small"
        onClick={onClick}
        disabled={disabled}
        sx={{
          color: active ? 'primary.light' : 'rgba(255,255,255,0.6)',
          bgcolor: active ? 'rgba(33,150,243,0.18)' : 'transparent',
          border: active
            ? '1px solid rgba(33,150,243,0.5)'
            : '1px solid transparent',
          borderRadius: 1.5,
          p: 0.75,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
          '&.Mui-disabled': { opacity: 0.3 },
        }}
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
);
