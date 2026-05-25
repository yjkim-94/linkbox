import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import type { Bookmark } from '@/types';

interface BookmarkState {
  bookmarks: Bookmark[];
  isLoading: boolean;
  serverError: string | null;
  activeTag: string | null;
  fetchBookmarks: () => Promise<void>;
  addBookmark: (url: string, title: string, tags: string[]) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
  setActiveTag: (tag: string | null) => void;
}

export const useBookmarkStore = create<BookmarkState>()((set, get) => ({
  bookmarks: [],
  isLoading: false,
  serverError: null,
  activeTag: null,

  fetchBookmarks: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    set({ isLoading: true, serverError: null });
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ bookmarks: data ?? [], isLoading: false });
    } catch (e) {
      set({ isLoading: false, serverError: e instanceof Error ? e.message : '불러오기 실패' });
    }
  },

  addBookmark: async (url, title, tags) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    set({ serverError: null });
    try {
      const { error } = await supabase
        .from('bookmarks')
        .insert({ user_id: user.id, url, title, tags });
      if (error) throw error;
      await get().fetchBookmarks();
    } catch (e) {
      set({ serverError: e instanceof Error ? e.message : '저장 실패' });
      throw e;
    }
  },

  removeBookmark: async (id) => {
    set(state => ({ bookmarks: state.bookmarks.filter(b => b.id !== id) }));
    try {
      const { error } = await supabase.from('bookmarks').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      await get().fetchBookmarks();
      set({ serverError: e instanceof Error ? e.message : '삭제 실패' });
    }
  },

  setActiveTag: (tag) => set({ activeTag: tag }),
}));
