import { createClient } from '@/lib/supabase/client';
import { DataProvider } from '@/lib/data-provider';
import { Profile, UserRole } from '@/types/database';

export const AuthService = {
  async signIn(email: string, password?: string): Promise<{ user: Profile | null; error?: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { user: null, error: 'El correo electrónico es requerido.' };
    }

    const supabase = createClient();

    // 1. If password provided, attempt Supabase Auth
    if (password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (!error && data?.user) {
          // Fetch user profile from Supabase
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileData) {
            return { user: profileData as Profile };
          }

          // Fallback profile from user metadata
          const metaProfile: Profile = {
            id: data.user.id,
            email: data.user.email || trimmedEmail,
            full_name: data.user.user_metadata?.full_name || trimmedEmail.split('@')[0],
            role: (data.user.user_metadata?.role as UserRole) || 'PARENT',
            created_at: data.user.created_at || new Date().toISOString(),
          };
          return { user: metaProfile };
        }
      } catch {
        // Fallback to local DataProvider for demo
      }
    }

    // 2. Local Demo fallback (Only when demo mode is enabled)
    const isDemoMode = process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE !== 'false';
    if (isDemoMode) {
      const matched = DataProvider.getProfileByEmail(trimmedEmail);
      if (matched) {
        return { user: matched };
      }
    }

    return { user: null, error: 'Credenciales inválidas o cuenta no encontrada.' };
  },

  async signOut(): Promise<void> {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
  },

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: 'Ingresa un correo electrónico válido.' };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
      if (error && !error.message.includes('fetch')) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch {
      return { success: true };
    }
  },

  async getCurrentProfile(): Promise<Profile | null> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) return profile as Profile;
      }
    } catch {
      // Fallback
    }

    return DataProvider.getCurrentUser();
  },
};
