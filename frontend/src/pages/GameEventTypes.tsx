import React, { useEffect, useState, useMemo } from 'react';
import SportsIcon from '@mui/icons-material/Sports';
import { Box } from '@mui/material';
import { apiJson } from '../utils/api';
import { AdminPageLayout, AdminEmptyState, AdminTable, AdminActions, AdminSnackbar, AdminTableColumn } from '../components/AdminPageLayout';
import GameEventTypeDeleteConfirmationModal from '../modals/GameEventTypeDeleteConfirmationModal';
import GameEventTypeEditModal from '../modals/GameEventTypeEditModal';
import { GameEventType } from '../types/gameEventType';
import { getGameEventIconByCode } from '../constants/gameEventIcons';

const GameEventTypes = () => {
  const [gameEventTypes, setGameEventTypes] = useState<GameEventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [gameEventTypeId, setGameEventTypeId] = useState<number | null>(null);
  const [gameEventTypeEditModalOpen, setGameEventTypeEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteGameEventType, setDeleteGameEventType] = useState<GameEventType | null>(null);
  const [snackbar, setSnackbar] = useState<AdminSnackbar>({ open: false, message: '', severity: 'success' });

  const loadGameEventTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson<{ gameEventTypes: GameEventType[] }>('/api/game-event-types');
      setGameEventTypes(res && Array.isArray(res.gameEventTypes) ? res.gameEventTypes : []);
    } catch {
      setError('Fehler beim Laden der Spielereignistypen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGameEventTypes(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await apiJson(`/api/game-event-types/${id}`, { method: 'DELETE' });
      setGameEventTypes(prev => prev.filter(c => c.id !== id));
      setDeleteModalOpen(false);
      setSnackbar({ open: true, message: 'Spielereignistyp gelöscht', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Löschen.', severity: 'error' });
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return gameEventTypes;
    const q = search.toLowerCase();
    return gameEventTypes.filter(g => (g.name || '').toLowerCase().includes(q) || (g.code || '').toLowerCase().includes(q));
  }, [gameEventTypes, search]);

  const columns: AdminTableColumn<GameEventType>[] = [
    { header: 'Name', render: g => (
      <Box component="span" sx={{ color: g.color, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        {getGameEventIconByCode(g.icon)}{g.name}
      </Box>
    )},
    { header: 'Code', render: g => g.code || '', width: 120 },
  ];

  return (
    <AdminPageLayout
      icon={<SportsIcon />}
      title="Spielereignistypen"
      itemCount={gameEventTypes.length}
      loading={loading}
      error={error}
      createLabel="Neuer Spielereignistyp"
      onCreate={() => { setGameEventTypeId(null); setGameEventTypeEditModalOpen(true); }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Ereignistyp suchen..."
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar(s => ({ ...s, open: false }))}
    >
      {filtered.length === 0 ? (
        <AdminEmptyState icon={<SportsIcon />} title="Keine Spielereignistypen vorhanden" createLabel="Neuer Spielereignistyp" onCreate={() => { setGameEventTypeId(null); setGameEventTypeEditModalOpen(true); }} />
      ) : (
        <AdminTable columns={columns} data={filtered} getKey={g => g.id}
          renderActions={g => (
            <AdminActions
              onEdit={g.permissions?.canEdit ? () => { setGameEventTypeId(g.id); setGameEventTypeEditModalOpen(true); } : undefined}
              onDelete={g.permissions?.canDelete ? () => { setDeleteGameEventType(g); setDeleteModalOpen(true); } : undefined}
            />
          )}
        />
      )}

      <GameEventTypeEditModal openGameEventTypeEditModal={gameEventTypeEditModalOpen} gameEventTypeId={gameEventTypeId} onGameEventTypeEditModalClose={() => setGameEventTypeEditModalOpen(false)} onGameEventTypeSaved={() => { setGameEventTypeEditModalOpen(false); loadGameEventTypes(); }} />
      <GameEventTypeDeleteConfirmationModal open={deleteModalOpen} gameEventTypeName={deleteGameEventType?.name} onClose={() => setDeleteModalOpen(false)} onConfirm={async () => handleDelete(deleteGameEventType!.id)} />
    </AdminPageLayout>
  );
};

export default GameEventTypes;
