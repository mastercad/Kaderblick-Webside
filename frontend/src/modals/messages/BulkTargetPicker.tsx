import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import { BulkRole, OrgRef } from './types';

interface OrgTarget {
  orgId: string;
  roles: BulkRole[];
}

interface Props {
  label: string;
  orgs: OrgRef[];
  targets: OrgTarget[];
  onChange: (targets: OrgTarget[]) => void;
  loading?: boolean;
}

const ROLES: { value: BulkRole; label: string; icon: React.ReactNode }[] = [
  { value: 'players', label: 'Spieler',  icon: <PersonIcon sx={{ fontSize: 17 }} /> },
  { value: 'coaches', label: 'Trainer',  icon: <SchoolIcon sx={{ fontSize: 17 }} /> },
  { value: 'parents', label: 'Eltern',   icon: <FamilyRestroomIcon sx={{ fontSize: 17 }} /> },
  { value: 'all',     label: 'Alle',     icon: <GroupsIcon sx={{ fontSize: 17 }} /> },
];

/** Toggle a role in/out of the current roles array, with 'all' acting as shortcut */
function toggleRole(current: BulkRole[], clicked: BulkRole): BulkRole[] {
  if (clicked === 'all') return ['all'];

  const withoutAll = current.filter(r => r !== 'all');
  const isSelected = withoutAll.includes(clicked);
  const next = isSelected
    ? withoutAll.filter(r => r !== clicked)
    : [...withoutAll, clicked];

  if (next.length === 0) return ['all'];
  // If all three specific roles are selected, collapse to 'all'
  if (next.includes('players') && next.includes('coaches') && next.includes('parents')) return ['all'];
  return next;
}

export const BulkTargetPicker: React.FC<Props> = ({ label, orgs, targets, onChange, loading }) => {
  const available = orgs.filter((o) => !targets.some((t) => t.orgId === o.id));

  const handleAdd = (_: React.SyntheticEvent, org: OrgRef | null) => {
    if (!org) return;
    onChange([...targets, { orgId: org.id, roles: ['all'] }]);
  };

  const handleRoleToggle = (orgId: string, clicked: BulkRole) => {
    onChange(targets.map(t =>
      t.orgId === orgId ? { ...t, roles: toggleRole(t.roles, clicked) } : t
    ));
  };

  const handleRemove = (orgId: string) => {
    onChange(targets.filter((t) => t.orgId !== orgId));
  };

  return (
    <Box>
      <Autocomplete
        options={available}
        getOptionLabel={(o) => o.name}
        onChange={handleAdd}
        value={null}
        loading={loading}
        noOptionsText={orgs.length === 0 ? 'Keine Einträge verfügbar' : 'Bereits alle hinzugefügt'}
        renderInput={(params) => (
          <TextField {...params} label={label} size="small" fullWidth />
        )}
      />

      {targets.map((target) => {
        const org = orgs.find((o) => o.id === target.orgId);
        const roles = target.roles.length ? target.roles : ['all' as BulkRole];
        return (
          <Box
            key={target.orgId}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 1,
              px: 1,
              py: 0.75,
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            <Typography
              variant="body2"
              sx={{ flex: '0 0 auto', minWidth: 0, maxWidth: { xs: 90, sm: 130 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}
            >
              {org?.name ?? target.orgId}
            </Typography>

            <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
              <ToggleButtonGroup size="small" sx={{ flexWrap: 'wrap', gap: '2px', border: 'none' }}>
                {ROLES.map((r) => (
                  <Tooltip key={r.value} title={r.label}>
                    <ToggleButton
                      value={r.value}
                      selected={roles.includes(r.value)}
                      onChange={() => handleRoleToggle(target.orgId, r.value)}
                      aria-label={r.label}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: '4px !important',
                        px: 0.75,
                        py: 0.25,
                        minWidth: 32,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': { bgcolor: 'primary.dark' },
                        },
                      }}
                    >
                      {r.icon}
                    </ToggleButton>
                  </Tooltip>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Tooltip title="Entfernen">
              <IconButton
                size="small"
                onClick={() => handleRemove(target.orgId)}
                aria-label={`${org?.name ?? target.orgId} entfernen`}
                sx={{ flexShrink: 0 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      })}
    </Box>
  );
};

