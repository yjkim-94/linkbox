'use client';

import type { Bookmark } from '@/types';
import { BookmarkCard } from './bookmark-card';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  searchQuery?: string;
}

export function BookmarkList({ bookmarks, isLoading, onDelete, searchQuery = '' }: BookmarkListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (bookmarks.length === 0) {
    // Plan SC: SC-6 — 검색 결과 0건 vs 북마크 없음 분기
    return (
      <p className="text-center text-sm text-gray-400 py-8">
        {searchQuery.trim()
          ? `'${searchQuery.trim()}'에 대한 검색 결과가 없습니다`
          : '저장된 링크가 없습니다'}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {bookmarks.map(bookmark => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onDelete={onDelete}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}
