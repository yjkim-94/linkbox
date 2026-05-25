// Design Ref: §9 — use-auth 패턴 재사용, filteredBookmarks computed
import { useState, useEffect } from 'react';
import type { Bookmark } from '@/types';
import { useBookmarkStore } from '@/stores/bookmark-store';

function matchesQuery(bookmark: Bookmark, query: string): boolean {
  const q = query.toLocaleLowerCase('ko');
  return (
    bookmark.title.toLocaleLowerCase('ko').includes(q) ||
    bookmark.url.toLocaleLowerCase('ko').includes(q) ||
    bookmark.tags.some(t => t.toLocaleLowerCase('ko').includes(q))
  );
}

export function useBookmark() {
  const {
    bookmarks,
    isLoading,
    serverError,
    activeTag,
    fetchBookmarks,
    addBookmark,
    removeBookmark,
    setActiveTag,
  } = useBookmarkStore();

  // Plan SC: SC-1 — debounce 300ms
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags))).sort();

  // Plan SC: SC-5 — activeTag AND debouncedQuery 교집합
  const filteredBookmarks = bookmarks
    .filter(b => !activeTag || b.tags.includes(activeTag))
    .filter(b => !debouncedQuery.trim() || matchesQuery(b, debouncedQuery.trim()));

  return {
    bookmarks,
    filteredBookmarks,
    allTags,
    isLoading,
    serverError,
    activeTag,
    searchQuery,
    debouncedQuery,
    fetchBookmarks,
    addBookmark,
    removeBookmark,
    setActiveTag,
    setSearchQuery,
  };
}
