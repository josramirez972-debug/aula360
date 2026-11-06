import { createClient } from '@/lib/supabase/client';
import { DataProvider } from '@/lib/data-provider';
import { SchoolSettings, AuditLog } from '@/types/database';

export const SettingsService = {
  async getSettings(): Promise<SchoolSettings> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('school_settings').select('*').single();

      if (!error && data) {
        return data as SchoolSettings;
      }
    } catch {
      // Fallback
    }

    return DataProvider.getSchoolSettings();
  },

  async saveSettings(settings: Partial<SchoolSettings>): Promise<SchoolSettings> {
    try {
      const supabase = createClient();
      const current = await this.getSettings();
      const { data, error } = await supabase
        .from('school_settings')
        .update({
          school_name: settings.school_name || current.school_name,
          teacher_name: settings.teacher_name || current.teacher_name,
          institutional_email: settings.institutional_email || current.institutional_email,
          phone: settings.phone || current.phone,
          active_year: settings.active_year || current.active_year,
          min_grade: settings.min_grade ?? current.min_grade,
          max_grade: settings.max_grade ?? current.max_grade,
          passing_grade: settings.passing_grade ?? current.passing_grade,
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id)
        .select()
        .single();

      if (!error && data) {
        return data as SchoolSettings;
      }
    } catch {
      // Fallback
    }

    return DataProvider.saveSchoolSettings(settings);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as AuditLog[];
      }
    } catch {
      // Fallback
    }

    return DataProvider.getAuditLogs();
  },
};
