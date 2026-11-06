import { createClient } from '@/lib/supabase/client';
import { DataProvider } from '@/lib/data-provider';
import { GradeValidation, ValidationComputedStatus } from '@/types/database';

export const ValidationsService = {
  async getValidations(filters?: { student_id?: string; period_id?: string; parent_id?: string }): Promise<GradeValidation[]> {
    try {
      const supabase = createClient();
      let query = supabase.from('grade_validations').select('*').order('validated_at', { ascending: false });

      if (filters?.student_id) query = query.eq('student_id', filters.student_id);
      if (filters?.period_id) query = query.eq('period_id', filters.period_id);
      if (filters?.parent_id) query = query.eq('parent_id', filters.parent_id);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as GradeValidation[];
      }
    } catch {
      // Fallback
    }

    return DataProvider.getValidations(filters);
  },

  async confirmReview(
    studentId: string,
    periodId: string,
    parentId: string
  ): Promise<{ validation: GradeValidation | null; error?: string }> {
    if (!studentId || !periodId || !parentId) {
      return { validation: null, error: 'Faltan parámetros de estudiante, período o acudiente.' };
    }

    // Security Check: Verify parent is assigned to student
    const assignedParent = DataProvider.getParentForStudent(studentId);
    if (!assignedParent || assignedParent.id !== parentId) {
      return {
        validation: null,
        error: 'Violación de seguridad RLS: Sólo el representante debidamente asignado al estudiante puede firmar la constancia de revisión.',
      };
    }

    const currentVersion = DataProvider.getCurrentAcademicVersion(studentId, periodId);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('grade_validations')
        .insert({
          student_id: studentId,
          period_id: periodId,
          parent_id: parentId,
          version_reviewed: currentVersion,
          validated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        return { validation: data as GradeValidation };
      }
    } catch {
      // Fallback
    }

    const validation = DataProvider.confirmValidation(studentId, periodId, parentId);
    return { validation };
  },

  getValidationStatus(
    studentId: string,
    periodId: string
  ): {
    status: ValidationComputedStatus;
    currentVersion: number;
    reviewedVersion: number | null;
    validatedAt: string | null;
  } {
    return DataProvider.computeValidationStatus(studentId, periodId);
  },
};
