import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, AuthStatus } from '@/types';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

function setSessionCookie() {
  document.cookie = 'sb-session=1; path=/; max-age=604800; SameSite=Lax';
}

function clearSessionCookie() {
  document.cookie = 'sb-session=; path=/; max-age=0';
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: 'idle',

  login: async (email, password) => {
    set({ status: 'loading' });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const u = data.user;
      setSessionCookie();
      set({ user: { id: u.id, email: u.email! }, status: 'authenticated' });
    } catch (e) {
      set({ status: 'unauthenticated' });
      throw e;
    }
  },

  register: async (email, password) => {
    set({ status: 'loading' });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      const u = data.user;
      if (u) {
        setSessionCookie();
        set({ user: { id: u.id, email: u.email! }, status: 'authenticated' });
      } else {
        set({ status: 'unauthenticated' });
      }
    } catch (e) {
      set({ status: 'unauthenticated' });
      throw e;
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    clearSessionCookie();
    set({ user: null, status: 'unauthenticated' });
  },

  fetchMe: async () => {
    set({ status: 'loading' });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        set({ user: { id: user.id, email: user.email! }, status: 'authenticated' });
      } else {
        clearSessionCookie();
        set({ user: null, status: 'unauthenticated' });
      }
    } catch {
      clearSessionCookie();
      set({ user: null, status: 'unauthenticated' });
    }
  },
}));
