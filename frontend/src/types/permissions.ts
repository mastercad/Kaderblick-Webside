export type Permissions = {
  canCreate: boolean;
  canEdit: boolean;
  canView: boolean;
  canDelete: boolean;
  canEditBanner?: boolean;
  /** True when the current user may edit Stammdaten, club and nationality assignments */
  canEditStammdaten?: boolean;
  /** IDs of teams the current user actively coaches */
  coachTeamIds?: number[];
};
