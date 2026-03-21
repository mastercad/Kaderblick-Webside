import { apiJson } from '../utils/api';
import { Cup } from '../types/cup';

export async function fetchCups(): Promise<Cup[]> {
    const res = await apiJson<{ cups: Cup[] }>('/api/cups');
    return res?.cups || [];
}
