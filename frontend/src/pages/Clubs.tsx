import React, { useEffect, useState, useCallback, useRef } from 'react';
import ShieldIcon from '@mui/icons-material/Shield';
import { apiJson } from '../utils/api';
import { AdminPageLayout, AdminEmptyState, AdminTable, AdminActions, AdminSnackbar, AdminTableColumn } from '../components/AdminPageLayout';
import ClubDetailsModal from '../modals/ClubDetailsModal';
import ClubDeleteConfirmationModal from '../modals/ClubDeleteConfirmationModal';
import ClubEditModal from '../modals/ClubEditModal';
import { Club } from '../types/club';

interface PaginatedClubsResponse {
  clubs: Club[];
  total: number;
  page: number;
  limit: number;
}

const Clubs = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [clubId, setClubId] = useState<number | null>(null);
  const [clubDetailsModalOpen, setClubDetailsModalOpen] = useState(false);
  const [clubEditModalOpen, setClubEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteClub, setDeleteClub] = useState<Club | null>(null);
  const [snackbar, setSnackbar] = useState<AdminSnackbar>({ open: false, message: '', severity: 'success' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 350);
  }, []);

  const loadClubs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await apiJson<PaginatedClubsResponse>(`/clubs?${params}`);
      setClubs(res?.clubs || []);
      setTotalCount(res?.total || 0);
    } catch {
      setError('Fehler beim Laden der Vereine.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch]);

  useEffect(() => { loadClubs(); }, [loadClubs]);

  const handleDelete = async (id: number) => {
    try {
      await apiJson(`/clubs/${id}/delete`, { method: 'DELETE' });
      setDeleteModalOpen(false);
      setSnackbar({ open: true, message: 'Verein gelöscht', severity: 'success' });
      loadClubs();
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Löschen des Vereins.', severity: 'error' });
    }
  };

  const columns: AdminTableColumn<Club>[] = [
    { header: 'Name', render: c => c.name || '' },
    { header: 'Stadion', render: c => c.stadiumName || '' },
    { header: 'Website', render: c => c.website || '' },
  ];

  return (
    <AdminPageLayout
      icon={<ShieldIcon />}
      title="Vereine"
      itemCount={totalCount}
      loading={loading}
      error={error}
      createLabel="Neuer Verein"
      onCreate={() => { setClubId(null); setClubEditModalOpen(true); }}
      search={search}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Verein suchen..."
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar(s => ({ ...s, open: false }))}
    >
      {clubs.length === 0 && !loading ? (
        <AdminEmptyState icon={<ShieldIcon />} title="Keine Vereine vorhanden" createLabel="Neuer Verein" onCreate={() => { setClubId(null); setClubEditModalOpen(true); }} />
      ) : (
        <AdminTable columns={columns} data={clubs} getKey={c => c.id}
          serverPagination={{
            page,
            rowsPerPage,
            totalCount,
            onPageChange: setPage,
            onRowsPerPageChange: setRowsPerPage,
          }}
          onRowClick={c => { setClubId(c.id); setClubDetailsModalOpen(true); }}
          renderActions={c => (
            <AdminActions
              onDetails={() => { setClubId(c.id); setClubDetailsModalOpen(true); }}
              onEdit={c.permissions?.canEdit ? () => { setClubId(c.id); setClubEditModalOpen(true); } : undefined}
              onDelete={c.permissions?.canDelete ? () => { setDeleteClub(c); setDeleteModalOpen(true); } : undefined}
            />
          )}
        />
      )}

      <ClubDetailsModal open={clubDetailsModalOpen} loadClubs={() => loadClubs()} clubId={clubId} onClose={() => setClubDetailsModalOpen(false)} />
      <ClubEditModal openClubEditModal={clubEditModalOpen} clubId={clubId} onClubEditModalClose={() => setClubEditModalOpen(false)} onClubSaved={() => { setClubEditModalOpen(false); loadClubs(); }} />
      <ClubDeleteConfirmationModal open={deleteModalOpen} clubName={deleteClub?.name} onClose={() => setDeleteModalOpen(false)} onConfirm={async () => handleDelete(deleteClub!.id)} />
    </AdminPageLayout>
  );
};

export default Clubs;
