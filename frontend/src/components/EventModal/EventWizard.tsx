import React, { useState, useCallback, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import { EventData, SelectOption, User } from '../../types/event';
import { useEventTypeFlags } from '../../hooks/useEventTypeFlags';
import {
  WizardStep0,
  WizardStep1,
  WizardStep2Tournament,
  WizardStep2Permissions,
  WizardStepDescription,
  WizardStepSummary,
} from './WizardSteps';
import ImportMatchesDialog from '../../modals/ImportMatchesDialog';
import ManualMatchesEditor from '../../modals/ManualMatchesEditor';
import TournamentMatchGeneratorDialog from '../../modals/TournamentMatchGeneratorDialog';
import { apiRequest } from '../../utils/api';

// --- Step label constants ---
const STEP_BASE = 'Basisdaten';
const STEP_DETAILS = 'Details';
const STEP_MATCHES = 'Begegnungen';
const STEP_PERMISSIONS = 'Berechtigungen';
const STEP_DESCRIPTION = 'Beschreibung';
const STEP_SUMMARY = 'Zusammenfassung';

interface EventWizardProps {
  open: boolean;
  onClose: () => void;
  formData: EventData;
  eventTypes: SelectOption[];
  locations: SelectOption[];
  teams: SelectOption[];
  gameTypes: SelectOption[];
  leagues: SelectOption[];
  cups: SelectOption[];
  tournaments: SelectOption[];
  users: User[];
  tournamentMatches: any[];
  setTournamentMatches: (matches: any[]) => void;
  onChange: (field: string, value: any) => void;
  syncDraftsToParent: (matches?: any[]) => void;
}

/**
 * Event creation/editing wizard with step-by-step guidance.
 *
 * Steps are dynamically computed based on event type:
 * - Match events (Spiel/Turnier): Basisdaten → Details → Begegnungen → Beschreibung → Zusammenfassung
 * - Match events (non-tournament): Basisdaten → Details → Beschreibung → Zusammenfassung
 * - Task events:                   Basisdaten → Details → Beschreibung → Zusammenfassung
 * - Generic events:                Basisdaten → Details → Berechtigungen → Beschreibung → Zusammenfassung
 */
export const EventWizard: React.FC<EventWizardProps> = ({
  open,
  onClose,
  formData,
  eventTypes,
  locations,
  teams,
  gameTypes,
  leagues,
  cups,
  tournaments,
  users,
  tournamentMatches,
  setTournamentMatches,
  onChange,
  syncDraftsToParent,
}) => {
  // Single source of truth for event type flags — computed from formData
  const { isMatchEvent, isTournament, isTournamentEventType, isTask, isGenericEvent } = useEventTypeFlags(
    formData.eventType, formData.gameType, eventTypes, gameTypes,
  );

  const [wizardStep, setWizardStep] = useState(0);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [editingMatchId, setEditingMatchId] = useState<string | number | null>(null);
  const [editingMatchDraft, setEditingMatchDraft] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);

  // Reset wizard state when dialog opens
  React.useEffect(() => {
    if (open) {
      setWizardStep(0);
      setWizardError(null);
      setEditingMatchId(null);
      setEditingMatchDraft(null);
    }
  }, [open]);

  // --- Dynamic step computation (label-based, not index-based) ---
  const steps = useMemo(() => {
    const s = [STEP_BASE, STEP_DETAILS];
    if (isTournament) s.push(STEP_MATCHES);
    if (isGenericEvent) s.push(STEP_PERMISSIONS);
    s.push(STEP_DESCRIPTION, STEP_SUMMARY);
    return s;
  }, [isTournament, isGenericEvent]);

  const currentStepLabel = steps[wizardStep];
  const summaryStepIndex = steps.indexOf(STEP_SUMMARY);

  // --- Validation ---
  const validateStep = useCallback((step: number): boolean => {
    setWizardError(null);
    const label = steps[step];

    if (label === STEP_BASE) {
      if (!formData.title || !formData.eventType || !formData.date) {
        setWizardError('Bitte Titel, Event-Typ und Start-Datum angeben!');
        return false;
      }
    }

    if (label === STEP_DETAILS) {
      if (isMatchEvent) {
        if (!isTournament && (!formData.homeTeam || !formData.awayTeam)) {
          setWizardError('Bitte Heim- und Auswärts-Team angeben!');
          return false;
        }
        if (!formData.locationId) {
          setWizardError('Bitte Austragungsort auswählen!');
          return false;
        }
      }
      if (isTask) {
        if (!formData.taskRotationUsers || formData.taskRotationUsers.length === 0) {
          setWizardError('Bitte mindestens einen Benutzer für die Rotation auswählen!');
          return false;
        }
        if (!formData.taskRotationCount || formData.taskRotationCount < 1) {
          setWizardError('Bitte eine gültige Anzahl Personen pro Aufgabe angeben!');
          return false;
        }
        if (formData.taskIsRecurring) {
          if (!formData.taskRecurrenceMode) {
            setWizardError('Bitte Wiederkehr-Modus wählen!');
            return false;
          }
          if (formData.taskRecurrenceMode === 'classic' && (!formData.taskFreq || !formData.taskInterval)) {
            setWizardError('Bitte Frequenz und Intervall angeben!');
            return false;
          }
        }
      }
    }

    if (label === STEP_PERMISSIONS) {
      if (!formData.permissionType) {
        setWizardError('Bitte eine Sichtbarkeit wählen!');
        return false;
      }
    }

    return true;
  }, [steps, formData, isMatchEvent, isTournament, isTask]);

  const handleNext = () => {
    if (!validateStep(wizardStep)) return;
    setWizardStep(prev => prev + 1);
  };

  const handleBack = () => {
    setWizardError(null);
    setWizardStep(prev => Math.max(prev - 1, 0));
  };

  // --- Tournament match management ---
  const handleAddMatch = useCallback(() => {
    const newDraft = {
      id: `draft-${Date.now()}`,
      round: '', slot: '', homeTeamId: '', awayTeamId: '',
      homeTeamName: '', awayTeamName: '', scheduledAt: '',
    };
    const updated = [...(tournamentMatches || []), newDraft];
    setTournamentMatches(updated);
    setEditingMatchId(newDraft.id);
    setEditingMatchDraft(newDraft);
    syncDraftsToParent(updated);
  }, [tournamentMatches, setTournamentMatches, syncDraftsToParent]);

  const handleEditMatch = useCallback((match: any) => {
    setEditingMatchId(match.id);
    setEditingMatchDraft({ ...match });
  }, []);

  const handleSaveMatch = useCallback(async () => {
    if (!editingMatchDraft) return;

    const updated = (tournamentMatches || []).map((x: any) =>
      x.id === editingMatchDraft.id ? { ...x, ...editingMatchDraft } : x
    );
    setTournamentMatches(updated);
    syncDraftsToParent(updated);
    setEditingMatchId(null);
    setEditingMatchDraft(null);

    // Persist changes for existing tournament matches
    if (formData.tournamentId && !String(editingMatchDraft.id).startsWith('draft-')) {
      try {
        await apiRequest(`/api/tournaments/${formData.tournamentId}/matches/${editingMatchDraft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingMatchDraft),
        });
        const res = await apiRequest(`/api/tournaments/${formData.tournamentId}/matches`);
        const data = await res.json();
        setTournamentMatches(data || []);
      } catch { /* ignore */ }
    }
  }, [editingMatchDraft, tournamentMatches, formData.tournamentId, setTournamentMatches, syncDraftsToParent]);

  const handleCancelEdit = useCallback(() => {
    setEditingMatchId(null);
    setEditingMatchDraft(null);
  }, []);

  const handleDeleteMatch = useCallback(async (matchId: string | number) => {
    if (String(matchId).startsWith('draft-')) {
      const updated = (tournamentMatches || []).filter((x: any) => x.id !== matchId);
      setTournamentMatches(updated);
      syncDraftsToParent(updated);
      return;
    }
    if (!formData.tournamentId) return;
    try {
      await apiRequest(`/api/tournaments/${formData.tournamentId}/matches/${matchId}`, { method: 'DELETE' });
      const res = await apiRequest(`/api/tournaments/${formData.tournamentId}/matches`);
      const data = await res.json();
      setTournamentMatches(data || []);
    } catch { /* ignore */ }
  }, [tournamentMatches, formData.tournamentId, setTournamentMatches, syncDraftsToParent]);

  // --- Draft match helpers ---
  const applyDraftMatches = useCallback((payload: any[]) => {
    onChange('pendingTournamentMatches', payload);
    setTournamentMatches(
      payload.map((m: any, idx: number) => ({
        id: `draft-${idx}`, ...m,
        homeTeamName: teams.find(t => String(t.value) === String(m.homeTeamId))?.label || m.homeTeamName || '',
        awayTeamName: teams.find(t => String(t.value) === String(m.awayTeamId))?.label || m.awayTeamName || '',
      }))
    );
  }, [onChange, setTournamentMatches, teams]);

  const reloadMatchesFromServer = useCallback(async () => {
    if (!formData.tournamentId) return;
    try {
      const res = await apiRequest(`/api/tournaments/${formData.tournamentId}/matches`);
      if (res.ok) setTournamentMatches(await res.json() || []);
    } catch { /* ignore */ }
  }, [formData.tournamentId, setTournamentMatches]);

  const handleImportClose = useCallback(async (payload?: any[]) => {
    setImportOpen(false);
    if (!formData.tournamentId) {
      if (payload?.length) applyDraftMatches(payload);
      return;
    }
    await reloadMatchesFromServer();
  }, [formData.tournamentId, applyDraftMatches, reloadMatchesFromServer]);

  const handleManualClose = useCallback(async (payload?: any[]) => {
    setManualOpen(false);
    if (formData.tournamentId) {
      await reloadMatchesFromServer();
      return;
    }
    if (payload?.length) applyDraftMatches(payload);
  }, [formData.tournamentId, applyDraftMatches, reloadMatchesFromServer]);

  const handleGeneratorClose = useCallback((matches: any[], config?: { gameMode?: string; tournamentType?: string; roundDuration?: number; breakTime?: number; numberOfGroups?: number }) => {
    applyDraftMatches(matches);
    // Sync tournament config back to formData
    if (config) {
      if (config.gameMode) onChange('tournamentGameMode', config.gameMode);
      if (config.tournamentType) onChange('tournamentType', config.tournamentType);
      if (config.roundDuration !== undefined) onChange('tournamentRoundDuration', config.roundDuration);
      if (config.breakTime !== undefined) onChange('tournamentBreakTime', config.breakTime);
      if (config.numberOfGroups !== undefined) onChange('tournamentNumberOfGroups', config.numberOfGroups);
    }
    setGeneratorOpen(false);
  }, [applyDraftMatches, onChange]);

  const handleClearMatches = useCallback(() => {
    onChange('pendingTournamentMatches', []);
    setTournamentMatches([]);
  }, [onChange, setTournamentMatches]);

  // --- Step content rendering (label-based, not index-based) ---
  const getStepContent = () => {
    switch (currentStepLabel) {
      case STEP_BASE:
        return (
          <WizardStep0
            formData={formData}
            eventTypes={eventTypes}
            locations={locations}
            onChange={onChange}
          />
        );

      case STEP_DETAILS:
        return (
          <WizardStep1
            formData={formData}
            locations={locations}
            teams={teams}
            gameTypes={gameTypes}
            leagues={leagues}
            cups={cups}
            tournaments={tournaments}
            users={users}
            isMatchEvent={isMatchEvent}
            isTournament={isTournament}
            isTournamentEventType={isTournamentEventType}
            isTask={isTask}
            onChange={onChange}
            tournamentMatches={tournamentMatches}
            onImportOpen={() => setImportOpen(true)}
            onManualOpen={() => setManualOpen(true)}
            onGeneratorOpen={() => setGeneratorOpen(true)}
            onClearMatches={handleClearMatches}
          />
        );

      case STEP_MATCHES:
        return (
          <WizardStep2Tournament
            tournamentMatches={tournamentMatches}
            teams={teams}
            editingMatchId={editingMatchId}
            editingMatchDraft={editingMatchDraft}
            onAddMatch={handleAddMatch}
            onEditMatch={handleEditMatch}
            onSaveMatch={handleSaveMatch}
            onCancelEdit={handleCancelEdit}
            onDeleteMatch={handleDeleteMatch}
            setEditingMatchDraft={setEditingMatchDraft}
          />
        );

      case STEP_PERMISSIONS:
        return (
          <WizardStep2Permissions
            formData={formData}
            teams={teams}
            users={users}
            onChange={onChange}
          />
        );

      case STEP_DESCRIPTION:
        return <WizardStepDescription formData={formData} onChange={onChange} />;

      case STEP_SUMMARY:
        return (
          <WizardStepSummary
            formData={formData}
            eventTypes={eventTypes}
            locations={locations}
            teams={teams}
            gameTypes={gameTypes}
            leagues={leagues}
            tournaments={tournaments}
            users={users}
            tournamentMatches={tournamentMatches}
            isMatchEvent={isMatchEvent}
            isTournament={isTournament}
            isTask={isTask}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Event Wizard
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={wizardStep} alternativeLabel>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <div style={{ marginTop: 32 }}>
          {wizardError && <div style={{ color: 'red', marginBottom: 12 }}>{wizardError}</div>}
          {getStepContent()}
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleBack} disabled={wizardStep === 0}>
          Zurück
        </Button>
        {wizardStep < summaryStepIndex ? (
          <Button onClick={handleNext} color="primary">Weiter</Button>
        ) : (
          <Button onClick={onClose} color="success">Fertig</Button>
        )}
      </DialogActions>

      {/* Tournament match management dialogs */}
      {importOpen && (
        <ImportMatchesDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          tournamentId={formData.tournamentId}
          initialMatches={tournamentMatches}
          onImported={handleImportClose}
        />
      )}
      {manualOpen && (
        <ManualMatchesEditor
          open={manualOpen}
          onClose={() => setManualOpen(false)}
          tournamentId={formData.tournamentId}
          teams={teams}
          matchTeams={formData.teamIds}
          initialMatches={tournamentMatches}
          gameMode={formData.tournamentGameMode || 'round_robin'}
          roundDuration={formData.tournamentRoundDuration || 10}
          breakTime={formData.tournamentBreakTime || 2}
          onSaved={handleManualClose}
        />
      )}
      {generatorOpen && (
        <TournamentMatchGeneratorDialog
          open={generatorOpen}
          onClose={() => setGeneratorOpen(false)}
          teams={teams}
          matchTeams={formData.teamIds}
          tournament={formData.tournament}
          initialMatches={tournamentMatches}
          startDate={formData.date}
          startTime={formData.time}
          initialGameMode={formData.tournamentGameMode || 'round_robin'}
          initialTournamentType={formData.tournamentType || 'indoor_hall'}
          initialRoundDuration={formData.tournamentRoundDuration || 10}
          initialBreakTime={formData.tournamentBreakTime || 2}
          initialNumberOfGroups={formData.tournamentNumberOfGroups || 2}
          onGenerate={handleGeneratorClose}
        />
      )}
    </Dialog>
  );
};
