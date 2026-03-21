import React, { useEffect, useState, useMemo } from 'react';
import GrassIcon from '@mui/icons-material/Grass';
import { apiJson } from '../utils/api';
import { AdminPageLayout, AdminEmptyState, AdminTable, AdminActions, AdminSnackbar, AdminTableColumn } from '../components/AdminPageLayout';
import SurfaceTypeDeleteConfirmationModal from '../modals/SurfaceTypeDeleteConfirmationModal';
import SurfaceTypeEditModal from '../modals/SurfaceTypeEditModal';
import { SurfaceType } from '../types/surfaceType';

const SurfaceTypes = () => {
  const [surfaceTypes, setSurfaceTypes] = useState<SurfaceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [surfaceTypeId, setSurfaceTypeId] = useState<number | null>(null);
  const [surfaceTypeEditModalOpen, setSurfaceTypeEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSurfaceType, setDeleteSurfaceType] = useState<SurfaceType | null>(null);
  const [snackbar, setSnackbar] = useState<AdminSnackbar>({ open: false, message: '', severity: 'success' });

  const loadSurfaceTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson<{ surfaceTypes: SurfaceType[] }>('/api/surface-types');
      setSurfaceTypes(res && Array.isArray(res.surfaceTypes) ? res.surfaceTypes : []);
    } catch {
      setError('Fehler beim Laden der Oberflächenarten.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSurfaceTypes(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await apiJson(`/api/surface-types/${id}`, { method: 'DELETE' });
      setSurfaceTypes(prev => prev.filter(c => c.id !== id));
      setDeleteModalOpen(false);
      setSnackbar({ open: true, message: 'Oberflächenart gelöscht', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Löschen der Oberflächenart.', severity: 'error' });
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return surfaceTypes;
    const q = search.toLowerCase();
    return surfaceTypes.filter(s => (s.name || '').toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q));
  }, [surfaceTypes, search]);

  const columns: AdminTableColumn<SurfaceType>[] = [
    { header: 'Name', render: s => s.name || '' },
    { header: 'Beschreibung', render: s => s.description || '' },
  ];

  return (
    <AdminPageLayout
      icon={<GrassIcon />}
      title="Oberflächenarten"
      itemCount={surfaceTypes.length}
      loading={loading}
      error={error}
      createLabel="Neue Oberflächenart"
      onCreate={() => { setSurfaceTypeId(null); setSurfaceTypeEditModalOpen(true); }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Oberflächenart suchen..."
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar(s => ({ ...s, open: false }))}
    >
      {filtered.length === 0 ? (
        <AdminEmptyState icon={<GrassIcon />} title="Keine Oberflächenarten vorhanden" createLabel="Neue Oberflächenart" onCreate={() => { setSurfaceTypeId(null); setSurfaceTypeEditModalOpen(true); }} />
      ) : (
        <AdminTable columns={columns} data={filtered} getKey={s => s.id}
          renderActions={s => (
            <AdminActions
              onEdit={s.permissions?.canEdit ? () => { setSurfaceTypeId(s.id); setSurfaceTypeEditModalOpen(true); } : undefined}
              onDelete={s.permissions?.canDelete ? () => { setDeleteSurfaceType(s); setDeleteModalOpen(true); } : undefined}
            />
          )}
        />
      )}

      <SurfaceTypeEditModal openSurfaceTypeEditModal={surfaceTypeEditModalOpen} surfaceTypeId={surfaceTypeId} onSurfaceTypeEditModalClose={() => setSurfaceTypeEditModalOpen(false)} onSurfaceTypeSaved={() => { setSurfaceTypeEditModalOpen(false); loadSurfaceTypes(); }} />
      <SurfaceTypeDeleteConfirmationModal open={deleteModalOpen} surfaceTypeName={deleteSurfaceType?.name} onClose={() => setDeleteModalOpen(false)} onConfirm={async () => handleDelete(deleteSurfaceType!.id)} />
    </AdminPageLayout>
  );
};

export default SurfaceTypes;
