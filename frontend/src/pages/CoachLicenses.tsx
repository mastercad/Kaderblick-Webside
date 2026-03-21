import React, { useEffect, useState, useMemo } from 'react';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import { apiJson } from '../utils/api';
import { AdminPageLayout, AdminEmptyState, AdminTable, AdminActions, AdminSnackbar, AdminTableColumn } from '../components/AdminPageLayout';
import CoachLicenseDeleteConfirmationModal from '../modals/CoachLicenseDeleteConfirmationModal';
import CoachLicenseEditModal from '../modals/CoachLicenseEditModal';
import { CoachLicense } from '../types/coachLicense';

const CoachLicenses = () => {
  const [coachLicenses, setCoachLicenses] = useState<CoachLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [coachLicenseId, setCoachLicenseId] = useState<number | null>(null);
  const [coachLicenseEditModalOpen, setCoachLicenseEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteCoachLicense, setDeleteCoachLicense] = useState<CoachLicense | null>(null);
  const [snackbar, setSnackbar] = useState<AdminSnackbar>({ open: false, message: '', severity: 'success' });

  const loadCoachLicenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson<{ coachLicenses: CoachLicense[] }>('/api/coach-licenses');
      setCoachLicenses(res && Array.isArray(res.coachLicenses) ? res.coachLicenses : []);
    } catch {
      setError('Fehler beim Laden der Trainerlizenzen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCoachLicenses(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await apiJson(`/api/coach-licenses/${id}`, { method: 'DELETE' });
      setCoachLicenses(prev => prev.filter(c => c.id !== id));
      setDeleteModalOpen(false);
      setSnackbar({ open: true, message: 'Trainerlizenz gelöscht', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Löschen.', severity: 'error' });
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return coachLicenses;
    const q = search.toLowerCase();
    return coachLicenses.filter(c => (c.name || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q) || (c.countryCode || '').toLowerCase().includes(q));
  }, [coachLicenses, search]);

  const columns: AdminTableColumn<CoachLicense>[] = [
    { header: 'Name', render: c => c.name || '' },
    { header: 'Beschreibung', render: c => c.description || '' },
    { header: 'Länder Code', render: c => c.countryCode || '', width: 120 },
  ];

  return (
    <AdminPageLayout
      icon={<CardMembershipIcon />}
      title="Trainerlizenzen"
      itemCount={coachLicenses.length}
      loading={loading}
      error={error}
      createLabel="Neue Trainerlizenz"
      onCreate={() => { setCoachLicenseId(null); setCoachLicenseEditModalOpen(true); }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Lizenz suchen..."
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar(s => ({ ...s, open: false }))}
    >
      {filtered.length === 0 ? (
        <AdminEmptyState icon={<CardMembershipIcon />} title="Keine Trainerlizenzen vorhanden" createLabel="Neue Trainerlizenz" onCreate={() => { setCoachLicenseId(null); setCoachLicenseEditModalOpen(true); }} />
      ) : (
        <AdminTable columns={columns} data={filtered} getKey={c => c.id}
          renderActions={c => (
            <AdminActions
              onEdit={c.permissions?.canEdit ? () => { setCoachLicenseId(c.id); setCoachLicenseEditModalOpen(true); } : undefined}
              onDelete={c.permissions?.canDelete ? () => { setDeleteCoachLicense(c); setDeleteModalOpen(true); } : undefined}
            />
          )}
        />
      )}

      <CoachLicenseEditModal openCoachLicenseEditModal={coachLicenseEditModalOpen} coachLicenseId={coachLicenseId} onCoachLicenseEditModalClose={() => setCoachLicenseEditModalOpen(false)} onCoachLicenseSaved={() => { setCoachLicenseEditModalOpen(false); loadCoachLicenses(); }} />
      <CoachLicenseDeleteConfirmationModal open={deleteModalOpen} coachLicenseName={deleteCoachLicense?.name} onClose={() => setDeleteModalOpen(false)} onConfirm={async () => handleDelete(deleteCoachLicense!.id)} />
    </AdminPageLayout>
  );
};

export default CoachLicenses;
