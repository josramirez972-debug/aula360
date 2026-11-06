import { createClient } from '@/lib/supabase/client';
import { DataProvider } from '@/lib/data-provider';
import { Grade } from '@/types/database';

export const GradesService = {
  async getGrades(filters?: { student_id?: string; period_id?: string; subject_id?: string }): Promise<Grade[]> {
    try {
      const supabase = createClient();
      let query = supabase.from('grades').select('*');

      if (filters?.student_id) query = query.eq('student_id', filters.student_id);
      if (filters?.period_id) query = query.eq('period_id', filters.period_id);
      if (filters?.subject_id) query = query.eq('subject_id', filters.subject_id);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Grade[];
      }
    } catch {
      // Fallback
    }

    return DataProvider.getGrades(filters);
  },

  async saveGrade(gradeData: {
    id?: string;
    student_id: string;
    subject_id: string;
    period_id: string;
    grade: number;
    observation?: string;
    teacher_id?: string;
  }): Promise<{ grade: Grade | null; error?: string }> {
    // 1. Scale validation: NUMERIC(3, 2) in [0.00, 5.00]
    const numericGrade = parseFloat(Number(gradeData.grade).toFixed(2));
    if (isNaN(numericGrade) || numericGrade < 0.0 || numericGrade > 5.0) {
      return { grade: null, error: 'La calificación debe estar comprendida estrictamente entre 0.00 y 5.00 con un máximo de 2 decimales.' };
    }

    // 2. Closed period check
    const periods = DataProvider.getPeriods();
    const period = periods.find((p) => p.id === gradeData.period_id);
    if (period && period.status === 'CLOSED') {
      return {
        grade: null,
        error: `Operación bloqueada: El ${period.name} se encuentra CERRADO. No se pueden registrar ni modificar notas ordinarias en períodos concluidos.`,
      };
    }

    try {
      const supabase = createClient();
      if (gradeData.id) {
        const { data, error } = await supabase
          .from('grades')
          .update({
            grade: numericGrade,
            observation: gradeData.observation?.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', gradeData.id)
          .select()
          .single();

        if (!error && data) {
          return { grade: data as Grade };
        }
      } else {
        const { data, error } = await supabase
          .from('grades')
          .insert({
            student_id: gradeData.student_id,
            subject_id: gradeData.subject_id,
            period_id: gradeData.period_id,
            grade: numericGrade,
            observation: gradeData.observation?.trim() || null,
            teacher_id: gradeData.teacher_id,
          })
          .select()
          .single();

        if (!error && data) {
          return { grade: data as Grade };
        }
      }
    } catch {
      // Fallback
    }

    const res = DataProvider.saveGrade({
      ...gradeData,
      grade: numericGrade,
    });
    return { grade: res.grade, error: res.error };
  },

  calculateStudentPeriodAverage(studentId: string, periodId: string): { average: number | null; count: number } {
    return DataProvider.calculateStudentPeriodAverage(studentId, periodId);
  },

  getCurrentAcademicVersion(studentId: string, periodId: string): number {
    return DataProvider.getCurrentAcademicVersion(studentId, periodId);
  },
};
