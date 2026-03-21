import { apiJson } from '../utils/api';

export async function updateWidgetWidth({ id, width, position, config, enabled = true, isDefault = false, reportId }: {
  id: string;
  width: number | string;
  position: number;
  config?: any;
  enabled?: boolean;
  isDefault?: boolean;
  reportId?: number;
}): Promise<void> {
  await apiJson('/app/dashboard/widget/update', {
    method: 'PUT',
    body: {
      id,
      width,
      position,
      config,
      enabled,
      default: isDefault ? 1 : 0,
      ...(reportId !== undefined ? { reportId } : {}),
    }
  });
}
