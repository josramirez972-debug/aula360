import { createClient } from '@/lib/supabase/client';
import { DataProvider } from '@/lib/data-provider';
import { AcademicPeriod } from '@/types/database';

export const PeriodsService = {
  async getPeriods(): Promise<AcademicPeriod[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('academic_periods')
        .select('*')
        .order('start_date', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as AcademicPeriod[];
      }
    } catch {
      // Fallback
    }
    return DataProvider.getPeriods();
  },

  async getPeriodById(id: string): Promise<AcademicPeriod | null> {
    const periods = await this.getPeriods();
    return periods.find((p) => p.id === id) || null;
  },

  async savePeriod(periodData: {
    id?: string;
    name: string;
    academic_year: string;
    start_date: string;
    end_date: string;
    status: 'OPEN' | 'CLOSED';
  }): Promise<{ period: AcademicPeriod; error?: string }> {
    if (!periodData.name?.trim()) {
      return { period: null as any, error: 'El nombre del período es requerido.' };
    }
    if (new Date(periodData.end_date) < new Date(periodData.start_date)) {
      return { period: null as any, error: 'La fecha final no puede ser anterior a la fecha inicial.' };
    }

    try {
      const supabase = createClient();
      if (periodData.id) {
        const { data, error } = await supabase
          .from('academic_periods')
          .update({
            name: periodData.name.trim(),
            academic_year: periodData.academic_year,
            start_date: periodData.start_date,
            end_date: periodData.end_date,
            status: periodData.status,
          })
          .eq('id', periodData.id)
          .select()
          .single();

        if (!error && data) {
          return { period: data as AcademicPeriod };
        }
      }
    } catch {
      // Fallback
    }

    const saved = DataProvider.savePeriod(periodData);
    return { period: saved };
  },

  async togglePeriodStatus(period: AcademicPeriod): Promise<{ period: AcademicPeriod; error?: string }> {
    const nextStatus = period.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    return this.savePeriod({
      ...period,
      status: nextStatus,
    });
  },
};
