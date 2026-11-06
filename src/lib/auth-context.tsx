'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Profile, UserRole } from '@/types/database';
import { DataProvider } from '@/lib/data-provider';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  switchUser: (profileId: string) => void;
  availableDemoUsers: Profile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'aula360_current_user_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Load session on startup
  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Try Supabase session if configured
        const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));

        if (session?.user) {
          // Look up profile
          const profile = DataProvider.getProfileById(session.user.id) || {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
            role: (session.user.user_metadata?.role as UserRole) || 'TEACHER',
            created_at: new Date().toISOString(),
          };
          setUser(profile);
          setIsLoading(false);
          return;
        }

        // 2. Check local demo user
        const storedUserId = localStorage.getItem(CURRENT_USER_KEY);
        if (storedUserId) {
          const profile = DataProvider.getProfileById(storedUserId);
          if (profile) {
            setUser(profile);
            setIsLoading(false);
            return;
          }
        }

        // Default to teacher on demo mode if desired, or null
        setUser(null);
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  // Route protection
  useEffect(() => {
    if (isLoading) return;

    const isPublic = pathname === '/login' || pathname === '/';

    if (!user && !isPublic) {
      router.push('/login');
      return;
    }

    if (user) {
      // Role-based restrictions
      if (user.role === 'PARENT' && pathname.startsWith('/teacher')) {
        router.push('/parent/dashboard');
      } else if (user.role === 'TEACHER' && pathname.startsWith('/parent')) {
        router.push('/teacher/dashboard');
      } else if (pathname === '/login' || pathname === '/') {
        router.push(user.role === 'TEACHER' ? '/teacher/dashboard' : '/parent/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  const isDemoMode = process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE !== 'false';

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // In demo mode, allow quick-access with mock profiles
      if (isDemoMode) {
        const matched = DataProvider.getProfileByEmail(email);
        if (matched) {
          setUser(matched);
          localStorage.setItem(CURRENT_USER_KEY, matched.id);
          setIsLoading(false);
          if (matched.role === 'TEACHER') {
            router.push('/teacher/dashboard');
          } else {
            router.push('/parent/dashboard');
          }
          return { success: true };
        }
      }

      // In production mode (or when password is provided), authenticate via Supabase Auth
      if (password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: 'Credenciales inválidas o usuario no encontrado.' };
        }

        if (data.user) {
          const profile = DataProvider.getProfileById(data.user.id) || {
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.full_name || 'Usuario',
            role: (data.user.user_metadata?.role as UserRole) || 'TEACHER',
            created_at: new Date().toISOString(),
          };
          setUser(profile);
          localStorage.setItem(CURRENT_USER_KEY, profile.id);
          setIsLoading(false);
          router.push(profile.role === 'TEACHER' ? '/teacher/dashboard' : '/parent/dashboard');
          return { success: true };
        }
      }

      setIsLoading(false);
      return { success: false, error: 'No se encontró ninguna cuenta asociada a este correo electrónico.' };
    } catch (err: unknown) {
      setIsLoading(false);
      return { success: false, error: (err as Error)?.message || 'Error de autenticación' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
      });

      if (error) {
        // If placeholder Supabase, return success for demo purposes
        if (error.message.includes('fetch') || error.message.includes('placeholder')) {
          return { success: true };
        }
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch {
      return { success: true };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut().catch(() => {});
    } finally {
      setUser(null);
      localStorage.removeItem(CURRENT_USER_KEY);
      router.push('/login');
    }
  };

  const switchUser = (profileId: string) => {
    if (!isDemoMode) return; // Disabled in production mode
    const profile = DataProvider.getProfileById(profileId);
    if (profile) {
      setUser(profile);
      localStorage.setItem(CURRENT_USER_KEY, profile.id);
      if (profile.role === 'TEACHER') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/parent/dashboard');
      }
    }
  };

  const availableDemoUsers = isDemoMode ? DataProvider.getProfiles() : [];

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        login,
        logout,
        resetPassword,
        switchUser,
        availableDemoUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
