'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddBookmarkFormProps {
  onAdd: (url: string, title: string, tags: string[]) => Promise<void>;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function AddBookmarkForm({ onAdd }: AddBookmarkFormProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<{ url?: string; title?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!url.trim()) next.url = 'URL을 입력하세요';
    else if (!isValidUrl(url.trim())) next.url = '올바른 URL을 입력하세요';
    if (!title.trim()) next.title = '제목을 입력하세요';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    setIsSubmitting(true);
    try {
      await onAdd(url.trim(), title.trim(), tags);
      setUrl('');
      setTitle('');
      setTagInput('');
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 flex flex-col gap-3">
      <Input
        label="URL"
        placeholder="https://..."
        value={url}
        onChange={e => setUrl(e.target.value)}
        error={errors.url}
      />
      <Input
        label="제목"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={e => setTitle(e.target.value)}
        error={errors.title}
      />
      <Input
        label="태그 (선택)"
        placeholder="react, nextjs (쉼표 구분)"
        value={tagInput}
        onChange={e => setTagInput(e.target.value)}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '저장 중...' : '저장하기'}
      </Button>
    </form>
  );
}
