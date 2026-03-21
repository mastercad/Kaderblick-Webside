import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import type { ParticipationStatus, CurrentParticipation } from '../types';

interface ParticipationButtonsProps {
  statuses: ParticipationStatus[];
  currentParticipation: CurrentParticipation | null;
  saving: boolean;
  onStatusClick: (statusId: number) => void;
}

export const ParticipationButtons: React.FC<ParticipationButtonsProps> = ({
  statuses,
  currentParticipation,
  saving,
  onStatusClick,
}) => {
  const theme = useTheme();

  if (!statuses.length) return null;

  return (
    <Box
      id="event-action-button"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.75,
        mb: 2,
      }}
    >
      {[...statuses]
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(status => {
          const isActive = currentParticipation?.statusId === status.id;
          return (
            <Button
              key={status.id}
              variant={isActive ? 'contained' : 'outlined'}
              size="small"
              startIcon={
                status.icon ? (
                  <i className={`fa fa-${status.icon} fa-fw`} style={{ fontSize: 13 }} />
                ) : undefined
              }
              disabled={saving}
              onClick={() => onStatusClick(status.id)}
              sx={{
                borderRadius: 5,
                textTransform: 'none',
                fontWeight: isActive ? 700 : 500,
                px: 1.75,
                py: 0.5,
                fontSize: '0.8rem',
                lineHeight: 1.4,
                bgcolor: isActive ? (status.color || undefined) : undefined,
                color: isActive ? '#fff' : (status.color || undefined),
                borderColor: status.color || undefined,
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: isActive
                    ? status.color || undefined
                    : `${status.color || theme.palette.primary.main}1A`,
                  borderColor: status.color || undefined,
                },
              }}
            >
              {status.name}
            </Button>
          );
        })}
    </Box>
  );
};
