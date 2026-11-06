'use client';

import {
  Profile,
  Student,
  ParentStudent,
  Subject,
  AcademicPeriod,
  Grade,
  Observation,
  GradeValidation,
  SchoolSettings,
  AuditLog,
  StudentPeriodVersion,
  ValidationComputedStatus,
  StudentSubject,
  StudentEvaluation,
} from '@/types/database';
import {
  INITIAL_PROFILES,
  INITIAL_STUDENTS,
  INITIAL_PARENT_STUDENTS,
  INITIAL_SUBJECTS,
  INITIAL_STUDENT_SUBJECTS,
  INITIAL_PERIODS,
  INITIAL_GRADES,
  INITIAL_EVALUATIONS,
  INITIAL_OBSERVATIONS,
  INITIAL_VALIDATIONS,
  INITIAL_SETTINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_STUDENT_PERIOD_VERSIONS,
} from './mock-data';

import { createClient } from '@/lib/supabase/client';

function getSupabaseClient() {
  if (typeof window === 'undefined') return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder')) return null;
  try {
    return createClient();
  } catch {
    return null;
  }
}

function safeSync(promiseLike: PromiseLike<unknown> | Promise<unknown>) {
  Promise.resolve(promiseLike).catch((err) => {
    console.error('Supabase async sync error:', err);
  });
}

const STORAGE_KEYS = {
  PROFILES: 'aula360_profiles',
  STUDENTS: 'aula360_students',
  PARENT_STUDENTS: 'aula360_parent_students',
  SUBJECTS: 'aula360_subjects',
  STUDENT_SUBJECTS: 'aula360_student_subjects',
  PERIODS: 'aula360_periods',
  GRADES: 'aula360_grades',
  EVALUATIONS: 'aula360_student_evaluations',
  OBSERVATIONS: 'aula360_observations',
  VALIDATIONS: 'aula360_validations',
  SETTINGS: 'aula360_settings',
  AUDIT_LOGS: 'aula360_audit_logs',
  VERSIONS: 'aula360_sp_versions',
};

function isDemoModeAllowed(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE !== 'false';
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  const isDemo = isDemoModeAllowed();
  // En producción real (ALLOW_DEMO_MODE=false), no inyectar datos mock ficticios como fallback
  const isSettings = key === STORAGE_KEYS.SETTINGS;
  const fallback = (!isDemo && !isSettings) ? ([] as unknown as T) : defaultValue;

  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('aula360_data_updated'));
  } catch (err) {
    console.error('Error saving to storage', err);
  }
}

export function resetDataStore(): void {
  if (typeof window === 'undefined') return;
  saveToStorage(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  saveToStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  saveToStorage(STORAGE_KEYS.PARENT_STUDENTS, INITIAL_PARENT_STUDENTS);
  saveToStorage(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  saveToStorage(STORAGE_KEYS.PERIODS, INITIAL_PERIODS);
  saveToStorage(STORAGE_KEYS.GRADES, INITIAL_GRADES);
  saveToStorage(STORAGE_KEYS.OBSERVATIONS, INITIAL_OBSERVATIONS);
  saveToStorage(STORAGE_KEYS.VALIDATIONS, INITIAL_VALIDATIONS);
  saveToStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  saveToStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  saveToStorage(STORAGE_KEYS.VERSIONS, INITIAL_STUDENT_PERIOD_VERSIONS);
}

export const DataProvider = {
  isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return Boolean(url && key && !url.includes('placeholder'));
  },

  async syncWithSupabase(): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase no está configurado.' };

    try {
      const [
        { data: students },
        { data: subjects },
        { data: periods },
        { data: grades },
        { data: evals },
        { data: obs },
        { data: vals },
        { data: ps },
        { data: settings },
      ] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('academic_periods').select('*'),
        supabase.from('grades').select('*'),
        supabase.from('student_evaluations').select('*'),
        supabase.from('observations').select('*'),
        supabase.from('grade_validations').select('*'),
        supabase.from('parent_students').select('*'),
        supabase.from('school_settings').select('*').limit(1).maybeSingle(),
      ]);

      if (students && students.length > 0) saveToStorage(STORAGE_KEYS.STUDENTS, students);
      if (subjects && subjects.length > 0) saveToStorage(STORAGE_KEYS.SUBJECTS, subjects);
      if (periods && periods.length > 0) saveToStorage(STORAGE_KEYS.PERIODS, periods);
      if (grades) saveToStorage(STORAGE_KEYS.GRADES, grades);
      if (evals) saveToStorage(STORAGE_KEYS.EVALUATIONS, evals);
      if (obs) saveToStorage(STORAGE_KEYS.OBSERVATIONS, obs);
      if (vals) saveToStorage(STORAGE_KEYS.VALIDATIONS, vals);
      if (ps) saveToStorage(STORAGE_KEYS.PARENT_STUDENTS, ps);
      if (settings) saveToStorage(STORAGE_KEYS.SETTINGS, settings);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('aula360_data_updated'));
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error)?.message };
    }
  },

  // --- PROFILES ---
  getProfiles(): Profile[] {
    return getFromStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  },

  getProfileById(id: string): Profile | undefined {
    return this.getProfiles().find((p) => p.id === id);
  },

  getProfileByEmail(email: string): Profile | undefined {
    const trimmed = email.trim().toLowerCase();
    const aliases: Record<string, string> = {
      'profesor@aula360.edu': 'teacher.demo@aula360.test',
      'carlos.perez@padres.com': 'padre1.demo@aula360.test',
      'ana.gomez@padres.com': 'padre2.demo@aula360.test',
    };
    const targetEmail = aliases[trimmed] || trimmed;
    return this.getProfiles().find(
      (p) => p.email.toLowerCase() === targetEmail || p.email.toLowerCase() === trimmed
    );
  },

  getCurrentUser(): Profile | null {
    if (typeof window === 'undefined') return this.getProfiles()[0] || null;
    const storedId = localStorage.getItem('aula360_current_user_id');
    if (storedId) {
      return this.getProfileById(storedId) || null;
    }
    return this.getProfiles()[0] || null;
  },

  getParents(): Profile[] {
    return this.getProfiles().filter((p) => p.role === 'PARENT');
  },

  saveProfile(profile: Omit<Profile, 'id' | 'created_at'> & { id?: string }): Profile {
    const profiles = this.getProfiles();
    if (profile.id) {
      const index = profiles.findIndex((p) => p.id === profile.id);
      if (index >= 0) {
        profiles[index] = { ...profiles[index], ...profile, updated_at: new Date().toISOString() };
        saveToStorage(STORAGE_KEYS.PROFILES, profiles);
        return profiles[index];
      }
    }
    const newProfile: Profile = {
      ...profile,
      id: profile.id || `prof-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    profiles.push(newProfile);
    saveToStorage(STORAGE_KEYS.PROFILES, profiles);
    return newProfile;
  },

  // --- STUDENTS ---
  getStudents(): Student[] {
    return getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  },

  getStudentById(id: string): Student | undefined {
    return this.getStudents().find((s) => s.id === id);
  },

  saveStudent(studentData: Omit<Student, 'id' | 'created_at'> & { id?: string }): Student {
    const students = this.getStudents();
    if (studentData.id) {
      const idx = students.findIndex((s) => s.id === studentData.id);
      if (idx >= 0) {
        students[idx] = {
          ...students[idx],
          ...studentData,
          updated_at: new Date().toISOString(),
        };
        saveToStorage(STORAGE_KEYS.STUDENTS, students);
        this.addAuditLog('UPDATE', 'STUDENT', studentData.id, null, students[idx]);
        return students[idx];
      }
    }
    const newStudent: Student = {
      ...studentData,
      id: studentData.id || `stud-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    students.push(newStudent);
    saveToStorage(STORAGE_KEYS.STUDENTS, students);
    this.addAuditLog('INSERT', 'STUDENT', newStudent.id, null, newStudent);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeSync(supabase.from('students').upsert({
        id: newStudent.id,
        first_name: newStudent.first_name,
        last_name: newStudent.last_name,
        birth_date: newStudent.birth_date,
        grade: newStudent.grade,
        section: newStudent.section,
        document_id: newStudent.document_id,
        status: newStudent.status,
      }));
    }
    return newStudent;
  },

  // --- PARENT_STUDENTS (STRICT 1:1) ---
  getParentStudents(): ParentStudent[] {
    return getFromStorage<ParentStudent[]>(STORAGE_KEYS.PARENT_STUDENTS, INITIAL_PARENT_STUDENTS);
  },

  // Returns single parent or null for a student
  getParentForStudent(studentId: string): Profile | null {
    const rel = this.getParentStudents().find((ps) => ps.student_id === studentId);
    if (!rel) return null;
    return this.getProfileById(rel.parent_id) || null;
  },

  // Returns single student or null for a parent
  getStudentForParent(parentId: string): Student | null {
    const rel = this.getParentStudents().find((ps) => ps.parent_id === parentId);
    if (!rel) return null;
    return this.getStudentById(rel.student_id) || null;
  },

  associateParentStudent(
    parentId: string,
    studentId: string,
    relationship_type = 'Representante Legal'
  ): { success: boolean; error?: string } {
    const relations = this.getParentStudents();

    // Check strict 1:1 constraints:
    // 1. Parent cannot already have another student
    const parentExisting = relations.find((r) => r.parent_id === parentId && r.student_id !== studentId);
    if (parentExisting) {
      return { success: false, error: 'Este representante ya se encuentra vinculado a otro estudiante (Regla 1:1).' };
    }

    // 2. Student cannot already have another parent
    const studentExisting = relations.find((r) => r.student_id === studentId && r.parent_id !== parentId);
    if (studentExisting) {
      return { success: false, error: 'Este estudiante ya cuenta con un representante asignado (Regla 1:1).' };
    }

    // Check if already exactly associated
    const alreadyLinked = relations.find((r) => r.parent_id === parentId && r.student_id === studentId);
    if (!alreadyLinked) {
      relations.push({
        id: `ps-${Date.now()}`,
        parent_id: parentId,
        student_id: studentId,
        relationship_type,
        created_at: new Date().toISOString(),
      });
      saveToStorage(STORAGE_KEYS.PARENT_STUDENTS, relations);
      this.addAuditLog('ASSOCIATE_1TO1', 'PARENT_STUDENT', `${parentId}:${studentId}`, null, { parentId, studentId });
    }

    return { success: true };
  },

  dissociateParentStudent(parentId: string, studentId: string): void {
    const relations = this.getParentStudents().filter(
      (r) => !(r.parent_id === parentId && r.student_id === studentId)
    );
    saveToStorage(STORAGE_KEYS.PARENT_STUDENTS, relations);
    this.addAuditLog('DISSOCIATE', 'PARENT_STUDENT', `${parentId}:${studentId}`, null, null);
  },

  // --- SUBJECTS ---
  getSubjects(): Subject[] {
    return getFromStorage<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  },

  saveSubject(subjectData: Omit<Subject, 'id' | 'created_at'> & { id?: string }): Subject {
    const subjects = this.getSubjects();
    if (subjectData.id) {
      const idx = subjects.findIndex((s) => s.id === subjectData.id);
      if (idx >= 0) {
        subjects[idx] = { ...subjects[idx], ...subjectData };
        saveToStorage(STORAGE_KEYS.SUBJECTS, subjects);
        return subjects[idx];
      }
    }
    const newSubject: Subject = {
      ...subjectData,
      id: subjectData.id || `subj-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    subjects.push(newSubject);
    saveToStorage(STORAGE_KEYS.SUBJECTS, subjects);
    return newSubject;
  },

  // --- STUDENT SUBJECTS (MATRICULACIONES) ---
  getStudentSubjects(): StudentSubject[] {
    return getFromStorage<StudentSubject[]>(STORAGE_KEYS.STUDENT_SUBJECTS, INITIAL_STUDENT_SUBJECTS);
  },

  getEnrolledSubjectsForStudent(studentId: string): Subject[] {
    const enrollments = this.getStudentSubjects().filter((ss) => ss.student_id === studentId);
    const subjects = this.getSubjects();
    return subjects.filter((s) => enrollments.some((e) => e.subject_id === s.id));
  },

  getEnrolledStudentsForSubject(subjectId: string): Student[] {
    const enrollments = this.getStudentSubjects().filter((ss) => ss.subject_id === subjectId);
    const students = this.getStudents();
    return students.filter((st) => enrollments.some((e) => e.student_id === st.id));
  },

  enrollStudentInSubject(studentId: string, subjectId: string): { success: boolean; error?: string } {
    const enrollments = this.getStudentSubjects();
    const existing = enrollments.find((e) => e.student_id === studentId && e.subject_id === subjectId);
    if (existing) {
      return { success: false, error: 'El estudiante ya está matriculado en esta asignatura.' };
    }
    enrollments.push({
      id: `ss-${Date.now()}`,
      student_id: studentId,
      subject_id: subjectId,
      enrolled_at: new Date().toISOString(),
    });
    saveToStorage(STORAGE_KEYS.STUDENT_SUBJECTS, enrollments);
    this.addAuditLog('ENROLL_SUBJECT', 'STUDENT_SUBJECT', `${studentId}:${subjectId}`, null, { studentId, subjectId });
    return { success: true };
  },

  unenrollStudentFromSubject(studentId: string, subjectId: string): { success: boolean; error?: string } {
    let enrollments = this.getStudentSubjects();
    const beforeCount = enrollments.length;
    enrollments = enrollments.filter((e) => !(e.student_id === studentId && e.subject_id === subjectId));
    if (enrollments.length === beforeCount) {
      return { success: false, error: 'El estudiante no estaba matriculado en esta asignatura.' };
    }
    saveToStorage(STORAGE_KEYS.STUDENT_SUBJECTS, enrollments);
    this.addAuditLog('UNENROLL_SUBJECT', 'STUDENT_SUBJECT', `${studentId}:${subjectId}`, null, null);
    return { success: true };
  },

  // --- ACADEMIC PERIODS ---
  getPeriods(): AcademicPeriod[] {
    return getFromStorage<AcademicPeriod[]>(STORAGE_KEYS.PERIODS, INITIAL_PERIODS);
  },

  getPeriodById(id: string): AcademicPeriod | undefined {
    return this.getPeriods().find((p) => p.id === id);
  },

  savePeriod(periodData: Omit<AcademicPeriod, 'id' | 'created_at'> & { id?: string }): AcademicPeriod {
    const periods = this.getPeriods();
    if (periodData.id) {
      const idx = periods.findIndex((p) => p.id === periodData.id);
      if (idx >= 0) {
        periods[idx] = { ...periods[idx], ...periodData };
        saveToStorage(STORAGE_KEYS.PERIODS, periods);
        return periods[idx];
      }
    }
    const newPeriod: AcademicPeriod = {
      ...periodData,
      id: periodData.id || `per-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    periods.push(newPeriod);
    saveToStorage(STORAGE_KEYS.PERIODS, periods);
    return newPeriod;
  },

  // --- ACADEMIC VERSION CONTROL (Section 5) ---
  getStudentPeriodVersions(): StudentPeriodVersion[] {
    return getFromStorage<StudentPeriodVersion[]>(STORAGE_KEYS.VERSIONS, INITIAL_STUDENT_PERIOD_VERSIONS);
  },

  getCurrentAcademicVersion(studentId: string, periodId: string): number {
    const versions = this.getStudentPeriodVersions();
    const found = versions.find((v) => v.student_id === studentId && v.period_id === periodId);
    return found ? found.current_version : 1;
  },

  incrementAcademicVersion(studentId: string, periodId: string): number {
    const versions = this.getStudentPeriodVersions();
    const idx = versions.findIndex((v) => v.student_id === studentId && v.period_id === periodId);
    let newVersion = 1;

    if (idx >= 0) {
      versions[idx].current_version += 1;
      versions[idx].updated_at = new Date().toISOString();
      newVersion = versions[idx].current_version;
    } else {
      newVersion = 2; // Was 1, now incremented on first update
      versions.push({
        id: `spv-${Date.now()}`,
        student_id: studentId,
        period_id: periodId,
        current_version: newVersion,
        updated_at: new Date().toISOString(),
      });
    }

    saveToStorage(STORAGE_KEYS.VERSIONS, versions);
    return newVersion;
  },

  // --- GRADES ---
  getGrades(filters?: { student_id?: string; period_id?: string; subject_id?: string }): Grade[] {
    let grades = getFromStorage<Grade[]>(STORAGE_KEYS.GRADES, INITIAL_GRADES);
    if (filters?.student_id) grades = grades.filter((g) => g.student_id === filters.student_id);
    if (filters?.period_id) grades = grades.filter((g) => g.period_id === filters.period_id);
    if (filters?.subject_id) grades = grades.filter((g) => g.subject_id === filters.subject_id);
    return grades;
  },

  saveGrade(gradeData: {
    id?: string;
    student_id: string;
    subject_id: string;
    period_id: string;
    grade: number;
    observation?: string;
    teacher_id?: string;
  }): { grade: Grade; error?: string } {
    // 1. Check if period is closed
    const period = this.getPeriodById(gradeData.period_id);
    if (period && period.status === 'CLOSED') {
      return {
        grade: {} as Grade,
        error: `El ${period.name} está CERRADO. No se permiten modificaciones ordinarias de notas.`,
      };
    }

    // 2. Validate range 0.00 to 5.00
    const num = Math.round(Number(gradeData.grade) * 100) / 100;
    if (isNaN(num) || num < 0.00 || num > 5.00) {
      return { grade: {} as Grade, error: 'La calificación debe estar entre 0.00 y 5.00 con máximo dos decimales.' };
    }

    const grades = this.getGrades();
    const existingIdx = grades.findIndex(
      (g) =>
        (gradeData.id && g.id === gradeData.id) ||
        (g.student_id === gradeData.student_id &&
          g.subject_id === gradeData.subject_id &&
          g.period_id === gradeData.period_id)
    );

    let savedGrade: Grade;
    const oldGrade = existingIdx >= 0 ? { ...grades[existingIdx] } : null;

    if (existingIdx >= 0) {
      grades[existingIdx] = {
        ...grades[existingIdx],
        grade: num,
        observation: gradeData.observation,
        teacher_id: gradeData.teacher_id,
        updated_at: new Date().toISOString(),
      };
      savedGrade = grades[existingIdx];
    } else {
      savedGrade = {
        id: gradeData.id || `grd-${Date.now()}`,
        student_id: gradeData.student_id,
        subject_id: gradeData.subject_id,
        period_id: gradeData.period_id,
        grade: num,
        observation: gradeData.observation,
        teacher_id: gradeData.teacher_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      grades.push(savedGrade);
    }
    saveToStorage(STORAGE_KEYS.GRADES, grades);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeSync(supabase.from('grades').upsert({
        id: savedGrade.id,
        student_id: savedGrade.student_id,
        subject_id: savedGrade.subject_id,
        period_id: savedGrade.period_id,
        grade: savedGrade.grade,
        observation: savedGrade.observation,
      }));
    }

    // 3. SECTION 5: Increment academic version on grade change!
    const newVersion = this.incrementAcademicVersion(gradeData.student_id, gradeData.period_id);

    // 4. Audit Log
    this.addAuditLog(
      oldGrade ? 'UPDATE' : 'INSERT',
      'GRADE',
      savedGrade.id,
      oldGrade,
      { ...savedGrade, version: newVersion }
    );

    return { grade: savedGrade };
  },

  // Calculate student period average dynamically
  calculateStudentPeriodAverage(studentId: string, periodId: string): { average: number; count: number } {
    const grades = this.getGrades({ student_id: studentId, period_id: periodId });
    if (grades.length === 0) return { average: 0, count: 0 };
    const sum = grades.reduce((acc, g) => acc + g.grade, 0);
    const avg = Math.round((sum / grades.length) * 100) / 100;
    return { average: avg, count: grades.length };
  },

  // --- STUDENT EVALUATIONS (EVALUACIONES PARCIALES POR PERÍODO Y MATERIA) ---
  getEvaluations(filters?: { student_id?: string; period_id?: string; subject_id?: string }): StudentEvaluation[] {
    let evals = getFromStorage<StudentEvaluation[]>(STORAGE_KEYS.EVALUATIONS, INITIAL_EVALUATIONS);
    if (filters?.student_id) evals = evals.filter((e) => e.student_id === filters.student_id);
    if (filters?.period_id) evals = evals.filter((e) => e.period_id === filters.period_id);
    if (filters?.subject_id) evals = evals.filter((e) => e.subject_id === filters.subject_id);
    return evals.sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime());
  },

  getEvaluationById(id: string): StudentEvaluation | undefined {
    return this.getEvaluations().find((e) => e.id === id);
  },

  saveEvaluation(evalData: {
    id?: string;
    student_id: string;
    subject_id: string;
    period_id: string;
    title: string;
    description: string;
    score: number;
    observation?: string;
    evaluation_date?: string;
  }): { evaluation: StudentEvaluation; error?: string } {
    // 1. Check if period is closed
    const period = this.getPeriodById(evalData.period_id);
    if (period && period.status === 'CLOSED') {
      return {
        evaluation: {} as StudentEvaluation,
        error: `El ${period.name} está CERRADO. No se pueden registrar ni modificar evaluaciones en períodos concluidos.`,
      };
    }

    // 2. Validate score range 0.00 to 5.00
    const num = Math.round(Number(evalData.score) * 100) / 100;
    if (isNaN(num) || num < 0.00 || num > 5.00) {
      return {
        evaluation: {} as StudentEvaluation,
        error: 'La calificación de la evaluación debe estar entre 0.00 y 5.00 con máximo dos decimales.',
      };
    }

    if (!evalData.title?.trim()) {
      return { evaluation: {} as StudentEvaluation, error: 'El título de la evaluación es requerido.' };
    }

    if (!evalData.description?.trim()) {
      return { evaluation: {} as StudentEvaluation, error: 'Debe especificar de qué trató la evaluación.' };
    }

    const evals = getFromStorage<StudentEvaluation[]>(STORAGE_KEYS.EVALUATIONS, INITIAL_EVALUATIONS);
    const existingIdx = evalData.id ? evals.findIndex((e) => e.id === evalData.id) : -1;

    let savedEval: StudentEvaluation;
    const oldEval = existingIdx >= 0 ? { ...evals[existingIdx] } : null;

    if (existingIdx >= 0) {
      evals[existingIdx] = {
        ...evals[existingIdx],
        title: evalData.title.trim(),
        description: evalData.description.trim(),
        score: num,
        observation: evalData.observation?.trim(),
        evaluation_date: evalData.evaluation_date || evals[existingIdx].evaluation_date,
        updated_at: new Date().toISOString(),
      };
      savedEval = evals[existingIdx];
    } else {
      savedEval = {
        id: evalData.id || `eval-${Date.now()}`,
        student_id: evalData.student_id,
        subject_id: evalData.subject_id,
        period_id: evalData.period_id,
        title: evalData.title.trim(),
        description: evalData.description.trim(),
        score: num,
        observation: evalData.observation?.trim(),
        evaluation_date: evalData.evaluation_date || new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      evals.push(savedEval);
    }
    saveToStorage(STORAGE_KEYS.EVALUATIONS, evals);

    // 3. Increment academic version
    this.incrementAcademicVersion(evalData.student_id, evalData.period_id);

    // 4. Update the subject final grade in `grades` based on average of evaluations
    const subjectEvals = evals.filter(
      (e) =>
        e.student_id === evalData.student_id &&
        e.subject_id === evalData.subject_id &&
        e.period_id === evalData.period_id
    );
    if (subjectEvals.length > 0) {
      const avgScore =
        Math.round((subjectEvals.reduce((acc, curr) => acc + curr.score, 0) / subjectEvals.length) * 100) / 100;
      
      const grades = this.getGrades();
      const gIdx = grades.findIndex(
        (g) =>
          g.student_id === evalData.student_id &&
          g.subject_id === evalData.subject_id &&
          g.period_id === evalData.period_id
      );
      if (gIdx >= 0) {
        grades[gIdx].grade = avgScore;
        grades[gIdx].updated_at = new Date().toISOString();
      } else {
        grades.push({
          id: `grd-${Date.now()}`,
          student_id: evalData.student_id,
          subject_id: evalData.subject_id,
          period_id: evalData.period_id,
          grade: avgScore,
          observation: `Promedio ponderado de ${subjectEvals.length} evaluaciones registradas.`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      saveToStorage(STORAGE_KEYS.GRADES, grades);

      const supabase = getSupabaseClient();
      if (supabase) {
        safeSync(supabase.from('student_evaluations').upsert({
          id: savedEval.id,
          student_id: savedEval.student_id,
          subject_id: savedEval.subject_id,
          period_id: savedEval.period_id,
          title: savedEval.title,
          description: savedEval.description,
          score: savedEval.score,
          observation: savedEval.observation,
          evaluation_date: savedEval.evaluation_date,
        }));

        const updatedGrd = grades[gIdx >= 0 ? gIdx : grades.length - 1];
        if (updatedGrd) {
          safeSync(supabase.from('grades').upsert({
            id: updatedGrd.id,
            student_id: updatedGrd.student_id,
            subject_id: updatedGrd.subject_id,
            period_id: updatedGrd.period_id,
            grade: updatedGrd.grade,
            observation: updatedGrd.observation,
          }));
        }
      }
    }

    // 5. Audit Log
    this.addAuditLog(
      oldEval ? 'UPDATE_EVALUATION' : 'INSERT_EVALUATION',
      'STUDENT_EVALUATION',
      savedEval.id,
      oldEval,
      savedEval
    );

    return { evaluation: savedEval };
  },

  deleteEvaluation(id: string): { success: boolean; error?: string } {
    let evals = getFromStorage<StudentEvaluation[]>(STORAGE_KEYS.EVALUATIONS, INITIAL_EVALUATIONS);
    const target = evals.find((e) => e.id === id);
    if (!target) return { success: false, error: 'Evaluación no encontrada.' };

    const period = this.getPeriodById(target.period_id);
    if (period && period.status === 'CLOSED') {
      return {
        success: false,
        error: `El ${period.name} está CERRADO. No se pueden eliminar evaluaciones en períodos concluidos.`,
      };
    }

    evals = evals.filter((e) => e.id !== id);
    saveToStorage(STORAGE_KEYS.EVALUATIONS, evals);

    // Increment version
    this.incrementAcademicVersion(target.student_id, target.period_id);

    // Recalculate grade in grades
    const remaining = evals.filter(
      (e) =>
        e.student_id === target.student_id &&
        e.subject_id === target.subject_id &&
        e.period_id === target.period_id
    );
    const grades = this.getGrades();
    const gIdx = grades.findIndex(
      (g) =>
        g.student_id === target.student_id &&
        g.subject_id === target.subject_id &&
        g.period_id === target.period_id
    );
    if (gIdx >= 0) {
      if (remaining.length > 0) {
        grades[gIdx].grade =
          Math.round((remaining.reduce((acc, curr) => acc + curr.score, 0) / remaining.length) * 100) / 100;
        grades[gIdx].updated_at = new Date().toISOString();
      }
      saveToStorage(STORAGE_KEYS.GRADES, grades);

      const supabase = getSupabaseClient();
      if (supabase) {
        safeSync(supabase.from('student_evaluations').delete().eq('id', target.id));

        const updatedGrd = grades[gIdx >= 0 ? gIdx : grades.length - 1];
        if (updatedGrd) {
          safeSync(supabase.from('grades').upsert({
            id: updatedGrd.id,
            student_id: updatedGrd.student_id,
            subject_id: updatedGrd.subject_id,
            period_id: updatedGrd.period_id,
            grade: updatedGrd.grade,
            observation: updatedGrd.observation,
          }));
        }
      }
    }

    this.addAuditLog('DELETE_EVALUATION', 'STUDENT_EVALUATION', id, target, null);
    return { success: true };
  },

  // --- OBSERVATIONS ---
  getObservations(filters?: { student_id?: string; period_id?: string; subject_id?: string }): Observation[] {
    let obs = getFromStorage<Observation[]>(STORAGE_KEYS.OBSERVATIONS, INITIAL_OBSERVATIONS);
    if (filters?.student_id) obs = obs.filter((o) => o.student_id === filters.student_id);
    if (filters?.period_id) obs = obs.filter((o) => o.period_id === filters.period_id);
    if (filters?.subject_id) obs = obs.filter((o) => o.subject_id === filters.subject_id);
    return obs;
  },

  saveObservation(data: Omit<Observation, 'id' | 'created_at'> & { id?: string }): { observation: Observation; error?: string } {
    const period = this.getPeriodById(data.period_id);
    if (period && period.status === 'CLOSED') {
      return {
        observation: {} as Observation,
        error: `El ${period.name} está CERRADO. No se pueden agregar ni modificar observaciones.`,
      };
    }

    const observations = this.getObservations();
    const newObs: Observation = {
      ...data,
      id: data.id || `obs-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    observations.push(newObs);
    saveToStorage(STORAGE_KEYS.OBSERVATIONS, observations);

    // Increment version
    const newVersion = this.incrementAcademicVersion(data.student_id, data.period_id);

    this.addAuditLog('INSERT', 'OBSERVATION', newObs.id, null, { ...newObs, version: newVersion });
    return { observation: newObs };
  },

  // --- VALIDATIONS & ACADEMIC VERSION CHECKING (Section 5) ---
  getValidations(filters?: { student_id?: string; period_id?: string; parent_id?: string }): GradeValidation[] {
    let vals = getFromStorage<GradeValidation[]>(STORAGE_KEYS.VALIDATIONS, INITIAL_VALIDATIONS);
    if (filters?.student_id) vals = vals.filter((v) => v.student_id === filters.student_id);
    if (filters?.period_id) vals = vals.filter((v) => v.period_id === filters.period_id);
    if (filters?.parent_id) vals = vals.filter((v) => v.parent_id === filters.parent_id);
    return vals;
  },

  getLatestValidation(studentId: string, periodId: string, parentId?: string): GradeValidation | null {
    let vals = this.getValidations({ student_id: studentId, period_id: periodId });
    if (parentId) vals = vals.filter((v) => v.parent_id === parentId);
    if (vals.length === 0) return null;
    // Sort descending by validated_at / version_reviewed
    vals.sort((a, b) => b.version_reviewed - a.version_reviewed);
    return vals[0];
  },

  // Returns computed status: 'PENDING' | 'VALIDATED' | 'REVISION_REQUIRED'
  computeValidationStatus(studentId: string, periodId: string, parentId?: string): {
    status: ValidationComputedStatus;
    currentVersion: number;
    reviewedVersion: number | null;
    validatedAt: string | null;
  } {
    const currentVersion = this.getCurrentAcademicVersion(studentId, periodId);
    const latestVal = this.getLatestValidation(studentId, periodId, parentId);

    if (!latestVal) {
      return {
        status: 'PENDING',
        currentVersion,
        reviewedVersion: null,
        validatedAt: null,
      };
    }

    if (latestVal.version_reviewed === currentVersion) {
      return {
        status: 'VALIDATED',
        currentVersion,
        reviewedVersion: latestVal.version_reviewed,
        validatedAt: latestVal.validated_at,
      };
    }

    // If validated an earlier version (latestVal.version_reviewed < currentVersion)
    return {
      status: 'REVISION_REQUIRED',
      currentVersion,
      reviewedVersion: latestVal.version_reviewed,
      validatedAt: latestVal.validated_at,
    };
  },

  // Confirm review with academic version
  confirmValidation(studentId: string, periodId: string, parentId: string): GradeValidation {
    const validations = this.getValidations();
    const currentVersion = this.getCurrentAcademicVersion(studentId, periodId);
    const now = new Date().toISOString();

    const newValidation: GradeValidation = {
      id: `val-${Date.now()}`,
      student_id: studentId,
      period_id: periodId,
      parent_id: parentId,
      version_reviewed: currentVersion,
      validated_at: now,
      created_at: now,
    };

    validations.push(newValidation);
    saveToStorage(STORAGE_KEYS.VALIDATIONS, validations);

    this.addAuditLog('VALIDATE_VERSION', 'GRADE_VALIDATION', newValidation.id, null, {
      student_id: studentId,
      period_id: periodId,
      version_reviewed: currentVersion,
      validated_at: now,
    });

    return newValidation;
  },

  // --- SCHOOL SETTINGS ---
  getSchoolSettings(): SchoolSettings {
    return getFromStorage<SchoolSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  saveSchoolSettings(settings: Partial<SchoolSettings>): SchoolSettings {
    const current = this.getSchoolSettings();
    const updated = { ...current, ...settings, updated_at: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.SETTINGS, updated);
    this.addAuditLog('UPDATE', 'SCHOOL_SETTINGS', current.id, current, updated);
    return updated;
  },

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    return getFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  addAuditLog(
    action: string,
    entity_type: string,
    entity_id: string,
    old_value?: unknown,
    new_value?: unknown,
    user_id?: string
  ): void {
    const logs = this.getAuditLogs();
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      action,
      entity_type,
      entity_id,
      old_value,
      new_value,
      user_id: user_id || 'system',
      created_at: new Date().toISOString(),
    };
    logs.unshift(log);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 150));
  },
};
