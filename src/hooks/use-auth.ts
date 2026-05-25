// Design Ref: §5 — auth-store 래퍼 Hook, 컴포넌트는 이 Hook만 사용
import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const { user, status, login, register, logout } = useAuthStore();
  return {
    user,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    login,
    register,
    logout,
  };
}
