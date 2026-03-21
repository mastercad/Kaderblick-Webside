import React, { useEffect, useState, useMemo } from 'react';
import GroupsIcon from '@mui/icons-material/Groups';
import { apiJson } from '../utils/api';
import { AdminPageLayout, AdminEmptyState, AdminTable, AdminActions, AdminSnackbar, AdminTableColumn } from '../components/AdminPageLayout';
import AgeGroupDetailsModal from '../modals/AgeGroupDetailsModal';
import AgeGroupDeleteConfirmationModal from '../modals/AgeGroupDeleteConfirmationModal';
import AgeGroupEditModal from '../modals/AgeGroupEditModal';
import { AgeGroup } from '../types/ageGroup';

const AgeGroups = () => {
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ageGroupId, setAgeGroupId] = useState<number | null>(null);
  const [ageGroupDetailsModalOpen, setAgeGroupDetailsModalOpen] = useState(false);
  const [ageGroupEditModalOpen, setAgeGroupEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteAgeGroup, setDeleteAgeGroup] = useState<AgeGroup | null>(null);
  const [snackbar, setSnackbar] = useState<AdminSnackbar>({ open: false, message: '', severity: 'success' });

  const loadAgeGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson<{ ageGroups: AgeGroup[] }>('/api/age-groups');
      setAgeGroups(res && Array.isArray(res.ageGroups) ? res.ageGroups : []);
    } catch {
      setError('Fehler beim Laden der Altersgruppen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAgeGroups(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await apiJson(`/api/age-groups/${id}`, { method: 'DELETE' });
      setAgeGroups(prev => prev.filter(c => c.id !== id));
      setDeleteModalOpen(false);
      setSnackbar({ open: true, message: 'Altersgruppe gelöscht', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Löschen der Altersgruppe.', severity: 'error' });
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return ageGroups;
    const q = search.toLowerCase();
    return ageGroups.filter(a => (a.name || '').toLowerCase().includes(q) || (a.englishName || '').toLowerCase().includes(q));
  }, [ageGroups, search]);

  const columns: AdminTableColumn<AgeGroup>[] = [
    { header: 'Name', render: a => a.name || '' },
    { header: 'Bezeichnung', render: a => a.englishName || '' },
    { header: 'Min. Alter', render: a => a.minAge ?? '', align: 'center', width: 100 },
    { header: 'Max. Alter', render: a => a.maxAge ?? '', align: 'center', width: 100 },
  ];

  return (
    <AdminPageLayout
      icon={<GroupsIcon />}
      title="Altersgruppen"
      itemCount={ageGroups.length}
      loading={loading}
      error={error}
      createLabel="Neue Altersgruppe"
      onCreate={() => { setAgeGroupId(null); setAgeGroupEditModalOpen(true); }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Altersgruppe suchen..."
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar(s => ({ ...s, open: false }))}
    >
      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={<GroupsIcon />}
          title="Keine Altersgruppen vorhanden"
          description="Erstelle eine Altersgruppe, um Teams zuzuordnen."
          createLabel="Neue Altersgruppe"
          onCreate={() => { setAgeGroupId(null); setAgeGroupEditModalOpen(true); }}
        />
      ) : (
        <AdminTable
          columns={columns}
          data={filtered}
          getKey={a => a.id}
          onRowClick={a => { setAgeGroupId(a.id); setAgeGroupDetailsModalOpen(true); }}
          renderActions={a => (
            <AdminActions
              onEdit={a.permissions?.canEdit ? () => { setAgeGroupId(a.id); setAgeGroupEditModalOpen(true); } : undefined}
              onDelete={a.permissions?.canDelete ? () => { setDeleteAgeGroup(a); setDeleteModalOpen(true); } : undefined}
              onDetails={() => { setAgeGroupId(a.id); setAgeGroupDetailsModalOpen(true); }}
            />
          )}
        />
      )}

      <AgeGroupDetailsModal
        ageGroupDetailOpen={ageGroupDetailsModalOpen}
        loadAgeGroups={() => loadAgeGroups()}
        ageGroupId={ageGroupId}
        onClose={() => setAgeGroupDetailsModalOpen(false)}
      />
      <AgeGroupEditModal
        openAgeGroupEditModal={ageGroupEditModalOpen}
        ageGroupId={ageGroupId}
        onAgeGroupEditModalClose={() => setAgeGroupEditModalOpen(false)}
        onAgeGroupSaved={() => { setAgeGroupEditModalOpen(false); loadAgeGroups(); }}
      />
      <AgeGroupDeleteConfirmationModal
        open={deleteModalOpen}
        ageGroupName={deleteAgeGroup?.name}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async () => handleDelete(deleteAgeGroup!.id)}
      />
    </AdminPageLayout>
  );
};

export default AgeGroups;
