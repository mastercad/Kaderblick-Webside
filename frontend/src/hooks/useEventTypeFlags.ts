import { useMemo } from 'react';
import { SelectOption } from '../types/event';

/**
 * Simplified event type classification.
 *
 * Replaces the old 4+ overlapping boolean flags with 3 clean categories:
 *
 * - isMatchEvent: Event involves teams/matches (CalendarEventType "Spiel" OR "Turnier")
 * - isTournament: Tournament mode (CalendarEventType "Turnier" OR GameType "Turnier" within "Spiel")
 * - isTask:       Task event (CalendarEventType "Aufgabe")
 * - isGenericEvent: None of the above — shows permissions step
 *
 * BUG FIX: "Turnier" event type and "Spiel" + GameType "Turnier" now produce
 * identical flags (isMatchEvent=true, isTournament=true), ensuring identical rendering.
 */
export interface EventTypeFlags {
  /** Event involves teams/matches — CalendarEventType is "Spiel" or "Turnier" */
  isMatchEvent: boolean;
  /** Tournament mode — CalendarEventType "Turnier" OR GameType "Turnier" within "Spiel" */
  isTournament: boolean;
  /** CalendarEventType itself is "Turnier" (not "Spiel" + "Turnierspiel") — hides GameType dropdown */
  isTournamentEventType: boolean;
  /** Task event — CalendarEventType is "Aufgabe" */
  isTask: boolean;
  /** Training event — CalendarEventType is "Training" */
  isTraining: boolean;
  /** Generic event — none of the above, shows permissions */
  isGenericEvent: boolean;
}

/** Case-insensitive label substring check */
function labelContains(label: string | undefined, term: string): boolean {
  return label?.toLowerCase().includes(term) ?? false;
}

/**
 * Pure function to compute event type flags.
 * Use this in non-React contexts or when memoization is handled externally.
 */
export function getEventTypeFlags(
  eventType: string | undefined,
  gameType: string | undefined,
  eventTypes: SelectOption[],
  gameTypes: SelectOption[],
): EventTypeFlags {
  const eventLabel = eventTypes.find(et => et.value === eventType)?.label;
  const gameLabel = gameTypes.find(gt => gt.value === gameType)?.label;

  const isSpielEvent = labelContains(eventLabel, 'spiel');
  const isTurnierEvent = labelContains(eventLabel, 'turnier');
  const isTurnierGameType = labelContains(gameLabel, 'turnier');
  const isTask = labelContains(eventLabel, 'aufgabe');
  const isTraining = labelContains(eventLabel, 'training');

  // Both "Spiel" and "Turnier" event types are match events
  const isMatchEvent = isSpielEvent || isTurnierEvent;

  // Tournament mode: either the event type itself IS a tournament,
  // or a "Spiel" event has a tournament game type selected
  const isTournament = isTurnierEvent || (isSpielEvent && isTurnierGameType);

  const isGenericEvent = !isMatchEvent && !isTask && !isTraining;

  return { isMatchEvent, isTournament, isTournamentEventType: isTurnierEvent, isTask, isTraining, isGenericEvent };
}

/**
 * React hook for event type flags with automatic memoization.
 * Single source of truth — replaces redundant flag computation across components.
 */
export function useEventTypeFlags(
  eventType: string | undefined,
  gameType: string | undefined,
  eventTypes: SelectOption[],
  gameTypes: SelectOption[],
): EventTypeFlags {
  return useMemo(
    () => getEventTypeFlags(eventType, gameType, eventTypes, gameTypes),
    [eventType, gameType, eventTypes, gameTypes],
  );
}
