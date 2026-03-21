import React, { useEffect, useState, useMemo } from 'react';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { apiJson } from '../utils/api';
import { AdminPageLayout, AdminEmptyState, AdminTable, AdminActions, AdminSnackbar, AdminTableColumn } from '../components/AdminPageLayout';
import StrongFeetDeleteConfirmationModal from '../modals/StrongFeetDeleteConfirmationModal';
import StrongFeetEditModal from '../modals/StrongFeetEditModal';
import { StrongFeet } from '../types/strongFeet';

const StrongFeets = () => {
  const [strongFeets, setStrongFeets] = useState<StrongFeet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [strongFeetId, setStrongFeetId] = useState<number | null>(null);
  const [strongFeetEditModalOpen, setStrongFeetEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStrongFeet, setDeleteStrongFeet] = useState<StrongFeet | null>(null);
  const [snackbar, setSnackbar] = useState<AdminSnackbar>({ open: false, message: '', severity: 'success' });

  const loadStrongFeets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson<{ strongFeets: StrongFeet[] }>('/api/strong-feet');
      setStrongFeets(res && Array.isArray(res.strongFeets) ? res.strongFeets : []);
    } catch {
      setError('Fehler beim Laden der starken Füße.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStrongFeets(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await apiJson(`/api/strong-feet/${id}`, { method: 'DELETE' });
      setStrongFeets(prev => prev.filter(c => c.id !== id));
      setDeleteModalOpen(false);
      setSnackbar({ open: true, message: 'Starker Fuß gelöscht', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Löschen.', severity: 'error' });
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return strongFeets;
    const q = search.toLowerCase();
    return strongFeets.filter(s => (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q));
  }, [strongFeets, search]);

  const columns: AdminTableColumn<StrongFeet>[] = [
    { header: 'Name', render: s => s.name || '' },
    { header: 'Code', render: s => s.code || '', width: 120 },
  ];

  return (
    <AdminPageLayout
      icon={<DirectionsRunIcon />}
      title="Starke Füße"
      itemCount={strongFeets.length}
      loading={loading}
      error={error}
      createLabel="Neuer starker Fuß"
      onCreate={() => { setStrongFeetId(null); setStrongFeetEditModalOpen(true); }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Suchen..."
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar(s => ({ ...s, open: false }))}
    >
      {filtered.length === 0 ? (
        <AdminEmptyState icon={<DirectionsRunIcon />} title="Keine starken Füße vorhanden" createLabel="Neuer starker Fuß" onCreate={() => { setStrongFeetId(null); setStrongFeetEditModalOpen(true); }} />
      ) : (
        <AdminTable columns={columns} data={filtered} getKey={s => s.id}
          renderActions={s => (
            <AdminActions
              onEdit={s.permissions?.canEdit ? () => { setStrongFeetId(s.id); setStrongFeetEditModalOpen(true); } : undefined}
              onDelete={s.permissions?.canDelete ? () => { setDeleteStrongFeet(s); setDeleteModalOpen(true); } : undefined}
            />
          )}
        />
      )}

      <StrongFeetEditModal openStrongFeetEditModal={strongFeetEditModalOpen} strongFeetId={strongFeetId} onStrongFeetEditModalClose={() => setStrongFeetEditModalOpen(false)} onStrongFeetSaved={() => { setStrongFeetEditModalOpen(false); loadStrongFeets(); }} />
      <StrongFeetDeleteConfirmationModal open={deleteModalOpen} positionName={deleteStrongFeet?.name} onClose={() => setDeleteModalOpen(false)} onConfirm={async () => handleDelete(deleteStrongFeet!.id)} />
    </AdminPageLayout>
  );
};

export default StrongFeets;
