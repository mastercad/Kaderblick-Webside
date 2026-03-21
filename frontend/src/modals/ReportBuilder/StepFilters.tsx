import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Slider,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Autocomplete,
  TextField,
  CircularProgress,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { ReportBuilderState } from './types';
import { searchReportPlayers, fetchPlayerById } from '../../services/reports';

/** Reusable tooltip info icon */
const Tip: React.FC<{ text: string }> = ({ text }) => (
  <Tooltip title={text} placement="top-end">
    <InfoOutlinedIcon fontSize="small" sx={{ mt: 1.75, color: 'text.secondary', flexShrink: 0, cursor: 'default' }} />
  </Tooltip>
);

interface StepFiltersProps {
  state: ReportBuilderState;
}

export const StepFilters: React.FC<StepFiltersProps> = ({ state }) => {
  const {
    currentReport,
    builderData,
    handleFilterChange,
  } = state;

  type PlayerOption = { id: number; fullName: string };
  const [playerOptions, setPlayerOptions] = useState<PlayerOption[]>([]);
  const [playerInputValue, setPlayerInputValue] = useState('');
  const [playerLoading, setPlayerLoading] = useState(false);
  const [selectedPlayerOption, setSelectedPlayerOption] = useState<PlayerOption | null>(null);

  // Resolve existing player filter to a display label (e.g. when loading a saved report)
  useEffect(() => {
    const playerId = currentReport.config.filters?.player;
    if (!playerId) {
      setSelectedPlayerOption(null);
      return;
    }
    fetchPlayerById(Number(playerId)).then(data => {
      if (data) setSelectedPlayerOption({ id: data.id, fullName: data.fullName });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced player search
  useEffect(() => {
    if (playerInputValue.length < 2) {
      setPlayerOptions([]);
      return;
    }
    setPlayerLoading(true);
    const timer = setTimeout(() => {
      searchReportPlayers(playerInputValue)
        .then(results => setPlayerOptions(results))
        .catch(() => setPlayerOptions([]))
        .finally(() => setPlayerLoading(false));
    }, 300);
    return () => {
      clearTimeout(timer);
      setPlayerLoading(false);
    };
  }, [playerInputValue]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {!builderData ? (
        <Typography color="text.secondary">Lade Filterdaten...</Typography>
      ) : (
        <>
          {/* Date range */}
          {builderData.availableDates?.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2">Zeitraum</Typography>
                <Tooltip title="Schränkt die ausgewerteten Ereignisse auf einen bestimmten Datumsbereich ein. Nur Ereignisse innerhalb dieses Zeitraums fließen in den Report ein." placement="top">
                  <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', cursor: 'default' }} />
                </Tooltip>
              </Box>
              <Box display="flex" gap={2} mb={1} flexWrap="wrap">
                <Tooltip title="Startdatum des Zeitfensters aktivieren und einstellen." placement="top">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={currentReport.config.filters?.dateFrom != null}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.checked ? builderData.minDate : null)}
                        size="small"
                      />
                    }
                    label="Von"
                  />
                </Tooltip>
                <Tooltip title="Enddatum des Zeitfensters aktivieren und einstellen." placement="top">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={currentReport.config.filters?.dateTo != null}
                        onChange={(e) => handleFilterChange('dateTo', e.target.checked ? builderData.maxDate : null)}
                        size="small"
                      />
                    }
                    label="Bis"
                  />
                </Tooltip>
              </Box>

              {(currentReport.config.filters?.dateFrom != null || currentReport.config.filters?.dateTo != null) && (
                <Box sx={{ px: 1, mt: 1 }}>
                  <Slider
                    value={[
                      currentReport.config.filters?.dateFrom != null
                        ? builderData.availableDates.indexOf(currentReport.config.filters.dateFrom)
                        : 0,
                      currentReport.config.filters?.dateTo != null
                        ? builderData.availableDates.indexOf(currentReport.config.filters.dateTo)
                        : builderData.availableDates.length - 1,
                    ]}
                    onChange={(_, newValue) => {
                      const [startIndex, endIndex] = newValue as number[];
                      if (currentReport.config.filters?.dateFrom != null) {
                        handleFilterChange('dateFrom', builderData.availableDates[startIndex]);
                      }
                      if (currentReport.config.filters?.dateTo != null) {
                        handleFilterChange('dateTo', builderData.availableDates[endIndex]);
                      }
                    }}
                    min={0}
                    max={builderData.availableDates.length - 1}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => builderData.availableDates[value]}
                    marks={[
                      { value: 0, label: builderData.minDate },
                      { value: builderData.availableDates.length - 1, label: builderData.maxDate },
                    ]}
                  />
                </Box>
              )}
            </Paper>
          )}

          {/* Team */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Team</InputLabel>
              <Select
                value={currentReport.config.filters?.team || ''}
                onChange={(e) => handleFilterChange('team', e.target.value)}
                label="Team"
              >
                <MenuItem value="">Alle Teams</MenuItem>
                {builderData.teams.map((team) => (
                  <MenuItem key={team.id} value={team.id.toString()}>{team.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tip text="Zeigt nur Ereignisse, die für die gewählte Mannschaft erfasst wurden. Ohne Auswahl werden alle Teams berücksichtigt." />
          </Box>

          {/* Spieler */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Autocomplete
              fullWidth
              options={playerOptions}
              getOptionLabel={(o) => o.fullName}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={selectedPlayerOption}
              inputValue={playerInputValue}
              loading={playerLoading}
              onInputChange={(_, value) => setPlayerInputValue(value)}
              onChange={(_, option) => {
                setSelectedPlayerOption(option);
                handleFilterChange('player', option ? option.id.toString() : '');
              }}
              filterOptions={(x) => x}
              noOptionsText={playerInputValue.length < 2 ? 'Mind. 2 Zeichen eingeben' : 'Kein Spieler gefunden'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Spieler"
                  placeholder="Name eintippen…"
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {playerLoading ? <CircularProgress color="inherit" size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
            <Tip text="Filtert auf Ereignisse eines einzelnen Spielers. Kombinierbar mit allen anderen Filtern – z.B. „Tore von Spieler X in Heimspielen“." />
          </Box>

          {/* Spieltyp */}
          {(builderData.gameTypes?.length ?? 0) > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Spieltyp</InputLabel>
                <Select
                  value={currentReport.config.filters?.gameType || ''}
                  onChange={(e) => handleFilterChange('gameType', e.target.value)}
                  label="Spieltyp"
                >
                  <MenuItem value="">Alle Spieltypen</MenuItem>
                  {builderData.gameTypes!.map((gt) => (
                    <MenuItem key={gt.id} value={gt.id.toString()}>{gt.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tip text="Filtert nach der Art des Spiels, z.B. nur Ligaspiele, nur Pokalspiele oder nur Freundschaftsspiele." />
            </Box>
          )}

          {/* Ereignistyp */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Ereignistyp</InputLabel>
              <Select
                value={currentReport.config.filters?.eventType || ''}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                label="Ereignistyp"
              >
                <MenuItem value="">Alle Ereignistypen</MenuItem>
                {builderData.eventTypes.map((eventType) => (
                  <MenuItem key={eventType.id} value={eventType.id.toString()}>{eventType.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tip text="Beschränkt den Report auf einen bestimmten Ereignistyp, z.B. nur Tore oder nur Vorlagen. Wird oft mit der Y-Achse kombiniert." />
          </Box>

          {/* Platztyp */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Platztyp</InputLabel>
              <Select
                value={currentReport.config.filters?.surfaceType || ''}
                onChange={(e) => handleFilterChange('surfaceType', e.target.value)}
                label="Platztyp"
              >
                <MenuItem value="">Alle Platztypen</MenuItem>
                {builderData.surfaceTypes?.map((st) => (
                  <MenuItem key={st.id} value={st.id.toString()}>{st.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tip text="Filtert nach der Beschaffenheit des Spielfelds, z.B. nur Ereignisse auf Naturrasen oder nur auf Kunstrasen." />
          </Box>

          {/* Niederschlag */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Wetter (Niederschlag)</InputLabel>
              <Select
                value={currentReport.config.filters?.precipitation || ''}
                onChange={(e) => handleFilterChange('precipitation', e.target.value)}
                label="Wetter (Niederschlag)"
              >
                <MenuItem value="">Beliebig</MenuItem>
                <MenuItem value="yes">Mit Niederschlag</MenuItem>
                <MenuItem value="no">Ohne Niederschlag</MenuItem>
              </Select>
            </FormControl>
            <Tip text="Filtert Ereignisse nach dem Wetter am Spieltag. Erfordert, dass für das Spiel Wetterdaten hinterlegt sind." />
          </Box>
        </>
      )}
    </Box>
  );
};
