/**
 * useFormationSave
 *
 * Verantwortlich für:
 * - Formation speichern (POST auf /formation/new bzw. /formation/{id}/edit)
 * - Fehler- und Ladezustand setzen
 * - Erfolgsmeldung anzeigen und Modal schließen
 */
import { apiJson } from '../../utils/api';
import type { Formation, FormationData, PlayerData } from './types';

interface UseFormationSaveParams {
  formation: Formation | null;
  players: PlayerData[];
  benchPlayers: PlayerData[];
  notes: string;
  name: string;
  selectedTeam: number | '';
  formationId: number | null;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onClose: () => void;
  onSaved?: (formation: Formation) => void;
}

export function useFormationSave({
  formation,
  players,
  benchPlayers,
  notes,
  name,
  selectedTeam,
  formationId,
  setLoading,
  setError,
  showToast,
  onClose,
  onSaved,
}: UseFormationSaveParams) {
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const formationData: FormationData = {
        ...(formation?.formationData ?? {}),
        players,
        bench: benchPlayers,
        notes,
      };
      const url = formationId ? `/formation/${formationId}/edit` : '/formation/new';
      const response = await apiJson(url, {
        method: 'POST',
        body: { name, team: selectedTeam, formationData },
      });
      if (response?.error) {
        setError(response.error);
        return;
      }
      showToast('Formation erfolgreich gespeichert!', 'success');
      const saved: Formation = response?.formation ?? {
        id: response?.id ?? Date.now(),
        name,
        formationType: {
          name: formation?.formationType?.name ?? 'fußball',
          cssClass: formation?.formationType?.cssClass ?? '',
          backgroundPath: formation?.formationType?.backgroundPath ?? 'fussballfeld_haelfte.jpg',
        },
        formationData,
      };
      onSaved?.(saved);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return { handleSave };
}
