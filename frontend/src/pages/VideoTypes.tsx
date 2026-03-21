import React, { useEffect, useState, useMemo } from 'react';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { apiJson } from '../utils/api';
import { AdminPageLayout, AdminEmptyState, AdminTable, AdminActions, AdminSnackbar, AdminTableColumn } from '../components/AdminPageLayout';
import VideoTypeDeleteConfirmationModal from '../modals/VideoTypeDeleteConfirmationModal';
import VideoTypeEditModal from '../modals/VideoTypeEditModal';
import { VideoType } from '../types/videoType';

const VideoTypes = () => {
  const [videoTypes, setVideoTypes] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [videoTypeId, setVideoTypeId] = useState<number | null>(null);
  const [videoTypeEditModalOpen, setVideoTypeEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteVideoType, setDeleteVideoType] = useState<VideoType | null>(null);
  const [snackbar, setSnackbar] = useState<AdminSnackbar>({ open: false, message: '', severity: 'success' });

  const loadVideoTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson<{ videoTypes: VideoType[] }>('/api/video-types');
      setVideoTypes(res && Array.isArray(res.videoTypes) ? res.videoTypes : []);
    } catch {
      setError('Fehler beim Laden der Videotypen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVideoTypes(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await apiJson(`/api/video-types/${id}`, { method: 'DELETE' });
      setVideoTypes(prev => prev.filter(vt => vt.id !== id));
      setDeleteModalOpen(false);
      setSnackbar({ open: true, message: 'Videotyp gelöscht', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Löschen.', severity: 'error' });
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return videoTypes;
    const q = search.toLowerCase();
    return videoTypes.filter(v => (v.name || '').toLowerCase().includes(q) || (v.createdFrom?.fullName || '').toLowerCase().includes(q));
  }, [videoTypes, search]);

  const columns: AdminTableColumn<VideoType>[] = [
    { header: 'Name', render: v => v.name || '' },
    { header: 'Sortierung', render: v => v.sort ?? '', width: 100, align: 'center' },
    { header: 'Erstellt von', render: v => v.createdFrom?.fullName || '' },
    { header: 'Erstellt am', render: v => v.createdAt ? new Date(v.createdAt).toLocaleDateString('de-DE') : '', width: 130 },
  ];

  return (
    <AdminPageLayout
      icon={<VideoLibraryIcon />}
      title="Videotypen"
      itemCount={videoTypes.length}
      loading={loading}
      error={error}
      createLabel="Neuer Videotyp"
      onCreate={() => { setVideoTypeId(null); setVideoTypeEditModalOpen(true); }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Videotyp suchen..."
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar(s => ({ ...s, open: false }))}
    >
      {filtered.length === 0 ? (
        <AdminEmptyState icon={<VideoLibraryIcon />} title="Keine Videotypen vorhanden" createLabel="Neuer Videotyp" onCreate={() => { setVideoTypeId(null); setVideoTypeEditModalOpen(true); }} />
      ) : (
        <AdminTable columns={columns} data={filtered} getKey={v => v.id}
          renderActions={v => (
            <AdminActions
              onEdit={v.permissions?.canEdit ? () => { setVideoTypeId(v.id); setVideoTypeEditModalOpen(true); } : undefined}
              onDelete={v.permissions?.canDelete ? () => { setDeleteVideoType(v); setDeleteModalOpen(true); } : undefined}
            />
          )}
        />
      )}

      <VideoTypeEditModal openVideoTypeEditModal={videoTypeEditModalOpen} videoTypeId={videoTypeId} onVideoTypeEditModalClose={() => setVideoTypeEditModalOpen(false)} onVideoTypeSaved={() => { setVideoTypeEditModalOpen(false); loadVideoTypes(); }} />
      <VideoTypeDeleteConfirmationModal open={deleteModalOpen} videoTypeName={deleteVideoType?.name} onClose={() => setDeleteModalOpen(false)} onConfirm={async () => handleDelete(deleteVideoType!.id)} />
    </AdminPageLayout>
  );
};

export default VideoTypes;
