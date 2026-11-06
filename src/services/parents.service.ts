import { createClient } from '@/lib/supabase/client';
import { DataProvider } from '@/lib/data-provider';
import { Profile, Student } from '@/types/database';

export const ParentsService = {
  async getParents(): Promise<Profile[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'PARENT')
        .order('full_name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Profile[];
      }
    } catch {
      // Fallback
    }
    return DataProvider.getParents();
  },

  async getParentForStudent(studentId: string): Promise<Profile | null> {
    if (!studentId) return null;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('parent_students')
        .select('parent_id, profiles(*)')
        .eq('student_id', studentId)
        .single();

      if (!error && data?.profiles) {
        return data.profiles as unknown as Profile;
      }
    } catch {
      // Fallback
    }
    return DataProvider.getParentForStudent(studentId) || null;
  },

  async associateParentStudent(
    parentId: string,
    studentId: string,
    relationshipType: string = 'Representante'
  ): Promise<{ success: boolean; error?: string }> {
    if (!parentId || !studentId) {
      return { success: false, error: 'Identificadores de acudiente y estudiante requeridos.' };
    }

    // 1. Strict 1:1 Check: Does this student already have a representative?
    const existingParent = DataProvider.getParentForStudent(studentId);
    if (existingParent && existingParent.id !== parentId) {
      return {
        success: false,
        error: `El estudiante ya tiene asignado un representante (${existingParent.full_name}). La relación 1:1 impide asignar más de un representante.`,
      };
    }

    // 2. Strict 1:1 Check: Does this parent already have a student?
    const existingStudent = DataProvider.getStudentForParent(parentId);
    if (existingStudent && existingStudent.id !== studentId) {
      return {
        success: false,
        error: `El representante ya tiene asignado al estudiante ${existingStudent.first_name} ${existingStudent.last_name}. La relación 1:1 impide asignar más de un estudiante por cuenta.`,
      };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('parent_students').insert({
        parent_id: parentId,
        student_id: studentId,
        relationship_type: relationshipType,
      });

      if (!error) {
        return { success: true };
      }
    } catch {
      // Fallback
    }

    return DataProvider.associateParentStudent(parentId, studentId, relationshipType);
  },

  async inviteParentAccount(payload: {
    email: string;
    full_name: string;
    phone?: string;
    student_id?: string;
    relationship_type?: string;
  }): Promise<{ success: boolean; user_id?: string; error?: string }> {
    if (!payload.email || !payload.full_name) {
      return { success: false, error: 'Nombre y correo electrónico son requeridos.' };
    }

    try {
      const res = await fetch('/api/parents/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Error al aprovisionar la cuenta.' };
      }

      // Persist in local store too
      const profile = DataProvider.saveProfile({
        full_name: payload.full_name.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone?.trim(),
        role: 'PARENT',
      });

      if (payload.student_id) {
        DataProvider.associateParentStudent(
          profile.id,
          payload.student_id,
          payload.relationship_type || 'Representante'
        );
      }

      return { success: true, user_id: profile.id };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },
};
