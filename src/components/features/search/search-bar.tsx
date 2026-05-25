'use client';

// Design Ref: §5.1 — SearchBar: TagFilter 위, placeholder, X 버튼 조건부 표시

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="제목, URL, 태그로 검색..."
        aria-label="북마크 검색"
        className="w-full rounded-xl bg-white px-4 py-2.5 text-sm text-gray-900 ring-1 ring-gray-200 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 pr-9"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="검색어 지우기"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>
      )}
    </div>
  );
}
