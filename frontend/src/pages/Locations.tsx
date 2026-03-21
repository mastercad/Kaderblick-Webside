import React, { useEffect, useState, useMemo } from 'react';
import PlaceIcon from '@mui/icons-material/Place';
import LocationEditModal, { LocationFormValues } from '../modals/LocationEditModal';
import { DynamicConfirmationModal } from '../modals/DynamicConfirmationModal';
import { apiJson } from '../utils/api';
import { Location } from '../types/location';
import { SurfaceType } from '../types/surfaceType';
import { AdminPageLayout, AdminEmptyState, AdminTable, AdminActions, AdminSnackbar, AdminTableColumn } from '../components/AdminPageLayout';

const Locations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [surfaceTypes, setSurfaceTypes] = useState<SurfaceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editInitialValues, setEditInitialValues] = useState<LocationFormValues | undefined>(undefined);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<AdminSnackbar>({ open: false, message: '', severity: 'success' });

  const loadLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson('/api/locations');
      setLocations(res.locations || []);
      setSurfaceTypes(res.surfaceTypes || []);
    } catch {
      setError('Fehler beim Laden der Spielstätten.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLocations(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return locations;
    const q = search.toLowerCase();
    return locations.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.address?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q)
    );
  }, [locations, search]);

  const openEdit = (location?: Location) => {
    if (location) {
      setEditInitialValues({
        id: location.id,
        name: location.name,
        address: location.address || '',
        city: location.city || '',
        latitude: location.latitude ?? '',
        longitude: location.longitude ?? '',
        capacity: location.capacity ?? '',
        surfaceTypeId: location.surfaceTypeId ?? location.surfaceType?.id ?? 0,
        hasFloodlight: location.hasFloodlight ?? false,
        facilities: location.facilities ?? '',
      });
    } else {
      setEditInitialValues(undefined);
    }
    setEditModalOpen(true);
  };

  const columns: AdminTableColumn<Location>[] = [
    { header: 'Name', render: l => l.name || '' },
    { header: 'Adresse', render: l => l.address || '' },
    { header: 'Stadt', render: l => l.city || '' },
    { header: 'Latitude', render: l => l.latitude ?? '', width: '120px' },
    { header: 'Longitude', render: l => l.longitude ?? '', width: '120px' },
  ];

  return (
    <AdminPageLayout
      icon={<PlaceIcon />}
      title="Spielstätten"
      itemCount={locations.length}
      loading={loading}
      error={error}
      createLabel="Neue Spielstätte"
      onCreate={() => openEdit()}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Spielstätten suchen..."
      snackbar={snackbar}
      onSnackbarClose={() => setSnackbar(s => ({ ...s, open: false }))}
    >
      {filtered.length === 0 ? (
        <AdminEmptyState icon={<PlaceIcon />} title="Keine Spielstätten vorhanden" createLabel="Neue Spielstätte" onCreate={() => openEdit()} />
      ) : (
        <AdminTable columns={columns} data={filtered} getKey={l => l.id}
          renderActions={l => (
            <AdminActions
              onEdit={l.permissions?.canEdit ? () => openEdit(l) : undefined}
              onDelete={l.permissions?.canDelete ? () => { setDeleteTarget(l); setDeleteModalOpen(true); } : undefined}
            />
          )}
        />
      )}

      <LocationEditModal
        openLocationEditModal={editModalOpen}
        onLocationEditModalClose={() => setEditModalOpen(false)}
        initialValues={editInitialValues}
        isEdit={!!editInitialValues}
        surfaceTypes={surfaceTypes}
        onSaved={() => {
          setEditModalOpen(false);
          setSnackbar({ open: true, message: editInitialValues ? 'Spielstätte aktualisiert' : 'Spielstätte erstellt', severity: 'success' });
          loadLocations();
        }}
      />
      <DynamicConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleteLoading(true);
          try {
            await apiJson(`/locations/delete/${deleteTarget.id}`, { method: 'DELETE' });
            setLocations(prev => prev.filter(l => l.id !== deleteTarget.id));
            setDeleteModalOpen(false);
            setDeleteTarget(null);
            setSnackbar({ open: true, message: 'Spielstätte gelöscht', severity: 'success' });
          } catch {
            setSnackbar({ open: true, message: 'Fehler beim Löschen der Spielstätte.', severity: 'error' });
          } finally {
            setDeleteLoading(false);
          }
        }}
        title="Löschen bestätigen"
        message={`Möchtest du die Spielstätte "${deleteTarget?.name}" wirklich löschen?`}
        confirmText="Löschen"
        confirmColor="error"
        loading={deleteLoading}
      />
    </AdminPageLayout>
  );
};

export default Locations;
