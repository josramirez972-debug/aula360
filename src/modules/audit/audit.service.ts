import { DataProvider } from '@/lib/data-provider';
import { AuditLog } from '@/types/database';

export const AuditService = {
  getLogs(): AuditLog[] {
    return DataProvider.getAuditLogs();
  },

  logAction(
    action: string,
    entity_type: string,
    entity_id: string,
    old_value?: unknown,
    new_value?: unknown,
    user_id?: string
  ): void {
    DataProvider.addAuditLog(action, entity_type, entity_id, old_value, new_value, user_id);
  },
};
