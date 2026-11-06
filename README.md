# AULA360 — DEFINICIÓN ARQUITECTÓNICA DEFINITIVA

AULA360 es una aplicación web escolar full stack diseñada para una **única institución educativa**, con un **único profesor administrador**, una relación estricta **1:1 entre representante y estudiante**, cuatro períodos académicos configurables, escala de calificaciones en **PostgreSQL `NUMERIC(3, 2)`** y un **sistema de control de versiones académicas** para la confirmación formal de lectura de calificaciones por parte de los acudientes.

---

## 🏛️ 1. Arquitectura Implementada

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
- **Iconografía & UX/UI:** Lucide React. Interfaces minimalistas diferenciadas:
  - *Profesor:* Panel de control administrativo completo para ordenadores y tablets.
  - *Representante:* Portal minimalista, limpio y optimizado prioritariamente para teléfonos móviles.
- **Backend & Base de Datos:** PostgreSQL en Supabase con Row Level Security (RLS) mandatorio en el 100% de tablas privadas.
- **Relación 1:1 Estricta:** Un acudiente tiene exactamente un estudiante vinculado; un estudiante tiene exactamente un acudiente asignado (`UNIQUE(parent_id)` y `UNIQUE(student_id)` en `parent_students`).
- **Control de Versiones Académicas (Sección 5):** Cada estudiante y período posee un número de versión (`student_period_versions`). Cuando el docente modifica una nota u observación, la versión se incrementa automáticamente mediante triggers de base de datos e invalida las revisiones anteriores, solicitando al acudiente una nueva confirmación.

---

## 📂 2. Estructura Modular de Carpetas

```text
Sistema escolar/
├── .env.example
├── .env.local
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tests/
│   ├── verify-architecture.mjs    # Suite de pruebas automatizadas de arquitectura
│   └── mock-export.mjs
├── supabase/
│   ├── migrations/
│   │   └── 20250101000000_aula360_init.sql  # DDL, RLS, triggers y funciones
│   └── seed.sql                             # Datos iniciales de demostración
└── src/
    ├── app/
    │   ├── api/parents/invite/route.ts       # Aprovisionamiento seguro en servidor
    │   ├── login/page.tsx                    # Autenticación con detección de rol
    │   ├── teacher/                          # Dashboard y módulos del docente
    │   │   ├── dashboard/page.tsx
    │   │   ├── students/page.tsx
    │   │   ├── students/[id]/page.tsx
    │   │   ├── parents/page.tsx
    │   │   ├── subjects/page.tsx
    │   │   ├── periods/page.tsx
    │   │   ├── grades/page.tsx
    │   │   ├── observations/page.tsx
    │   │   ├── validations/page.tsx
    │   │   └── settings/page.tsx
    │   └── parent/                           # Dashboard y módulos del acudiente
    │       ├── dashboard/page.tsx
    │       ├── children/page.tsx
    │       ├── children/[id]/page.tsx
    │       ├── grades/page.tsx
    │       ├── observations/page.tsx
    │       ├── history/page.tsx
    │       └── profile/page.tsx
    ├── components/
    │   ├── layout/                           # TeacherLayout y ParentLayout
    │   └── ui/                               # Button, Input, Modal, Select, Badge, Card
    ├── lib/
    │   ├── auth-context.tsx                  # Contexto de autenticación y roles
    │   ├── data-provider.ts                  # Capa unificada de acceso a datos y triggers
    │   ├── mock-data.ts                      # Datos semilla estandarizados
    │   └── supabase/                         # Clientes browser, server y middleware
    ├── modules/                              # Servicios modulares de dominio
    │   ├── auth/
    │   ├── students/
    │   ├── parents/
    │   ├── subjects/
    │   ├── periods/
    │   ├── grades/
    │   ├── observations/
    │   ├── validations/
    │   ├── settings/
    │   └── audit/
    └── types/
        └── database.ts                       # Tipos estrictos TypeScript
```

---

## 🗄️ 3. Tablas Creadas en PostgreSQL

| Tabla | Claves / Restricciones | Propósito |
|---|---|---|
| `school_settings` | `id UUID PK`, `min_grade`, `max_grade`, `passing_grade` | Parámetros del colegio, profesor titular y año activo. |
| `profiles` | `id UUID PK REFERENCES auth.users`, `role CHECK (TEACHER, PARENT)` | Perfiles de usuario vinculados a la autenticación. |
| `students` | `id UUID PK`, `birth_date DATE`, `status CHECK (ACTIVE, INACTIVE)` | Datos personales y escolares del alumnado. |
| `parent_students` | `parent_id UNIQUE`, `student_id UNIQUE` | **Garantiza la relación estricta 1:1**. |
| `subjects` | `id UUID PK`, `status CHECK (ACTIVE, INACTIVE)` | Materias curriculares (Matemáticas, Español, etc.). |
| `academic_periods` | `id UUID PK`, `status CHECK (OPEN, CLOSED)` | Cuatro períodos académicos escolares. |
| `student_period_versions`| `UNIQUE(student_id, period_id)`, `current_version INT` | **Control de versión académica activa**. |
| `grades` | `UNIQUE(student_id, subject_id, period_id)`, `grade NUMERIC(3, 2)` | Calificaciones de 0.00 a 5.00 con dos decimales. |
| `observations` | `student_id`, `period_id`, `observation_type` | Observaciones formativas cualitativas. |
| `grade_validations` | `UNIQUE(student_id, period_id, parent_id, version_reviewed)` | Historial inmutable de constancias de revisión. |
| `audit_logs` | `id UUID PK`, `action`, `entity_type`, `old_value`, `new_value` | Registro inmutable de trazabilidad de cambios. |

---

## 🛡️ 4. Políticas Row Level Security (RLS)

- **Funciones de Seguridad:**
  - `public.is_teacher()`: función `SECURITY DEFINER` con `search_path = public` para validar rol de administrador.
  - `public.is_parent_of(student_uuid)`: función `SECURITY DEFINER` con `search_path = public` que valida si `auth.uid()` es el acudiente registrado del estudiante.
- **Reglas del Profesor:**
  - Acceso administrativo completo para lectura y escritura en estudiantes, materias, períodos, calificaciones, versiones y validaciones.
  - No puede modificar registros de auditoría.
- **Reglas del Representante:**
  - Solo puede leer los datos (`grades`, `observations`, `student_period_versions`) del estudiante donde `is_parent_of(student_id) = true`.
  - Solo puede insertar su propia validación (`parent_id = auth.uid()` y `is_parent_of(student_id) = true`).
  - No puede leer perfiles de otros representantes ni calificaciones de otros alumnos.

---

## 🚦 5. Sistema de Estados de Validación

La vigencia de la confirmación familiar se calcula dinámicamente comparando la versión confirmada frente a la versión académica actual:

1. **`PENDING` (Pendiente de revisión):** El acudiente no ha confirmado la lectura de este período.
2. **`VALIDATED` (Revisado):** La versión revisada por el acudiente coincide con la versión académica actual (`reviewedVersion === currentVersion`).
3. **`REVISION_REQUIRED` (Revisión nuevamente requerida):** El acudiente confirmó una versión anterior (ej. v1), pero el docente modificó una nota u observación y la versión se incrementó (ej. v2).

---

## 🧪 6. Pruebas Ejecutadas

Se ejecutó la suite automatizada `tests/verify-architecture.mjs` con 100% de éxito:
```bash
node tests/verify-architecture.mjs
```
- [x] Existe un único profesor administrador.
- [x] Cada representante está vinculado a máximo un estudiante (1:1).
- [x] Cada estudiante está vinculado a máximo un representante (1:1).
- [x] Rechazo en backend y frontend de intentos de asociación múltiple.
- [x] Exactamente 4 períodos académicos configurados.
- [x] Bloqueo de modificaciones ordinarias en períodos cerrados.
- [x] Calificaciones en escala `NUMERIC(3, 2)` (0.00 a 5.00).
- [x] Cálculo dinámico de promedio ponderado (no estático).
- [x] Detección de versión incrementada e invalidación de revisión (`REVISION_REQUIRED`).
- [x] Estado `VALIDATED` tras confirmar la versión vigente.
- [x] Registro inmutable de operaciones en `audit_logs`.
- [x] Configuración institucional activa.

---

## ⚙️ 7. Variables de Entorno

Configuradas en `.env.example`:
```env
# URL y Anon Key del proyecto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Service Role Key para operaciones privilegiadas en servidor (NUNCA en navegador)
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Habilitar modo demostración interactivo
NEXT_PUBLIC_ALLOW_DEMO_MODE=true
```

---

## 🚀 8. Instrucciones de Instalación y Despliegue

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar proyecto para producción (21 rutas generadas)
npm run build

# 3. Iniciar servidor
npm start
```
