import { Player } from './player';
import { Coach } from './coach';

export type PlayerStats = {
  eventCounts: { type: string; count: number }[];
  totalGames: number;
  totalMinutesPlayed: number;
};

export type WatchlistEntry = {
  id: number;
  isAnonymous: boolean;
  createdAt: string;
  type: 'player' | 'coach';
  player?: Player & { stats?: PlayerStats };
  coach?: Coach;
};
