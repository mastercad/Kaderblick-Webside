import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { SelectOption } from '../../types/event';

interface LocationFieldProps {
  locations: SelectOption[];
  value: string | undefined;
  onChange: (value: string) => void;
}

/**
 * Autocomplete field for selecting an event location.
 * Requires at least 2 characters before showing options.
 */
export const LocationField: React.FC<LocationFieldProps> = ({ locations, value, onChange }) => (
  <Autocomplete
    options={locations}
    getOptionLabel={(option) => option.label}
    value={locations.find(l => l.value === value) || null}
    onChange={(_, newValue) => onChange(newValue?.value || '')}
    filterOptions={(options, { inputValue }) => {
      if (inputValue.length < 2) return [];
      return options.filter(opt =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase()),
      );
    }}
    noOptionsText="Keine Orte gefunden (mindestens 2 Zeichen eingeben)"
    renderInput={(params) => (
      <TextField
        {...params}
        label="Ort"
        placeholder="Ort suchen..."
        fullWidth
        margin="normal"
      />
    )}
  />
);
