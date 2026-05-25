import Link from 'next/link';
import { LoginForm } from '@/components/features/auth/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">로그인</h1>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-gray-500">
          계정이 없으신가요?{' '}
          <Link href="/register" className="font-medium text-gray-900 underline underline-offset-2">
            회원가입
          </Link>
        </p>
      </div>
    </main>
  );
}
