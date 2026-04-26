import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Button, Box, Typography, TextField, InputAdornment, CircularProgress, Alert, Divider, Chip, Stack, IconButton
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
//import PlayerLicenseEditModal from './PlayerLicenseEditModal';
import NationalityEditModal from './NationalityEditModal';
import ClubEditModal from './ClubEditModal';
//import { PlayerLicense } from '../types/playerLicense';
import { Nationality } from '../types/nationality';
import { Player } from '../types/player';
import { Club } from '../types/club';
import { Team } from '../types/team';
import { apiJson } from '../utils/api';
import { toDateInputValue } from '../utils/date';
import { PlayerTeamAssignmentType } from '../types/playerTeamAssignmentType';
import { StrongFeet } from '../types/strongFeet';
import { Position } from '../types/position';
import BaseModal from './BaseModal';

interface PlayerEditModalProps {
    openPlayerEditModal: boolean;
    playerId: number | null;
    onPlayerEditModalClose: () => void;
    onPlayerSaved?: (player: Player) => void;
}

const PlayerEditModal: React.FC<PlayerEditModalProps> = ({ openPlayerEditModal, playerId, onPlayerEditModalClose, onPlayerSaved }) => 
{
    // State für die Modals zum Anlegen
/*
    const [openLicenseModal, setOpenLicenseModal] = useState(false);
    const [licenseModalId, setLicenseModalId] = useState<number | null>(null);
*/
    const [openClubModal, setOpenClubModal] = useState(false);
    const [openNationalityModal, setOpenNationalityModal] = useState(false);
    // ID merken, für das Assignment das gerade editiert wird
    const [clubModalId, setClubModalId] = useState<number | null>(null);
    const [nationalityModalId, setNationalityModalId] = useState<number | null>(null);
    const [player, setPlayer] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Suche nach bestehendem Spieler (nur relevant beim Neuanlegen, playerId === null)
    const [showPlayerSearch, setShowPlayerSearch] = useState(false);
    const [playerSearchQuery, setPlayerSearchQuery] = useState('');
    const [playerSearchResults, setPlayerSearchResults] = useState<any[]>([]);
    const [playerSearchLoading, setPlayerSearchLoading] = useState(false);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Multi-Select States
    const [allClubs, setAllClubs] = useState<Club[]>([]);
    const [allPlayerTeamAssignmentTypes, setAllPlayerTeamAssignmentTypes] = useState<PlayerTeamAssignmentType[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [allPlayerPositions, setAllPositions] = useState<Position[]>([]);
    const [allStrongFeets, setAllStrongFeets] = useState<StrongFeet[]>([]);
    const [allNationalities, setAllNationalities] = useState<Nationality[]>([]);

    // Debounced Spielersuche (für die "Spieler bereits vorhanden?"-Suche)
    const handlePlayerSearchInput = useCallback((value: string) => {
        setPlayerSearchQuery(value);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (value.trim().length < 2) {
            setPlayerSearchResults([]);
            return;
        }
        searchDebounceRef.current = setTimeout(async () => {
            setPlayerSearchLoading(true);
            try {
                const res = await apiJson(`/api/players?search=${encodeURIComponent(value.trim())}&limit=10&searchAll=1`);
                setPlayerSearchResults(res.players || []);
            } catch {
                setPlayerSearchResults([]);
            } finally {
                setPlayerSearchLoading(false);
            }
        }, 300);
    }, []);

    const handleSelectExistingPlayer = useCallback(async (selectedPlayer: any) => {
        setPlayerSearchQuery('');
        setPlayerSearchResults([]);
        setShowPlayerSearch(false);
        setLoading(true);
        try {
            const data = await apiJson(`/api/players/${selectedPlayer.id}`);
            const p = data.player;
            if (p && Array.isArray(p.teamAssignments)) {
                p.teamAssignments = p.teamAssignments.map((a: any) => ({
                    ...a,
                    type: a.type && typeof a.type === 'object' ? String(a.type.id)
                        : a.type !== undefined && a.type !== null ? String(a.type)
                        : a.team && a.team.type && a.team.type.id ? String(a.team.type.id)
                        : '',
                    startDate: toDateInputValue(a.startDate),
                    endDate: toDateInputValue(a.endDate),
                }));
            }
            setPlayer(p);
        } catch {
            setError('Fehler beim Laden des Spielers.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (openPlayerEditModal) {
            setError(null);
            apiJson('/api/clubs').then(res => setAllClubs(res.entries || [])).catch(() => setAllClubs([]));
            apiJson('/api/teams').then(res => setAllTeams(res.teams || [])).catch(() => setAllTeams([]));
            apiJson('/api/strong-feet').then(res => setAllStrongFeets(res.strongFeets || [])).catch(() => setAllStrongFeets([]));
            apiJson('/api/positions').then(res => setAllPositions(res.positions || [])).catch(() => setAllPositions([]));
            apiJson('/api/player-team-assignment-types').then(res => setAllPlayerTeamAssignmentTypes(res.playerTeamAssignmentTypes || [])).catch(() => setAllPlayerTeamAssignmentTypes([]));
//            apiJson('/api/player-licenses').then(res => setAllLicenses(res.playerLicenses || [])).catch(() => setAllLicenses([]));
            apiJson('/api/nationalities').then(res => setAllNationalities(res.nationalities || [])).catch(() => setAllNationalities([]));
        }
    }, [openPlayerEditModal]);

    useEffect(() => {
        // Beim Öffnen mit playerId=null → Suche einblenden
        if (openPlayerEditModal && !playerId) {
            setShowPlayerSearch(true);
            setPlayerSearchQuery('');
            setPlayerSearchResults([]);
        } else {
            setShowPlayerSearch(false);
        }
    }, [openPlayerEditModal, playerId]);

    useEffect(() => {
        if (openPlayerEditModal && playerId) {
            setLoading(true);
            apiJson(`/api/players/${playerId}`)
                .then(data => {
                    const player = data.player;
                    if (player && Array.isArray(player.teamAssignments)) {
                        player.teamAssignments = player.teamAssignments.map((a: any) => ({
                            ...a,
                            type: a.type && typeof a.type === 'object' ? String(a.type.id)
                                : a.type !== undefined && a.type !== null ? String(a.type)
                                : a.team && a.team.type && a.team.type.id ? String(a.team.type.id)
                                : '',
                            startDate: toDateInputValue(a.startDate),
                            endDate: toDateInputValue(a.endDate),
                        }));
                    }
                    setPlayer(player);
                    setLoading(false);
                })
                .catch(() => {
                    setError('Fehler beim Laden der Trainerdaten.');
                    setLoading(false);
                });
        } else if (openPlayerEditModal) {
            setPlayer(null);
        }
    }, [openPlayerEditModal, playerId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePlayerEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setPlayer((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleClubAssignmentChange = (id: number, field: string, value: any) => {
        setPlayer((prev: any) => {
            const assignments = (prev.clubAssignments || []).map((a: any) =>
                a.id === id ? { ...a, [field]: value } : a
            );
            return { ...prev, clubAssignments: assignments };
        });
    };

    const handleTeamAssignmentChange = (id: number, field: string, value: any) => {
        setPlayer((prev: any) => {
            const assignments = (prev.teamAssignments || []).map((a: any) =>
                a.id === id ? { ...a, [field]: value } : a
            );
            return { ...prev, teamAssignments: assignments };
        });
    };

    const handleAddTeamAssignment = () => {
        setPlayer((prev: any) => {
            const base = prev ?? {};
            return {
                ...base,
                teamAssignments: [
                    ...(base.teamAssignments || []),
                    { id: null, team: null, type: '', startDate: undefined, endDate: undefined }
                ]
            };
        });
    };

    const handleRemoveTeamAssignment = (id: number) => {
        setPlayer((prev: any) => {
            const assignments = (prev.teamAssignments || []).filter((a: any) => a.id !== id);
            return { ...prev, teamAssignments: assignments };
        });
    };

    const handleRemoveClubAssignment = (id: number) => {
        setPlayer((prev: any) => {
            const assignments = (prev.clubAssignments || []).filter((a: any) => a.id !== id);
            return { ...prev, clubAssignments: assignments };
        });
    };

/*
    const handleLicenseAssignmentChange = (id: number, field: string, value: any) => {
        setPlayer((prev: any) => {
            const assignments = (prev.licenseAssignments || []).map((a: any) =>
                a.id === id ? { ...a, [field]: value } : a
            );
            return { ...prev, licenseAssignments: assignments };
        });
    };
    const handleAddLicenseAssignment = () => {
        setPlayer((prev: any) => {
            const base = prev ?? {};
            return {
                ...base,
                licenseAssignments: [
                    ...(base.licenseAssignments || []),
                    { id: null, license: null, startDate: undefined, endDate: undefined }
                ]
            };
        });
    };

    const handleRemoveLicenseAssignment = (id: number) => {
        setPlayer((prev: any) => {
            const assignments = (prev.licenseAssignments || []).filter((a: any) => a.id !== id);
            return { ...prev, licenseAssignments: assignments };
        });
    };
*/

    const handleAddClubAssignment = () => {
        setPlayer((prev: any) => {
            const base = prev ?? {};
            return {
                ...base,
                clubAssignments: [
                    ...(base.clubAssignments || []),
                    { id: null, club: null, startDate: undefined, endDate: undefined }
                ]
            };
        });
    };

    const handleNationalityAssignmentChange = (id: number, field: string, value: any) => {
        setPlayer((prev: any) => {
            const assignments = (prev.nationalityAssignments || []).map((a: any) =>
                a.id === id ? { ...a, [field]: value } : a
            );
            return { ...prev, nationalityAssignments: assignments };
        });
    };

    const handleAddNationalityAssignment = () => {
        setPlayer((prev: any) => {
            const base = prev ?? {};
            return {
                ...base,
                nationalityAssignments: [
                    ...(base.nationalityAssignments || []),
                    { id: null, nationality: null, startDate: undefined, endDate: undefined }
                ]
            };
        });
    };
    const handleRemoveNationalityAssignment = (id: number) => {
        setPlayer((prev: any) => {
            const assignments = (prev.nationalityAssignments || []).filter((a: any) => a.id !== id);
            return { ...prev, nationalityAssignments: assignments };
        });
    };

    const handlePlayerEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
          const url = player.id ? `/api/players/${player.id}` : '/api/players';
          const method = player.id ? 'PUT' : 'POST';
          const res = await apiJson(url, {
            method,
            body: player,
            headers: { 'Content-Type': 'application/json' },
          });

          if (onPlayerSaved) onPlayerSaved(res.player || res.data || player);
          onPlayerEditModalClose();
        } catch (err: any) {
          setError(err?.message || 'Fehler beim Speichern');
        } finally {
          setLoading(false);
        }
    };

    return (
        <>
            <BaseModal
                open={openPlayerEditModal}
                onClose={onPlayerEditModalClose}
                maxWidth="md"
                title={player?.id ? 'Spieler bearbeiten' : 'Spieler anlegen / zuordnen'}
            >
                {loading ? (
                <Box display="flex" alignItems="center" justifyContent="center" minHeight={200}>
                    <CircularProgress />
                </Box>
                ) : (
                <>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2, fontWeight: 'bold', fontSize: '1.1em' }}>
                            {error}
                        </Alert>
                    )}

                    {/* Suche nach bestehendem Spieler – nur beim Neuanlegen */}
                    {showPlayerSearch && (
                        <Box mb={3} p={2} sx={{ bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle1" fontWeight={600} mb={1}>
                                Besteht dieser Spieler bereits?
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Suche nach einem vorhandenen Spieler (auch aus früheren Saisons), um eine neue Team-Zuordnung hinzuzufügen, statt einen Duplikat anzulegen.
                            </Typography>
                            <Box display="flex" gap={1} alignItems="flex-start">
                                <Autocomplete
                                    sx={{ flex: 1 }}
                                    options={playerSearchResults}
                                    getOptionLabel={(option: any) => {
                                        const teams = (option.teamAssignments || [])
                                            .map((a: any) => a.team?.name)
                                            .filter(Boolean)
                                            .join(', ');
                                        const birth = option.birthdate ? ` (Geb.: ${option.birthdate})` : '';
                                        return `${option.firstName} ${option.lastName}${birth}${teams ? ' · ' + teams : ''}`;
                                    }}
                                    filterOptions={(x) => x}
                                    loading={playerSearchLoading}
                                    inputValue={playerSearchQuery}
                                    onInputChange={(_, value) => handlePlayerSearchInput(value)}
                                    onChange={(_, value) => { if (value) handleSelectExistingPlayer(value); }}
                                    noOptionsText={playerSearchQuery.length < 2 ? 'Mind. 2 Zeichen eingeben…' : 'Kein Spieler gefunden'}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Spieler suchen (Name)"
                                            size="small"
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {playerSearchLoading ? <CircularProgress size={16} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                    isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
                                />
                                <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ whiteSpace: 'nowrap', mt: 0.5 }}
                                    onClick={() => { setShowPlayerSearch(false); setPlayer(null); }}
                                >
                                    Neuen Spieler anlegen
                                </Button>
                            </Box>
                        </Box>
                    )}

                    <form id="playerEditForm" autoComplete="off" onSubmit={handlePlayerEditSubmit}>
                        <input type="hidden" name="id" value={player?.id} />
                        <Box className="modal-body" sx={{ bgcolor: 'background.default', p: 0 }}>

                            {/* Hinweis: eingeschränkter Bearbeitungsmodus */}
                            {player?.id && player?.permissions?.canEditStammdaten === false && (
                                <Alert severity="warning" sx={{ mb: 3 }}>
                                    Dieser Spieler gehört auch anderen Teams an. Du kannst nur die Team-Zuordnungen bearbeiten, die deine Teams betreffen. Stammdaten, Verein- und Nationalitäten-Zuordnungen können nur vom zuständigen Verein/Admin geändert werden.
                                </Alert>
                            )}

                            {/* Stammdaten zuerst */}
                            <Box mb={4} pb={2} borderBottom={1} borderColor="divider"
                                sx={player?.permissions?.canEditStammdaten === false ? { opacity: 0.6, pointerEvents: 'none' } : {}}>
                                <Typography variant="h6" color="primary" mb={3} display="flex" alignItems="center">
                                    Stammdaten
                                    {player?.permissions?.canEditStammdaten === false && (
                                        <Chip label="Nur Ansicht" size="small" sx={{ ml: 1 }} />
                                    )}
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={2}>
                                    <Box flex={1} minWidth={250}>
                                        <TextField label="Vorname" name="firstName" value={player?.firstName || ''} onChange={handlePlayerEditChange} required fullWidth margin="normal" />
                                    </Box>
                                    <Box flex={1} minWidth={250}>
                                        <TextField label="Nachname" name="lastName" value={player?.lastName || ''} onChange={handlePlayerEditChange} required fullWidth margin="normal" />
                                    </Box>
                                </Box>
                                <Box display="flex" flexWrap="wrap" gap={2}>
                                    <Box flex={1} minWidth={250}>
                                        <TextField 
                                            label="Geburtsdatum"
                                            name="birthdate"
                                            type="date"
                                            value={player?.birthdate || ''}
                                            onChange={handlePlayerEditChange}
                                            fullWidth
                                            margin="normal"
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Box>
                                    <Box flex={1} minWidth={250}>
                                        <TextField label="E-Mail" name="email" value={player?.email || ''} onChange={handlePlayerEditChange} fullWidth margin="normal" InputProps={{ startAdornment: <InputAdornment position="start">✉️</InputAdornment> }} />
                                    </Box>
                                </Box>
                                <Box display="flex" flexWrap="wrap" gap={2}>
                                    <Box flex={1} minWidth={250}>
                                        <TextField
                                            select
                                            label="Starker Fuß"
                                            value={player?.strongFeet?.id || ''}
                                            onChange={e => {
                                                const id = e.target.value ? parseInt(e.target.value, 10) : '';
                                                setPlayer((prev: any) => ({
                                                    ...prev,
                                                    strongFeet: id ? allStrongFeets.find(f => f.id === id) || { id } : { id: '' }
                                                }));
                                            }}
                                            required
                                            fullWidth
                                            margin="normal"
                                            SelectProps={{ native: true }}
                                            InputLabelProps={{ shrink: true }}
                                        >
                                            <option value="">Starken Fuß wählen...</option>
                                            {allStrongFeets.map(strongFeet => (
                                                <option key={strongFeet.id} value={String(strongFeet.id)}>{strongFeet.name}</option>
                                            ))}
                                        </TextField>
                                    </Box>
                                    <Box flex={1} minWidth={250}>
                                        <TextField
                                            select
                                            label="Hauptposition"
                                            value={player?.mainPosition?.id || ''}
                                            onChange={e => {
                                                const id = e.target.value ? parseInt(e.target.value, 10) : '';
                                                setPlayer((prev: any) => ({
                                                    ...prev,
                                                    mainPosition: id ? allPlayerPositions.find(p => p.id === id) || { id } : { id: '' }
                                                }));
                                            }}
                                            fullWidth
                                            required
                                            margin="normal"
                                            SelectProps={{ native: true }}
                                            InputLabelProps={{ shrink: true }}
                                        >
                                            <option value="">Hauptposition wählen...</option>
                                            {allPlayerPositions.map(position => (
                                                <option key={position.id} value={String(position.id)}>{position.name}</option>
                                            ))}
                                        </TextField>
                                    </Box>
                                </Box>
                                <Box display="flex" flexWrap="wrap" gap={2}>
                                    <Box flex={1} minWidth={250}>
                                        <Autocomplete
                                            multiple
                                            options={allPlayerPositions}
                                            getOptionLabel={option => option.name}
                                            value={player?.alternativePositions || []}
                                            onChange={(_, newValue) => {
                                                setPlayer((prev: any) => ({
                                                    ...prev,
                                                    alternativePositions: newValue
                                                }));
                                            }}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => (
                                                    <Chip label={option.name} {...getTagProps({ index })} key={option.id} />
                                                ))
                                            }
                                            renderInput={params => (
                                                <TextField {...params} label="Alternative Positionen" placeholder="Position(en) wählen..." margin="normal" fullWidth />
                                            )}
                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                            sx={{ minWidth: 250 }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                            <Box mb={4} pb={2} borderBottom={1} borderColor="divider">
                                <Typography variant="h6" color="primary" mb={3} display="flex" alignItems="center">
                                    Zugehörigkeiten
                                </Typography>
                                <Stack spacing={2}>
                                    {/* Verein-Zuordnungen: immer sichtbar, nur bearbeitbar bei voller Berechtigung */}
                                    <Box sx={player?.permissions?.canEditStammdaten === false ? { opacity: 0.75 } : {}}>
                                        <Typography variant="subtitle1" mt={2} mb={1}>Verein-Zuordnungen</Typography>
                                        {(player?.clubAssignments ?? []).map((assignment: any) => (
                                        <Box key={assignment.id} display="flex" gap={2} alignItems="center" mb={1}
                                            sx={player?.permissions?.canEditStammdaten === false ? { pointerEvents: 'none' } : {}}>
                                            <Autocomplete
                                                options={player?.permissions?.canEditStammdaten !== false ? [...allClubs, { id: 'new', name: 'Neuen Verein anlegen...' }] : allClubs}
                                                getOptionLabel={(option) => option.name}
                                                value={assignment.club || null}
                                                onChange={(_, newValue) => {
                                                    if (newValue && (newValue as any).id === 'new') {
                                                        setClubModalId(assignment.id);
                                                        setOpenClubModal(true);
                                                    } else {
                                                        handleClubAssignmentChange(assignment.id, 'club', newValue);
                                                    }
                                                }}
                                                renderOption={(props, option) => {
                                                    if ((option as any).id === 'new') {
                                                        const { key, ...rest } = props;
                                                        return (
                                                            <li key={key} {...rest} style={{ display: 'flex', alignItems: 'center', color: '#1976d2', fontWeight: 500 }}>
                                                                <AddIcon fontSize="small" style={{ marginRight: 8 }} />
                                                                Neuen Verein anlegen...
                                                            </li>
                                                        );
                                                    }
                                                    const { key, ...rest } = props;
                                                    return (
                                                        <li key={key} {...rest}>{option.name}</li>
                                                    );
                                                }}
                                                renderInput={(params) => (
                                                    <TextField {...params} label="Verein" fullWidth margin="normal" required />
                                                )}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                sx={{ minWidth: 180 }}
                                            />
                                            <TextField
                                                label="Start"
                                                type="date"
                                                value={assignment.startDate || ''}
                                                onChange={e => handleClubAssignmentChange(assignment.id, 'startDate', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ minWidth: 120 }}
                                                required
                                            />
                                            <TextField
                                                label="Ende"
                                                type="date"
                                                value={assignment.endDate || ''}
                                                onChange={e => handleClubAssignmentChange(assignment.id, 'endDate', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ minWidth: 120 }}
                                            />
                                            {player?.permissions?.canEditStammdaten !== false && (
                                                <IconButton onClick={() => handleRemoveClubAssignment(assignment.id)} color="error" size="small"><DeleteIcon /></IconButton>
                                            )}
                                        </Box>
                                        ))}
                                        {player?.permissions?.canEditStammdaten !== false && (
                                            <Button onClick={handleAddClubAssignment} startIcon={<AddIcon />} size="small" sx={{ mt: 1 }}>Verein-Zuordnung hinzufügen</Button>
                                        )}
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle1" mt={2} mb={1}>Team-Zuordnungen</Typography>
                                        {(player?.teamAssignments ?? []).map((assignment: any) => {
                                            // canEdit: bei neuen Einträgen (id=null) immer true,
                                            // bei bestehenden kommt das Flag vom Backend
                                            const ptaEditable = assignment.id === null || assignment.canEdit !== false;
                                            return (
                                            <Box key={assignment.id ?? `new-${Math.random()}`}
                                                display="flex" gap={2} alignItems="center" mb={1}
                                                sx={!ptaEditable ? { opacity: 0.55, pointerEvents: 'none' } : {}}>
                                            <Autocomplete
                                                options={allTeams}
                                                getOptionLabel={(option) => option.name}
                                                value={assignment.team || null}
                                                onChange={(_, newValue) => handleTeamAssignmentChange(assignment.id, 'team', newValue)}
                                                renderInput={(params) => (
                                                    <TextField {...params} label="Team" fullWidth margin="normal" required />
                                                )}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                sx={{ minWidth: 180 }}
                                            />
                                            <TextField
                                                select
                                                label="Typ"
                                                value={assignment.type ? String(assignment.type) : ''}
                                                onChange={e => handleTeamAssignmentChange(assignment.id, 'type', e.target.value)}
                                                SelectProps={{ native: true }}
                                                sx={{ minWidth: 140 }}
                                            >
                                                <option value="">Typ wählen...</option>
                                                {allPlayerTeamAssignmentTypes.map(assignmentType => (
                                                    <option key={assignmentType.id} value={String(assignmentType.id)}>{assignmentType.name}</option>
                                                ))}
                                            </TextField>
                                            <Box flex={1} minWidth={80}>
                                                <TextField label="Trikot Nummer" name="shirtNumber" value={assignment.shirtNumber || ''}
                                                    onChange={e => handleTeamAssignmentChange(assignment.id, 'shirtNumber', e.target.value)} fullWidth
                                                    InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }} required
                                            />
                                            </Box>
                                            <TextField
                                                label="Start"
                                                type="date"
                                                value={assignment.startDate || ''}
                                                onChange={e => handleTeamAssignmentChange(assignment.id, 'startDate', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ minWidth: 120 }}
                                                required
                                            />
                                            <TextField
                                                label="Ende"
                                                type="date"
                                                value={assignment.endDate || ''}
                                                onChange={e => handleTeamAssignmentChange(assignment.id, 'endDate', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ minWidth: 120 }}
                                            />
                                            {ptaEditable && (
                                                <IconButton onClick={() => handleRemoveTeamAssignment(assignment.id)} color="error" size="small"><DeleteIcon /></IconButton>
                                            )}
                                        </Box>
                                            );
                                        })}
                                        <Button onClick={handleAddTeamAssignment} startIcon={<AddIcon />} size="small" sx={{ mt: 1 }}>Team-Zuordnung hinzufügen</Button>
                                    </Box>
{/*
                                    <Box>
                                        <Typography variant="subtitle1" mt={2} mb={1}>Lizenzen</Typography>
                                        {(player?.licenseAssignments ?? []).map((assignment: any) => (
                                        <Box key={assignment.id} display="flex" gap={2} alignItems="center" mb={1}>
                                            <Autocomplete
                                                options={[...allLicenses, { id: 'new', name: 'Neue Lizenz anlegen...' }]}
                                                getOptionLabel={(option) => option.name}
                                                value={assignment.license || null}
                                                onChange={(_, newValue) => {
                                                    if (newValue && (newValue as any).id === 'new') {
                                                        setLicenseModalId(assignment.id);
                                                        setOpenLicenseModal(true);
                                                    } else {
                                                        handleLicenseAssignmentChange(assignment.id, 'license', newValue);
                                                    }
                                                }}
                                                renderOption={(props, option) => {
                                                    if ((option as any).id === 'new') {
                                                        const { key, ...rest } = props;
                                                        return (
                                                            <li key={key} {...rest} style={{ display: 'flex', alignItems: 'center', color: '#1976d2', fontWeight: 500 }}>
                                                                <AddIcon fontSize="small" style={{ marginRight: 8 }} /> Neue Lizenz anlegen...
                                                            </li>
                                                        );
                                                    }
                                                    const { key, ...rest } = props;
                                                    return (
                                                        <li key={key} {...rest}>{option.name}</li>
                                                    );
                                                }}
                                                renderInput={(params) => (
                                                    <TextField {...params} label="Lizenz" fullWidth margin="normal" required />
                                                )}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                sx={{ minWidth: 180 }}
                                            />
                                            <TextField
                                                label="Start"
                                                type="date"
                                                value={assignment.startDate || ''}
                                                onChange={e => handleLicenseAssignmentChange(assignment.id, 'startDate', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ minWidth: 120 }}
                                                required
                                            />
                                            <TextField
                                                label="Ende"
                                                type="date"
                                                value={assignment.endDate || ''}
                                                onChange={e => handleLicenseAssignmentChange(assignment.id, 'endDate', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ minWidth: 120 }}
                                            />
                                            <IconButton onClick={() => handleRemoveLicenseAssignment(assignment.id)} color="error" size="small"><DeleteIcon /></IconButton>
                                        </Box>
                                        ))}
                                        <Button onClick={handleAddLicenseAssignment} startIcon={<AddIcon />} size="small" sx={{ mt: 1 }}>Lizenz hinzufügen</Button>
                                    </Box>
*/}
                                    {/* Nationalitäten: immer sichtbar, nur bearbeitbar bei voller Berechtigung */}
                                    <Box sx={player?.permissions?.canEditStammdaten === false ? { opacity: 0.75 } : {}}>
                                        <Typography variant="subtitle1" mt={2} mb={1}>Nationalitäten</Typography>
                                        {(player?.nationalityAssignments ?? []).map((assignment: any) => (
                                        <Box key={assignment.id} display="flex" gap={2} alignItems="center" mb={1}
                                            sx={player?.permissions?.canEditStammdaten === false ? { pointerEvents: 'none' } : {}}>
                                            <Autocomplete
                                                options={player?.permissions?.canEditStammdaten !== false ? [...allNationalities, { id: 'new', name: 'Neue Nationalität anlegen...' }] : allNationalities}
                                                getOptionLabel={(option) => option.name}
                                                value={assignment.nationality || null}
                                                onChange={(_, newValue) => {
                                                    if (newValue && (newValue as any).id === 'new') {
                                                        setNationalityModalId(assignment.id);
                                                        setOpenNationalityModal(true);
                                                    } else {
                                                        handleNationalityAssignmentChange(assignment.id, 'nationality', newValue);
                                                    }
                                                }}
                                                renderOption={(props, option) => {
                                                    if ((option as any).id === 'new') {
                                                        const { key, ...rest } = props;
                                                        return (
                                                            <li key={key} {...rest} style={{ display: 'flex', alignItems: 'center', color: '#1976d2', fontWeight: 500 }}>
                                                                <AddIcon fontSize="small" style={{ marginRight: 8 }} />
                                                                Neue Nationalität anlegen...
                                                            </li>
                                                        );
                                                    }
                                                    const { key, ...rest } = props;
                                                    return (
                                                        <li key={key} {...rest}>{option.name}</li>
                                                    );
                                                }}
                                                renderInput={(params) => (
                                                    <TextField {...params} label="Nationalität" fullWidth margin="normal" required />
                                                )}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                sx={{ minWidth: 180 }}
                                            />
                                            <TextField
                                                label="Start"
                                                type="date"
                                                value={assignment.startDate || ''}
                                                onChange={e => handleNationalityAssignmentChange(assignment.id, 'startDate', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ minWidth: 120 }}
                                                required
                                            />
                                            <TextField
                                                label="Ende"
                                                type="date"
                                                value={assignment.endDate || ''}
                                                onChange={e => handleNationalityAssignmentChange(assignment.id, 'endDate', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ minWidth: 120 }}
                                            />
                                            <IconButton onClick={() => handleRemoveNationalityAssignment(assignment.id)} color="error" size="small">
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                        ))}
                                        {player?.permissions?.canEditStammdaten !== false && (
                                            <Button onClick={handleAddNationalityAssignment} startIcon={<AddIcon />} size="small" sx={{ mt: 1 }}>
                                                Nationalität hinzufügen
                                            </Button>
                                        )}
                                    </Box>
                                </Stack>
                            </Box>
                        </Box>
                        <Box display="flex" justifyContent="flex-end" gap={2} mt={2} mb={1}>
                            <Button onClick={onPlayerEditModalClose} variant="outlined" color="secondary">
                                Abbrechen
                            </Button>
                            <Button type="submit" variant="contained" color="primary" disabled={saving}>
                                {saving ? <CircularProgress size={20} /> : 'Speichern'}
                            </Button>
                        </Box>
                    </form>
                </>
                )}
            </BaseModal>
            <ClubEditModal
                openClubEditModal={openClubModal}
                onClubEditModalClose={() => setOpenClubModal(false)}
                clubId={clubModalId !== null && (player?.clubAssignments ?? []).find((a: any) => a.id === clubModalId)?.club ? (player.clubAssignments ?? []).find((a: any) => a.id === clubModalId).club.id : null}
                onClubSaved={(newClub) => {
                    setAllClubs(prev => [...prev, newClub]);
                    if (clubModalId !== null) {
                        handleClubAssignmentChange(clubModalId, 'club', newClub);
                    }
                    setOpenClubModal(false);
                }}
            />
            {/*
            <PlayerLicenseEditModal
                openPlayerLicenseEditModal={openLicenseModal}
                onPlayerLicenseEditModalClose={() => setOpenLicenseModal(false)}
                playerLicenseId={licenseModalId !== null && (player?.licenseAssignments ?? []).find((a: any) => a.id === licenseModalId)?.license ? (player.licenseAssignments ?? []).find((a: any) => a.id === licenseModalId).license.id : null}
                onPlayerLicenseSaved={(newLicense) => {
                    setAllLicenses(prev => [...prev, newLicense]);
                    if (licenseModalId !== null) {
                        handleLicenseAssignmentChange(licenseModalId, 'license', newLicense);
                    }
                    setOpenLicenseModal(false);
                }}
            />
            */}
            <NationalityEditModal
                openNationalityEditModal={openNationalityModal}
                onNationalityEditModalClose={() => setOpenNationalityModal(false)}
                nationalityId={nationalityModalId !== null && (player?.nationalityAssignments ?? []).find((a: any) => a.id === nationalityModalId)?.nationality ? (player.nationalityAssignments ?? []).find((a: any) => a.id === nationalityModalId).nationality.id : null}
                onNationalitySaved={(newNationality) => {
                    setAllNationalities(prev => [...prev, newNationality]);
                    if (nationalityModalId !== null) {
                        handleNationalityAssignmentChange(nationalityModalId, 'nationality', newNationality);
                    }
                    setOpenNationalityModal(false);
                }}
            />
        </>
    );
};

export default PlayerEditModal;
