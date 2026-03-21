import React, { useEffect, useState, useMemo } from 'react';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { apiJson } from '../utils/api';
import { AdminPageLayout, AdminEmptyState, AdminTable, AdminActions, AdminSnackbar, AdminTableColumn } from '../components/AdminPageLayout';
import LeagueDeleteConfirmationModal from '../modals/LeagueDeleteConfirmationModal';
import LeagueEditModal from '../modals/LeagueEditModal';
import { League } from '../types/league';

const Leagues = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [leagueEditModalOpen, setLeagueEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLeague, setDeleteLeague] = useState<League | null>(null);
  const [snackbar, setSnackbar] = useState<AdminSnackbar>({ open: false, message: '', severity: 'success' });

  const loadLeagues = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson<{ leagues: League[] }>('/api/leagues');
      setLeagues(res && Array.isArray(res.leagues) ? res.leagues : []);
    } catch {
      setError('Fehler beim Laden der Ligen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeagues(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await apiJson(`/api/leagues/${id}`, { method: 'DELETE' });
      setLeagues(prev => prev.filter(c => c.id !== id));
      setDeleteModalOpen(false);
      setSnackbar({ open: true, message: 'Liga gelöscht', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Löschen der Liga.', severity: 'error' });
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return leagues;
    const q = search.toLowerCase();
    return leagues.filter(l => (l.name || '').toLowerCase().includes(q));
  }, [leagues, search]);

  const columns: AdminTableColumn<League>[] = [
    { header: 'Name', render: l => l.name || '' },
  ];

  return (
    <AdminPageLayout
      icon={<EmojiEventsIcon />}
      title="Ligen"
      itemCount={leagues.length}
      loading={loading}
      error={error}
      createLabel="Neue Liga"
      onCreate={() => { setLeagueId(null); setLeagueEditModalOpen(true); }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Liga suchen..."
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar(s => ({ ...s, open: false }))}
    >
      {filtered.length === 0 ? (
        <AdminEmptyState icon={<EmojiEventsIcon />} title="Keine Ligen vorhanden" createLabel="Neue Liga" onCreate={() => { setLeagueId(null); setLeagueEditModalOpen(true); }} />
      ) : (
        <AdminTable columns={columns} data={filtered} getKey={l => l.id}
          renderActions={l => (
            <AdminActions
              onEdit={l.permissions?.canEdit ? () => { setLeagueId(l.id); setLeagueEditModalOpen(true); } : undefined}
              onDelete={l.permissions?.canDelete ? () => { setDeleteLeague(l); setDeleteModalOpen(true); } : undefined}
            />
          )}
        />
      )}

      <LeagueEditModal openLeagueEditModal={leagueEditModalOpen} leagueId={leagueId} onLeagueEditModalClose={() => setLeagueEditModalOpen(false)} onLeagueSaved={() => { setLeagueEditModalOpen(false); loadLeagues(); }} />
      <LeagueDeleteConfirmationModal open={deleteModalOpen} leagueName={deleteLeague?.name} onClose={() => setDeleteModalOpen(false)} onConfirm={async () => handleDelete(deleteLeague!.id)} />
    </AdminPageLayout>
  );
};

export default Leagues;
