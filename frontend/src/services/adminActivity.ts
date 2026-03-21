import { apiJson } from '../utils/api';

export interface UserActivityEntry {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
  lastActivityAt: string | null;
  minutesAgo: number | null;
}

export interface ActivityStats {
  totalCount: number;
  activeToday: number;
  activeLast7Days: number;
  neverActive: number;
}

export interface ActivityPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ActivityOverviewData {
  users: UserActivityEntry[];
  stats: ActivityStats;
  pagination: ActivityPagination;
}

export interface TrendDataPoint {
  label: string;
  count: number;
}

export interface ActivityTrendData {
  range: string;
  data: TrendDataPoint[];
}

export type SortKey = 'last_activity_at' | 'full_name' | 'email';
export type SortDir = 'asc' | 'desc';
export type TrendRange = 'today' | 'week' | 'month' | '3m' | '6m' | '1y';

export interface ActivityQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: SortKey;
  dir?: SortDir;
}

export async function fetchUserActivity(params: ActivityQueryParams = {}): Promise<ActivityOverviewData> {
  const query = new URLSearchParams();
  if (params.page)   query.set('page',   String(params.page));
  if (params.limit)  query.set('limit',  String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.sort)   query.set('sort',   params.sort);
  if (params.dir)    query.set('dir',    params.dir);
  const qs = query.toString();
  return apiJson<ActivityOverviewData>(`/api/admin/activity${qs ? `?${qs}` : ''}`);
}

export async function fetchActivityTrend(range: TrendRange = 'month'): Promise<ActivityTrendData> {
  return apiJson<ActivityTrendData>(`/api/admin/activity/trend?range=${range}`);
}
