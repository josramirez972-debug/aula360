import { createClient } from '@/lib/supabase/client';
import { DataProvider } from '@/lib/data-provider';
import { Observation, ObservationType } from '@/types/database';

export const ObservationsService = {
  async getObservations(filters?: { student_id?: string; period_id?: string }): Promise<Observation[]> {
    try {
      const supabase = createClient();
      let query = supabase.from('observations').select('*').order('created_at', { ascending: false });

      if (filters?.student_id) query = query.eq('student_id', filters.student_id);
      if (filters?.period_id) query = query.eq('period_id', filters.period_id);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Observation[];
      }
    } catch {
      // Fallback
    }

    return DataProvider.getObservations(filters);
  },

  async saveObservation(obsData: {
    id?: string;
    student_id: string;
    period_id: string;
    subject_id?: string;
    observation_type: ObservationType;
    content: string;
    teacher_id?: string;
  }): Promise<{ observation: Observation | null; error?: string }> {
    if (!obsData.content?.trim()) {
      return { observation: null, error: 'El contenido de la observación no puede estar vacío.' };
    }

    // Closed period check
    const periods = DataProvider.getPeriods();
    const period = periods.find((p) => p.id === obsData.period_id);
    if (period && period.status === 'CLOSED') {
      return {
        observation: null,
        error: `Operación bloqueada: El ${period.name} se encuentra CERRADO. No se pueden registrar observaciones en períodos concluidos.`,
      };
    }

    try {
      const supabase = createClient();
      if (obsData.id) {
        const { data, error } = await supabase
          .from('observations')
          .update({
            content: obsData.content.trim(),
            observation_type: obsData.observation_type,
            subject_id: obsData.subject_id || null,
          })
          .eq('id', obsData.id)
          .select()
          .single();

        if (!error && data) {
          return { observation: data as Observation };
        }
      } else {
        const { data, error } = await supabase
          .from('observations')
          .insert({
            student_id: obsData.student_id,
            period_id: obsData.period_id,
            subject_id: obsData.subject_id || null,
            observation_type: obsData.observation_type,
            content: obsData.content.trim(),
            teacher_id: obsData.teacher_id,
          })
          .select()
          .single();

        if (!error && data) {
          return { observation: data as Observation };
        }
      }
    } catch {
      // Fallback
    }

    const res = DataProvider.saveObservation(obsData);
    return { observation: res.observation, error: res.error };
  },
};
