import React from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { EventData, SelectOption } from '../../types/event';

interface GameEventFieldsProps {
  formData: EventData;
  teams: SelectOption[];
  gameTypes: SelectOption[];
  leagues: SelectOption[];
  cups: SelectOption[];
  isTournament: boolean;
  isTournamentEventType: boolean;
  isLiga: boolean;
  isPokal: boolean;
  handleChange: (field: string, value: any) => void;
}

/**
 * Form fields specific to game events:
 * - Home/Away Teams (hidden for tournament games)
 * - Game Type
 * - League
 */
const GameEventFieldsComponent: React.FC<GameEventFieldsProps> = ({
  formData,
  teams,
  gameTypes,
  leagues,
  cups,
  isTournament,
  isTournamentEventType,
  isLiga,
  isPokal,
  handleChange,
}) => {
  return (
    <>
      {/* For tournament games, teams are selected from tournament-match; hide manual home/away selection */}
      {!isTournament && (
        <>
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="home-team-label">Heim-Team *</InputLabel>
            <Select
              labelId="home-team-label"
              value={formData.homeTeam || ''}
              label="Heim-Team *"
              onChange={e => handleChange('homeTeam', e.target.value as string)}
            >
              <MenuItem value=""><em>Bitte wählen...</em></MenuItem>
              {teams.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="away-team-label">Auswärts-Team *</InputLabel>
            <Select
              labelId="away-team-label"
              value={formData.awayTeam || ''}
              label="Auswärts-Team *"
              onChange={e => handleChange('awayTeam', e.target.value as string)}
            >
              <MenuItem value=""><em>Bitte wählen...</em></MenuItem>
              {teams.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}
      
      {/* Hide game type dropdown when CalendarEventType is "Turnier" — it's redundant */}
      {gameTypes.length > 0 && !isTournamentEventType && (
        <FormControl fullWidth margin="normal">
          <InputLabel id="game-type-label">Spiel-Typ</InputLabel>
          <Select
            labelId="game-type-label"
            value={formData.gameType || ''}
            label="Spiel-Typ"
            onChange={e => handleChange('gameType', e.target.value as string)}
          >
            <MenuItem value=""><em>Bitte wählen...</em></MenuItem>
            {gameTypes.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      
      {isLiga && leagues.length > 0 && !isTournament && (
        <FormControl fullWidth margin="normal">
          <InputLabel id="league-label">Liga</InputLabel>
          <Select
            labelId="league-label"
            value={formData.leagueId || ''}
            label="Liga"
            onChange={e => handleChange('leagueId', e.target.value as string)}
          >
            <MenuItem value=""><em>Bitte wählen...</em></MenuItem>
            {leagues.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {isPokal && cups.length > 0 && !isTournament && (
        <FormControl fullWidth margin="normal">
          <InputLabel id="cup-label">Pokal</InputLabel>
          <Select
            labelId="cup-label"
            value={formData.cupId || ''}
            label="Pokal"
            onChange={e => handleChange('cupId', e.target.value as string)}
          >
            <MenuItem value=""><em>Bitte wählen...</em></MenuItem>
            {cups.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </>
  );
};

export const GameEventFields = React.memo(GameEventFieldsComponent);
