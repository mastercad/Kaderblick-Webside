import React, { useEffect, useState, useMemo } from 'react';
import VideocamIcon from '@mui/icons-material/Videocam';
import { apiJson } from '../utils/api';
import { AdminPageLayout, AdminEmptyState, AdminTable, AdminActions, AdminSnackbar, AdminTableColumn } from '../components/AdminPageLayout';
import CameraDeleteConfirmationModal from '../modals/CameraDeleteConfirmationModal';
import CameraEditModal from '../modals/CameraEditModal';
import { Camera } from '../types/camera';

const Cameras = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cameraId, setCameraId] = useState<number | null>(null);
  const [cameraEditModalOpen, setCameraEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteCamera, setDeleteCamera] = useState<Camera | null>(null);
  const [snackbar, setSnackbar] = useState<AdminSnackbar>({ open: false, message: '', severity: 'success' });

  const loadCameras = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson<{ cameras: Camera[] }>('/api/cameras');
      setCameras(res && Array.isArray(res.cameras) ? res.cameras : []);
    } catch {
      setError('Fehler beim Laden der Kameras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCameras(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await apiJson(`/api/cameras/${id}`, { method: 'DELETE' });
      setCameras(prev => prev.filter(c => c.id !== id));
      setDeleteModalOpen(false);
      setSnackbar({ open: true, message: 'Kamera gelöscht', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fehler beim Löschen der Kamera.', severity: 'error' });
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return cameras;
    const q = search.toLowerCase();
    return cameras.filter(c => (c.name || '').toLowerCase().includes(q) || (c.createdFrom?.fullName || '').toLowerCase().includes(q));
  }, [cameras, search]);

  const columns: AdminTableColumn<Camera>[] = [
    { header: 'Name', render: c => c.name || '' },
    { header: 'Erstellt von', render: c => c.createdFrom?.fullName || '' },
    { header: 'Erstellt am', render: c => c.createdAt ? new Date(c.createdAt).toLocaleDateString('de-DE') : '', width: 130 },
  ];

  return (
    <AdminPageLayout
      icon={<VideocamIcon />}
      title="Kameras"
      itemCount={cameras.length}
      loading={loading}
      error={error}
      createLabel="Neue Kamera"
      onCreate={() => { setCameraId(null); setCameraEditModalOpen(true); }}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Kamera suchen..."
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar(s => ({ ...s, open: false }))}
    >
      {filtered.length === 0 ? (
        <AdminEmptyState icon={<VideocamIcon />} title="Keine Kameras vorhanden" createLabel="Neue Kamera" onCreate={() => { setCameraId(null); setCameraEditModalOpen(true); }} />
      ) : (
        <AdminTable columns={columns} data={filtered} getKey={c => c.id}
          renderActions={c => (
            <AdminActions
              onEdit={c.permissions?.canEdit ? () => { setCameraId(c.id); setCameraEditModalOpen(true); } : undefined}
              onDelete={c.permissions?.canDelete ? () => { setDeleteCamera(c); setDeleteModalOpen(true); } : undefined}
            />
          )}
        />
      )}

      <CameraEditModal openCameraEditModal={cameraEditModalOpen} cameraId={cameraId} onCameraEditModalClose={() => setCameraEditModalOpen(false)} onCameraSaved={() => { setCameraEditModalOpen(false); loadCameras(); }} />
      <CameraDeleteConfirmationModal open={deleteModalOpen} cameraName={deleteCamera?.name} onClose={() => setDeleteModalOpen(false)} onConfirm={async () => handleDelete(deleteCamera!.id)} />
    </AdminPageLayout>
  );
};

export default Cameras;
