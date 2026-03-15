import React from 'react';
import {
  Button, Box, Typography, Alert, CircularProgress, TextField, MenuItem, Chip, Tooltip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import BaseModal from './BaseModal';
import { useFormationEditor } from './formation/useFormationEditor';
import TemplatePicker from './formation/components/TemplatePicker';
import PlayerToken from './formation/components/PlayerToken';
import Bench from './formation/components/Bench';
import SquadList from './formation/components/SquadList';
import type { FormationEditModalProps } from './formation/types';

const FormationEditModal: React.FC<FormationEditModalProps> = ({ open, formationId, onClose, onSaved }) => {
  const editor = useFormationEditor(open, formationId, onClose, onSaved);

  // ── Active player IDs (on field + bench) for greying out in squad list ──────
  const activeIds = new Set([
    ...editor.players.map(p => p.playerId),
    ...editor.benchPlayers.map(p => p.playerId),
  ]);

  const backgroundImage = `url(/images/formation/${
    editor.formation?.formationType?.backgroundPath ?? 'fussballfeld_haelfte.jpg'
  })`;

  // ── Template picker (first step for new formations) ──────────────────────────
  if (editor.showTemplatePicker) {
    return (
      <TemplatePicker
        open={open}
        onClose={onClose}
        onSelectTemplate={editor.applyTemplate}
        onSkip={() => editor.setShowTemplatePicker(false)}
      />
    );
  }

  // ── Main editor ──────────────────────────────────────────────────────────────
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={formationId ? 'Aufstellung bearbeiten' : 'Neue Aufstellung'}
      maxWidth="lg"
      actions={
        <>
          <Button onClick={onClose} variant="outlined" color="secondary">Abbrechen</Button>
          <Button onClick={editor.handleSave} variant="contained" color="primary" disabled={editor.loading}>
            {editor.loading ? 'Speichern…' : 'Speichern'}
          </Button>
        </>
      }
    >
      {editor.loading && (
        <Box display="flex" justifyContent="center" mb={2}><CircularProgress /></Box>
      )}
      {editor.error && (
        <Alert severity="error" sx={{ mb: 2 }}>{editor.error}</Alert>
      )}

      {/* Name + Team */}
      <Box display="flex" gap={2} mb={2} mt={1}>
        <TextField
          label="Name der Aufstellung"
          value={editor.name}
          onChange={e => editor.setName(e.target.value)}
          fullWidth required
        />
        <TextField
          label="Team" select
          value={editor.selectedTeam}
          onChange={e => editor.setSelectedTeam(Number(e.target.value))}
          fullWidth required
        >
          {editor.teams.length > 0
            ? editor.teams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)
            : <MenuItem value="" disabled>Keine Teams verfügbar</MenuItem>
          }
        </TextField>
      </Box>

      {/* ── Auto-fill banner: shown when placeholders exist and squad is loaded ───── */}
      {editor.hasPlaceholders && editor.availablePlayers.length > 0 && (
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2, py: 1.25, mb: 2,
            borderRadius: 2,
            bgcolor: theme => theme.palette.mode === 'dark'
              ? 'rgba(99,179,237,0.1)'
              : 'rgba(33,150,243,0.07)',
            border: '1px solid',
            borderColor: 'primary.200',
          }}
        >
          <AutoAwesomeIcon fontSize="small" color="primary" sx={{ flexShrink: 0 }} />
          <Box flex={1} minWidth={0}>
            <Typography variant="body2" fontWeight={600} color="primary.main" lineHeight={1.25}>
              Spieler automatisch einsetzen
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {editor.placeholderCount} {editor.placeholderCount === 1 ? 'Platzhalter' : 'Platzhalter'} auf dem Feld
              {' · '}
              {editor.availablePlayers.length} {editor.availablePlayers.length === 1 ? 'Spieler' : 'Spieler'} im Kader
            </Typography>
          </Box>
          <Chip
            label={`${editor.placeholderCount} offen`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}
          />
          <Tooltip title="Ersetzt alle Platzhalter mit echten Spielern aus dem Kader. Position und Koordinaten bleiben erhalten. übrige Spieler kommen auf die Bank.">
            <Button
              variant="contained"
              size="small"
              startIcon={<GroupAddIcon />}
              onClick={editor.fillWithTeamPlayers}
              sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              Team einsetzen
            </Button>
          </Tooltip>
        </Box>
      )}

      <Box display="flex" gap={2} alignItems="flex-start" sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
        {/* ── Pitch + Bench ──────────────────────────────────────────────────── */}
        <Box sx={{ flex: { xs: 'none', md: 2 }, width: '100%', minWidth: 0 }}>

          {/* Half-pitch – outer wrapper enforces portrait 960:1357 aspect ratio */}
          <Box sx={{
            width: '100%',
            aspectRatio: '960 / 1357',
            maxHeight: { xs: 420, md: 560 },
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: 3,
          }}>
          {/* Inner pitch – fills wrapper 100%, background covers it exactly */}
          <Box
            ref={editor.pitchRef}
            sx={{
              width: '100%',
              height: '100%',
              backgroundImage,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              bgcolor: '#2a5c27',
              position: 'relative',
              cursor: editor.draggedPlayerId ? 'grabbing' : editor.squadDragPlayer ? 'copy' : 'default',
              userSelect: 'none',
              // Subtle glow overlay while squad-player is being dragged over the pitch
              outline: editor.squadDragPlayer ? '3px dashed rgba(255,255,255,0.5)' : 'none',
              outlineOffset: '-4px',
              transition: 'outline 0.15s',
            }}
            onMouseMove={editor.handlePitchMouseMove}
            onMouseUp={editor.handlePitchMouseUp}
            onMouseLeave={editor.handlePitchMouseUp}
            onTouchMove={editor.handlePitchTouchMove}
            onTouchEnd={editor.handlePitchTouchEnd}
            onDragOver={editor.handlePitchDragOver}
            onDrop={editor.handlePitchDrop}
          >
            {/* Zone labels – portrait field: top-anchored */}
            {[
              { label: 'ANGRIFF',    top: '5%'  },
              { label: 'MITTELFELD', top: '38%' },
              { label: 'ABWEHR',     top: '63%' },
            ].map(z => (
              <Typography key={z.label} variant="caption" sx={{
                position: 'absolute', top: z.top, left: '50%', transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: 3,
                fontSize: '0.6rem', pointerEvents: 'none',
              }}>
                {z.label}
              </Typography>
            ))}

            {/* Player tokens */}
            {editor.players.map(player => (
              <PlayerToken
                key={player.id}
                player={player}
                isDragging={editor.draggedPlayerId === player.id}
                isHighlighted={editor.highlightedTokenId === player.id}
                onMouseDown={e => editor.startDragFromField(player.id, e)}
                onTouchStart={e => editor.startDragFromField(player.id, e)}
              />
            ))}
          </Box>
          </Box>{/* end aspect-ratio wrapper */}

          {/* Ersatzbank */}
          <Bench
            benchPlayers={editor.benchPlayers}
            onSendToField={editor.sendToField}
            onRemove={editor.removeBenchPlayer}
            onMouseDown={(id, e) => editor.startDragFromBench(id, e)}
            onTouchStart={(id, e) => editor.startDragFromBench(id, e)}
          />
        </Box>

        {/* ── Right panel ────────────────────────────────────────────────────── */}
        <SquadList
          availablePlayers={editor.availablePlayers}
          searchQuery={editor.searchQuery}
          onSearchChange={editor.setSearchQuery}
          activePlayerIds={activeIds}
          onAddToField={p => editor.addPlayerToFormation(p, 'field')}
          onAddToBench={p => editor.addPlayerToFormation(p, 'bench')}
          onAddGeneric={editor.addGenericPlayer}
          onSquadDragStart={editor.handleSquadDragStart}
          onSquadDragEnd={editor.handleSquadDragEnd}
          fieldPlayers={editor.players}
          onRemoveFromField={editor.removePlayer}
          onSendToBench={editor.sendToBench}
          notes={editor.notes}
          onNotesChange={editor.setNotes}
        />
      </Box>
    </BaseModal>
  );
};

export default FormationEditModal;
