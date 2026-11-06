import { createClient } from '@/lib/supabase/client';
import { DataProvider } from '@/lib/data-provider';
import { Subject } from '@/types/database';

export const SubjectsService = {
  async getSubjects(): Promise<Subject[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Subject[];
      }
    } catch {
      // Fallback
    }
    return DataProvider.getSubjects();
  },

  async saveSubject(subjectData: {
    id?: string;
    name: string;
    description?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }): Promise<{ subject: Subject; error?: string }> {
    if (!subjectData.name?.trim()) {
      return { subject: null as any, error: 'El nombre de la asignatura es obligatorio.' };
    }

    try {
      const supabase = createClient();
      if (subjectData.id) {
        const { data, error } = await supabase
          .from('subjects')
          .update({
            name: subjectData.name.trim(),
            description: subjectData.description?.trim(),
            status: subjectData.status || 'ACTIVE',
          })
          .eq('id', subjectData.id)
          .select()
          .single();

        if (!error && data) {
          return { subject: data as Subject };
        }
      } else {
        const { data, error } = await supabase
          .from('subjects')
          .insert({
            name: subjectData.name.trim(),
            description: subjectData.description?.trim(),
            status: subjectData.status || 'ACTIVE',
          })
          .select()
          .single();

        if (!error && data) {
          return { subject: data as Subject };
        }
      }
    } catch {
      // Fallback
    }

    const saved = DataProvider.saveSubject({
      ...subjectData,
      status: subjectData.status || 'ACTIVE',
    });
    return { subject: saved };
  },

  async toggleStatus(subject: Subject): Promise<Subject> {
    const nextStatus = subject.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await this.saveSubject({
      ...subject,
      status: nextStatus,
    });
    return res.subject;
  },

  getEnrolledSubjectsForStudent(studentId: string): Subject[] {
    return DataProvider.getEnrolledSubjectsForStudent(studentId);
  },

  getEnrolledStudentsForSubject(subjectId: string) {
    return DataProvider.getEnrolledStudentsForSubject(subjectId);
  },

  enrollStudent(studentId: string, subjectId: string): { success: boolean; error?: string } {
    return DataProvider.enrollStudentInSubject(studentId, subjectId);
  },

  unenrollStudent(studentId: string, subjectId: string): { success: boolean; error?: string } {
    return DataProvider.unenrollStudentFromSubject(studentId, subjectId);
  },
};
