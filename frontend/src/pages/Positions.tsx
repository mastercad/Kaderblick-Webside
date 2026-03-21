import React, { useEffect, useState, useMemo } from 'react';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { apiJson } from '../utils/api';
import { AdminPageLayout, AdminEmptyState, AdminTable, AdminActions, AdminSnackbar, AdminTableColumn } from '../components/AdminPageLayout';
import PositionDeleteConfirmationModal from '../modals/PositionDeleteConfirmationModal';
import PositionEditModal from '../modals/PositionEditModal';
import { Position } from '../types/position';

const Positions = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [positionId, setPositionId] = useState<number | null>(null);
  const [positionEditModalOpen, setPositionEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePosition, setDeletePosition] = useState<Position | null>(null);
  const [snackbar, setSnackbar] = useState<AdminSnackbar>({ open: false, message: '', severity: 'success' });

  const loadPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson<{ positions: Position[] }>('/api/positions');
      setPositions(res && Array.isArray(res.positions) ? res.positions : []);
    } catch {
      setError('Fehler beim Laden der Positionen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPositions(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await apiJson(`/api/positions/${id}`, { method: 'DELETE' });
      setPositions(prev => prev.filter(c => c.id !== id));
      setDeleteModalOpen(false);
      setSnackbar({ open: true, message: 'Position gelöscht', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Löschen der Position.', severity: 'error' });
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return positions;
    const q = search.toLowerCase();
    return positions.filter(p => (p.name || '').toLowerCase().includes(q) || (p.shortName || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
  }, [positions, search]);

  const columns: AdminTableColumn<Position>[] = [
    { header: 'Name', render: p => p.name || '' },
    { header: 'Code', render: p => p.shortName || '', width: 100 },
    { header: 'Beschreibung', render: p => p.description || '' },
  ];

  return (
    <AdminPageLayout
      icon={<CenterFocusStrongIcon />}
      title="Positionen"
      itemCount={positions.length}
      loading={loading}
      error={error}
      createLabel="Neue Position"
      onCreate={() => { setPositionId(null); setPositionEditModalOpen(true); }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Position suchen..."
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar(s => ({ ...s, open: false }))}
    >
      {filtered.length === 0 ? (
        <AdminEmptyState icon={<CenterFocusStrongIcon />} title="Keine Positionen vorhanden" createLabel="Neue Position" onCreate={() => { setPositionId(null); setPositionEditModalOpen(true); }} />
      ) : (
        <AdminTable columns={columns} data={filtered} getKey={p => p.id}
          renderActions={p => (
            <AdminActions
              onEdit={p.permissions?.canEdit ? () => { setPositionId(p.id); setPositionEditModalOpen(true); } : undefined}
              onDelete={p.permissions?.canDelete ? () => { setDeletePosition(p); setDeleteModalOpen(true); } : undefined}
            />
          )}
        />
      )}

      <PositionEditModal openPositionEditModal={positionEditModalOpen} positionId={positionId} onPositionEditModalClose={() => setPositionEditModalOpen(false)} onPositionSaved={() => { setPositionEditModalOpen(false); loadPositions(); }} />
      <PositionDeleteConfirmationModal open={deleteModalOpen} positionName={deletePosition?.name} onClose={() => setDeleteModalOpen(false)} onConfirm={async () => handleDelete(deletePosition!.id)} />
    </AdminPageLayout>
  );
};

export default Positions;
