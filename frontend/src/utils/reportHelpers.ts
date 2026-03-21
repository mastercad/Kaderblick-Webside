/**
 * reportHelpers.ts
 *
 * Utility functions for report configuration handling.
 * Extracted here so they can be unit-tested independently of the ReportsOverview component.
 */

export interface ContextRequirements {
  needsPlayer: boolean;
  needsTeam: boolean;
}

/**
 * Determines whether a report config references a player or team dimension.
 * Returns `needsPlayer: true` when xField or groupBy includes "player",
 * and `needsTeam: true` when xField or groupBy includes "team".
 */
export const needsContext = (
  config: { xField?: unknown; groupBy?: unknown } | undefined | null,
): ContextRequirements => {
  if (!config) return { needsPlayer: false, needsTeam: false };

  const xField = (config.xField as string) || '';
  const rawGroupBy = config.groupBy;
  const groupBy: string[] = Array.isArray(rawGroupBy)
    ? (rawGroupBy as string[])
    : rawGroupBy
    ? [rawGroupBy as unknown as string]
    : [];

  return {
    needsPlayer: xField === 'player' || groupBy.includes('player'),
    needsTeam:   xField === 'team'   || groupBy.includes('team'),
  };
};
