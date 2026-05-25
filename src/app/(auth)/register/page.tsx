import Link from 'next/link';
import { RegisterForm } from '@/components/features/auth/register-form';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">회원가입</h1>
        <RegisterForm />
        <p className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium text-gray-900 underline underline-offset-2">
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
