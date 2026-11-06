import { createClient } from '@/lib/supabase/client';
import { DataProvider } from '@/lib/data-provider';
import { Student } from '@/types/database';

export const StudentsService = {
  async getStudents(): Promise<Student[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('last_name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Student[];
      }
    } catch {
      // Fallback
    }
    return DataProvider.getStudents();
  },

  async getStudentById(id: string): Promise<Student | null> {
    if (!id) return null;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as Student;
      }
    } catch {
      // Fallback
    }
    return DataProvider.getStudentById(id) || null;
  },

  async saveStudent(studentData: Partial<Student> & { first_name: string; last_name: string; birth_date: string; grade: string }): Promise<{ student: Student; error?: string }> {
    // Validations
    if (!studentData.first_name?.trim()) {
      return { student: null as any, error: 'El nombre es obligatorio.' };
    }
    if (!studentData.last_name?.trim()) {
      return { student: null as any, error: 'El apellido es obligatorio.' };
    }
    if (!studentData.birth_date) {
      return { student: null as any, error: 'La fecha de nacimiento es obligatoria.' };
    }
    if (!studentData.grade?.trim()) {
      return { student: null as any, error: 'El grado escolar es obligatorio.' };
    }

    try {
      const supabase = createClient();
      if (studentData.id) {
        const { data, error } = await supabase
          .from('students')
          .update({
            first_name: studentData.first_name.trim(),
            last_name: studentData.last_name.trim(),
            birth_date: studentData.birth_date,
            grade: studentData.grade.trim(),
            section: studentData.section || 'A',
            document_id: studentData.document_id?.trim() || null,
            status: studentData.status || 'ACTIVE',
            updated_at: new Date().toISOString(),
          })
          .eq('id', studentData.id)
          .select()
          .single();

        if (!error && data) {
          return { student: data as Student };
        }
      } else {
        const { data, error } = await supabase
          .from('students')
          .insert({
            first_name: studentData.first_name.trim(),
            last_name: studentData.last_name.trim(),
            birth_date: studentData.birth_date,
            grade: studentData.grade.trim(),
            section: studentData.section || 'A',
            document_id: studentData.document_id?.trim() || null,
            status: studentData.status || 'ACTIVE',
          })
          .select()
          .single();

        if (!error && data) {
          return { student: data as Student };
        }
      }
    } catch {
      // Fallback
    }

    const saved = DataProvider.saveStudent({
      ...studentData,
      section: studentData.section || 'A',
      status: studentData.status || 'ACTIVE',
    });
    return { student: saved };
  },

  getStudentForParent(parentId: string): Student | null {
    return DataProvider.getStudentForParent(parentId) || null;
  },
};
