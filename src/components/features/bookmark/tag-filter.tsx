'use client';

interface TagFilterProps {
  tags: string[];
  activeTag: string | null;
  onSelect: (tag: string | null) => void;
}

export function TagFilter({ tags, activeTag, onSelect }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`text-xs px-3 py-1 rounded-full transition-colors ${
          activeTag === null
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        전체
      </button>
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => onSelect(activeTag === tag ? null : tag)}
          className={`text-xs px-3 py-1 rounded-full transition-colors ${
            activeTag === tag
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}
