'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    // 앱 로드 시 현재 세션 확인
    fetchMe();

    // 세션 변경 감지 (탭 간 동기화, 만료 등)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        useAuthStore.setState({
          user: { id: session.user.id, email: session.user.email! },
          status: 'authenticated',
        });
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, status: 'unauthenticated' });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchMe]);

  return <>{children}</>;
}
