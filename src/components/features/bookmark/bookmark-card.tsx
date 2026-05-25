'use client';

import type { Bookmark } from '@/types';

// Design Ref: §7 — XSS 안전: dangerouslySetInnerHTML 없이 span 분리
function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const q = query.toLocaleLowerCase('ko');
  const lower = text.toLocaleLowerCase('ko');
  const idx = lower.indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-gray-900">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  searchQuery?: string;
}

export function BookmarkCard({ bookmark, onDelete, searchQuery = '' }: BookmarkCardProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2 flex-1"
        >
          {highlightText(bookmark.title, searchQuery)}
        </a>
        <button
          onClick={() => onDelete(bookmark.id)}
          aria-label="북마크 삭제"
          className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
        >
          ×
        </button>
      </div>
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-gray-400 truncate hover:text-blue-400"
      >
        {bookmark.url}
      </a>
      {bookmark.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bookmark.tags.map(tag => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
            >
              #{highlightText(tag, searchQuery)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
