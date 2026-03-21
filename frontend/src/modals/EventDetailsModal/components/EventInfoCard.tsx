import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTheme } from '@mui/material/styles';
import { WeatherDisplay } from '../../../components/WeatherIcons';
import { FaCar } from 'react-icons/fa';
import type { TeamRideStatus } from '../hooks/useTeamRideStatus';

interface EventInfoCardProps {
  dateStr: string;
  startTimeStr: string;
  endTimeStr: string;
  isSameDay: boolean;
  endDateStr: string;
  weatherCode?: number;
  canViewRides?: boolean;
  teamRideStatus: TeamRideStatus;
  onWeatherClick: () => void;
  onRidesClick: () => void;
}

export const EventInfoCard: React.FC<EventInfoCardProps> = ({
  dateStr,
  startTimeStr,
  endTimeStr,
  isSameDay,
  endDateStr,
  weatherCode,
  canViewRides,
  teamRideStatus,
  onWeatherClick,
  onRidesClick,
}) => {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'stretch',
        gap: 2,
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      {/* Date & Time */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" fontWeight={600}>{dateStr}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {startTimeStr} – {isSameDay ? endTimeStr : `${endDateStr} ${endTimeStr}`}
          </Typography>
        </Stack>
      </Box>

      {/* Quick-access Icons: Weather + Rides */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
        sx={{ pt: { xs: 0.5, sm: 0 } }}
      >
        <Tooltip title="Wetterdetails" arrow>
          <Box
            id="weather-information"
            onClick={onWeatherClick}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              p: 0.75,
              bgcolor: theme.palette.action.hover,
              transition: 'background-color 0.2s',
              '&:hover': { bgcolor: theme.palette.action.selected },
            }}
          >
            <WeatherDisplay code={weatherCode} theme={theme.palette.mode} size={32} />
          </Box>
        </Tooltip>

        {canViewRides && (
          <Tooltip
            title={
              teamRideStatus === 'none'
                ? 'Keine Mitfahrgelegenheiten'
                : teamRideStatus === 'full'
                ? 'Alle Plätze belegt'
                : 'Plätze frei – klicken für Details'
            }
            arrow
          >
            <Box
              id="teamride-information"
              onClick={onRidesClick}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                p: 0.75,
                bgcolor: theme.palette.action.hover,
                transition: 'background-color 0.2s',
                '&:hover': { bgcolor: theme.palette.action.selected },
                position: 'relative',
              }}
            >
              <FaCar
                size={24}
                style={{
                  color:
                    teamRideStatus === 'none'
                      ? theme.palette.text.disabled
                      : teamRideStatus === 'full'
                      ? theme.palette.error.main
                      : theme.palette.success.main,
                }}
              />
              {teamRideStatus === 'free' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    border: '2px solid',
                    borderColor: 'background.paper',
                  }}
                />
              )}
            </Box>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
};
