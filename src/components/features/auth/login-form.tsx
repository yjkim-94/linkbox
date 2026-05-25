'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; server?: string }>({});

  function validate() {
    const next: typeof errors = {};
    if (!validateEmail(email)) next.email = '올바른 이메일 형식을 입력해 주세요.';
    if (password.length < 8) next.password = '비밀번호는 8자 이상이어야 합니다.';
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다. 다시 시도해 주세요.';
      setErrors({ server: message });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errors.server && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errors.server}
        </div>
      )}
      <Input
        label="이메일"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        autoComplete="email"
        required
      />
      <Input
        label="비밀번호"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        autoComplete="current-password"
        required
      />
      <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
        로그인
      </Button>
    </form>
  );
}
