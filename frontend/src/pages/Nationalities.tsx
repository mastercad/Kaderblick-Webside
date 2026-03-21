import React, { useEffect, useState, useMemo } from 'react';
import PublicIcon from '@mui/icons-material/Public';
import { apiJson } from '../utils/api';
import { AdminPageLayout, AdminEmptyState, AdminTable, AdminActions, AdminSnackbar, AdminTableColumn } from '../components/AdminPageLayout';
import NationalityDeleteConfirmationModal from '../modals/NationalityDeleteConfirmationModal';
import NationalityEditModal from '../modals/NationalityEditModal';
import { Nationality } from '../types/nationality';

const Nationalities = () => {
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [nationalityId, setNationalityId] = useState<number | null>(null);
  const [nationalityEditModalOpen, setNationalityEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteNationality, setDeleteNationality] = useState<Nationality | null>(null);
  const [snackbar, setSnackbar] = useState<AdminSnackbar>({ open: false, message: '', severity: 'success' });

  const loadNationalities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson<{ nationalities: Nationality[] }>('/api/nationalities');
      setNationalities(res && Array.isArray(res.nationalities) ? res.nationalities : []);
    } catch {
      setError('Fehler beim Laden der Nationalitäten.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNationalities(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await apiJson(`/api/nationalities/${id}`, { method: 'DELETE' });
      setNationalities(prev => prev.filter(c => c.id !== id));
      setDeleteModalOpen(false);
      setSnackbar({ open: true, message: 'Nationalität gelöscht', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Löschen.', severity: 'error' });
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return nationalities;
    const q = search.toLowerCase();
    return nationalities.filter(n => (n.name || '').toLowerCase().includes(q) || (n.isoCode || '').toLowerCase().includes(q));
  }, [nationalities, search]);

  const columns: AdminTableColumn<Nationality>[] = [
    { header: 'Name', render: n => n.name || '' },
    { header: 'ISO Code', render: n => n.isoCode || '', width: 120 },
  ];

  return (
    <AdminPageLayout
      icon={<PublicIcon />}
      title="Nationalitäten"
      itemCount={nationalities.length}
      loading={loading}
      error={error}
      createLabel="Neue Nationalität"
      onCreate={() => { setNationalityId(null); setNationalityEditModalOpen(true); }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Nationalität suchen..."
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar(s => ({ ...s, open: false }))}
    >
      {filtered.length === 0 ? (
        <AdminEmptyState icon={<PublicIcon />} title="Keine Nationalitäten vorhanden" createLabel="Neue Nationalität" onCreate={() => { setNationalityId(null); setNationalityEditModalOpen(true); }} />
      ) : (
        <AdminTable columns={columns} data={filtered} getKey={n => n.id}
          renderActions={n => (
            <AdminActions
              onEdit={n.permissions?.canEdit ? () => { setNationalityId(n.id); setNationalityEditModalOpen(true); } : undefined}
              onDelete={n.permissions?.canDelete ? () => { setDeleteNationality(n); setDeleteModalOpen(true); } : undefined}
            />
          )}
        />
      )}

      <NationalityEditModal openNationalityEditModal={nationalityEditModalOpen} nationalityId={nationalityId} onNationalityEditModalClose={() => setNationalityEditModalOpen(false)} onNationalitySaved={() => { setNationalityEditModalOpen(false); loadNationalities(); }} />
      <NationalityDeleteConfirmationModal open={deleteModalOpen} nationalityName={deleteNationality?.name} onClose={() => setDeleteModalOpen(false)} onConfirm={async () => handleDelete(deleteNationality!.id)} />
    </AdminPageLayout>
  );
};

export default Nationalities;
