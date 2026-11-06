'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DataProvider } from '@/lib/data-provider';
import { SchoolSettings, Student } from '@/types/database';
import {
  Home,
  GraduationCap,
  MessageSquareQuote,
  Clock,
  User,
  LogOut,
  Menu,
  X,
  School,
  ShieldCheck,
} from 'lucide-react';
import { DemoUserSwitcher } from '@/components/ui/DemoUserSwitcher';

interface ParentLayoutProps {
  children: React.ReactNode;
}

const parentNavItems = [
  { href: '/parent/dashboard', label: 'Inicio', icon: Home },
  { href: '/parent/children', label: 'Mi estudiante', icon: School },
  { href: '/parent/grades', label: 'Calificaciones', icon: GraduationCap },
  { href: '/parent/observations', label: 'Observaciones', icon: MessageSquareQuote },
  { href: '/parent/history', label: 'Historial', icon: Clock },
  { href: '/parent/profile', label: 'Mi perfil', icon: User },
];

export function ParentLayout({ children }: ParentLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [myStudent, setMyStudent] = useState<Student | null>(null);

  const loadData = () => {
    setSchoolSettings(DataProvider.getSchoolSettings());
    if (user) {
      setMyStudent(DataProvider.getStudentForParent(user.id));
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, [user]);

  const schoolName = schoolSettings?.school_name || 'Colegio AULA360';
  const activeYear = schoolSettings?.active_year || '2025';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200/80 fixed inset-y-0 z-30">
        {/* Brand header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <School className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h1 className="font-extrabold text-sm tracking-tight text-slate-900 truncate">{schoolName}</h1>
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
              Año {activeYear} • Acudiente
            </p>
          </div>
        </div>

        {/* Student Linked Pill */}
        {myStudent && (
          <div className="px-4 py-3 bg-emerald-50/60 border-b border-emerald-100/60">
            <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block">
              Estudiante Asignado (1:1)
            </span>
            <span className="text-xs font-bold text-slate-900 block truncate mt-0.5">
              {myStudent.first_name} {myStudent.last_name} ({myStudent.grade})
            </span>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {parentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-saas text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-saas bg-white border border-slate-200/60 shadow-xs">
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-2xl flex flex-col z-50">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                  <School className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-slate-900 truncate">{schoolName}</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {parentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-saas text-xs font-semibold ${
                      isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-saas hover:bg-red-100"
              >
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <School className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs text-slate-900 truncate">{schoolName}</span>
          </div>
          <div className="text-xs font-semibold text-emerald-700">Acudiente</div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto pb-24">
          {children}
        </main>
      </div>

      <DemoUserSwitcher />
    </div>
  );
}
