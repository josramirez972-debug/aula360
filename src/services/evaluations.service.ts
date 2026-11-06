import { createClient } from '@/lib/supabase/client';
import { DataProvider } from '@/lib/data-provider';
import { StudentEvaluation } from '@/types/database';

export const EvaluationsService = {
  async getEvaluations(filters?: {
    student_id?: string;
    period_id?: string;
    subject_id?: string;
  }): Promise<StudentEvaluation[]> {
    try {
      const supabase = createClient();
      let query = supabase.from('student_evaluations').select('*').order('evaluation_date', { ascending: true });

      if (filters?.student_id) query = query.eq('student_id', filters.student_id);
      if (filters?.period_id) query = query.eq('period_id', filters.period_id);
      if (filters?.subject_id) query = query.eq('subject_id', filters.subject_id);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as StudentEvaluation[];
      }
    } catch {
      // Fallback
    }

    return DataProvider.getEvaluations(filters);
  },

  async saveEvaluation(evalData: {
    id?: string;
    student_id: string;
    subject_id: string;
    period_id: string;
    title: string;
    description: string;
    score: number;
    observation?: string;
    evaluation_date?: string;
  }): Promise<{ evaluation: StudentEvaluation; error?: string }> {
    return DataProvider.saveEvaluation(evalData);
  },

  async deleteEvaluation(id: string): Promise<{ success: boolean; error?: string }> {
    return DataProvider.deleteEvaluation(id);
  },
};
