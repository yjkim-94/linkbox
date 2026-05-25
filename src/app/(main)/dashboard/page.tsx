'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBookmark } from '@/hooks/use-bookmark';
import { Button } from '@/components/ui/button';
import { AddBookmarkForm } from '@/components/features/bookmark/add-bookmark-form';
import { BookmarkList } from '@/components/features/bookmark/bookmark-list';
import { TagFilter } from '@/components/features/bookmark/tag-filter';
import { SearchBar } from '@/components/features/search/search-bar';

export default function DashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const {
    filteredBookmarks,
    allTags,
    isLoading: bookmarkLoading,
    serverError,
    activeTag,
    searchQuery,
    debouncedQuery,
    fetchBookmarks,
    addBookmark,
    removeBookmark,
    setActiveTag,
    setSearchQuery,
  } = useBookmark();

  useEffect(() => {
    if (user) fetchBookmarks();
  }, [user, fetchBookmarks]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">내 링크함</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <Button variant="ghost" onClick={logout}>로그아웃</Button>
          </div>
        </header>

        <AddBookmarkForm onAdd={addBookmark} />

        {serverError && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{serverError}</p>
        )}

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <TagFilter tags={allTags} activeTag={activeTag} onSelect={setActiveTag} />

        <BookmarkList
          bookmarks={filteredBookmarks}
          isLoading={bookmarkLoading}
          onDelete={removeBookmark}
          searchQuery={debouncedQuery}
        />
      </div>
    </main>
  );
}
