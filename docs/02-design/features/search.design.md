# search Design Document

> **Summary**: 제목·URL·태그 키워드로 북마크를 실시간 검색하고 TagFilter와 교집합을 지원하는 기능
>
> **Project**: linkbox
> **Author**: kim_yongjin
> **Date**: 2026-05-25
> **Status**: Draft
> **Planning Doc**: [search.plan.md](../01-plan/features/search.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 북마크 증가로 태그 필터 한계 도달 — 키워드 인출로 찾기 비용 제거 |
| **WHO** | 북마크 30개 이상 쌓인 개발자·리서처 (Primary) |
| **RISK** | 검색 + 태그 교집합 상태 복잡도; 하이라이트 XSS 위험 (innerHTML 사용 시) |
| **SUCCESS** | SC-1~SC-7 전체 달성; 키워드·태그 복합 검색 정상 동작 |
| **SCOPE** | SearchBar + debounce + TagFilter 교집합 + 빈 상태 + 하이라이트. 서버 검색 제외 |

---

## 1. Overview

### 1.1 Design Goals

- `use-bookmark` hook에 검색 state를 추가해 `filteredBookmarks` 단일 computed로 처리
- `SearchBar` 컴포넌트는 `features/search/`에 분리 (재사용성 확보)
- debounce는 직접 구현 (`useEffect + setTimeout`) — 추가 의존성 없음
- 하이라이트는 `dangerouslySetInnerHTML` 없이 span 분리 방식 (XSS 방지)

### 1.2 Design Principles

- bookmark-store는 변경 없음 — 검색 상태는 hook 로컬 state로 격리
- 단일 `filteredBookmarks` computed: `activeTag` AND `debouncedQuery` 교집합
- 하이라이트: 텍스트를 split/join으로 분리해 `<span className="font-bold">` 래핑

---

## 2. Architecture

### 2.0 Selected: Option C — Pragmatic Balance

`use-bookmark.ts` hook에 `query` / `debouncedQuery` 로컬 state 추가. `filteredBookmarks`를 2단계 filter로 확장. 별도 store 없음. `SearchBar` 컴포넌트만 신규 생성.

### 2.1 Component Diagram

```
dashboard/page.tsx
├── AddBookmarkForm          ← 기존 (변경 없음)
├── SearchBar                ← 신규 (query 입력 + X 버튼)
├── TagFilter                ← 기존 (변경 없음)
└── BookmarkList
    └── BookmarkCard[]       ← 수정 (highlight prop 추가)

use-bookmark.ts (Hook) ← 수정 (query + debounce + filteredBookmarks 확장)
└── bookmark-store.ts (Zustand) ← 변경 없음
    └── bkend.data API
```

### 2.2 Data Flow

```
[SearchBar 입력]
  → use-bookmark.setQuery(value)
  → query state 갱신 (즉시)
  → debouncedQuery 갱신 (300ms 후)
  → filteredBookmarks 재계산
  → BookmarkList 리렌더링

[filteredBookmarks 계산]
  1단계: activeTag 필터 (기존)
    bookmarks.filter(b => !activeTag || b.tags.includes(activeTag))
  2단계: debouncedQuery 필터 (신규)
    .filter(b => !debouncedQuery || matchesQuery(b, debouncedQuery))

[SearchBar X 버튼]
  → setQuery('')
  → debouncedQuery = '' (즉시 또는 300ms 내)
  → 전체 목록 복귀

[BookmarkCard 하이라이트]
  → searchQuery prop 수신
  → title을 Highlight 컴포넌트로 렌더링 (span 분리)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `SearchBar` | - | 검색창 UI + X 버튼 |
| `use-bookmark` (확장) | `bookmark-store`, useState, useEffect | query state + debounce + filteredBookmarks |
| `BookmarkCard` (수정) | `Bookmark` type, `searchQuery` prop | 하이라이트 렌더링 |
| `BookmarkList` (수정) | `use-bookmark` | searchQuery 전달 + 빈 상태 분기 |
| `dashboard/page.tsx` (수정) | `use-bookmark`, `SearchBar` | SearchBar 추가 |

---

## 3. Data Model

### 3.1 추가 타입

```typescript
// 신규: searchQuery를 prop으로 전달
interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  searchQuery?: string;  // 하이라이트용 (선택)
}

interface BookmarkListProps {
  bookmarks: Bookmark[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  searchQuery?: string;  // BookmarkCard로 전달
}
```

### 3.2 검색 매칭 함수

```typescript
// use-bookmark.ts 내부
function matchesQuery(bookmark: Bookmark, query: string): boolean {
  const q = query.toLocaleLowerCase('ko');
  return (
    bookmark.title.toLocaleLowerCase('ko').includes(q) ||
    bookmark.url.toLocaleLowerCase('ko').includes(q) ||
    bookmark.tags.some(t => t.toLocaleLowerCase('ko').includes(q))
  );
}
```

---

## 4. API Specification

추가 bkend.ai API 없음. 기존 `fetchBookmarks()`로 전체 목록을 메모리에 유지하고 클라이언트에서 필터링.

---

## 5. UI/UX Design

### 5.1 Screen Layout (dashboard 확장)

```
┌─────────────────────────────────────────┐
│  내 링크함          [user@email] [로그아웃] │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │ URL *        [https://...]      │    │  ← AddBookmarkForm (기존)
│  │ 제목 *       [제목 입력]         │    │
│  │ 태그         [react, nextjs]    │    │
│  │              [저장하기]          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌──────────────────────────────[x]┐    │  ← SearchBar (신규)
│  │  제목, URL, 태그로 검색...       │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [전체] [react] [nextjs] [typescript]   │  ← TagFilter (기존)
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ **React** Hooks│  │ 카드 제목     │    │  ← 하이라이트 (bold)
│  │ https://...  │  │ https://...  │    │
│  │ #**react** #next│ │ #ts          │    │
│  │          [x] │  │          [x] │    │
│  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
```

### 5.2 User Flow

```
검색 입력
  → SearchBar onChange → setQuery(value)
  → 300ms debounce → debouncedQuery 갱신
  → filteredBookmarks 재계산 → BookmarkList 리렌더링

검색 + 태그 조합
  → 태그 클릭 → activeTag 설정
  → 검색어 입력 → debouncedQuery 설정
  → filteredBookmarks = activeTag AND debouncedQuery 교집합

검색 초기화
  → X 버튼 클릭 → setQuery('') → debouncedQuery ''
  → filteredBookmarks = activeTag 단독 필터 (또는 전체)

결과 없음
  → filteredBookmarks.length === 0 && debouncedQuery
  → BookmarkList: "검색 결과가 없습니다 ({debouncedQuery})"
```

### 5.3 Component List

| Component | 위치 | 책임 | 변경 |
|-----------|------|------|:----:|
| `SearchBar` | `components/features/search/` | 검색창 + X 버튼 + 접근성 | 신규 |
| `use-bookmark.ts` | `hooks/` | query state + debounce + filteredBookmarks 확장 | 수정 |
| `BookmarkCard` | `components/features/bookmark/` | 하이라이트 prop 처리 | 수정 |
| `BookmarkList` | `components/features/bookmark/` | searchQuery 전달 + 빈 상태 분기 | 수정 |
| `dashboard/page.tsx` | `app/(main)/dashboard/` | SearchBar 추가 | 수정 |

### 5.4 Page UI Checklist

#### SearchBar

- [ ] Input: placeholder="제목, URL, 태그로 검색..."
- [ ] Input: `aria-label="북마크 검색"`
- [ ] Button: X 버튼 (검색어 있을 때만 표시, `aria-label="검색어 지우기"`)
- [ ] 검색어 없을 때 X 버튼 미표시

#### BookmarkList (검색 상태)

- [ ] 빈 상태 — 북마크 없음: "저장된 링크가 없습니다" (기존)
- [ ] 빈 상태 — 검색 결과 없음: "'{query}'에 대한 검색 결과가 없습니다"

#### BookmarkCard (하이라이트)

- [ ] title 매칭 텍스트 → `<span className="font-bold text-gray-900">`
- [ ] tags 매칭 텍스트 → `<span className="font-bold">`
- [ ] 검색어 없을 때 하이라이트 없음 (기존 렌더링)

---

## 6. Error Handling

| 상황 | 처리 |
|------|------|
| 검색 결과 0건 | BookmarkList 빈 상태 메시지에 검색어 포함 표시 |
| 검색어 공백만 입력 | trim() 후 빈 문자열 → 전체 목록 표시 |
| 하이라이트 중 특수문자 | RegExp 생성 없이 `indexOf` 기반 split으로 안전하게 처리 |

---

## 7. Security Considerations

- [x] 하이라이트: `dangerouslySetInnerHTML` 사용 안 함 — split + span 분리 방식
- [x] 검색어는 로컬 state — 서버 전송 없음
- [x] `matchesQuery`는 pure function — 외부 입력 검증 불필요 (이미 string 타입)

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L2: UI Action | SearchBar, 검색 결과 필터링, 하이라이트 | 수동 확인 | Do |
| L3: E2E | 검색 + 태그 조합, 0건 빈 상태, 초기화 | 수동 확인 | Check |

### 8.2 L2: UI Action Test Scenarios

| # | Page | Action | Expected Result |
|---|------|--------|----------------|
| 1 | dashboard | "react" 입력 | react 포함 title/url/tags 카드만 표시 |
| 2 | dashboard | "github" 입력 | url에 github 포함 카드만 표시 |
| 3 | dashboard | 없는 키워드 입력 | "검색 결과가 없습니다" 빈 상태 |
| 4 | dashboard | X 버튼 클릭 | 전체 목록 복귀 |
| 5 | dashboard | 태그 선택 후 "hooks" 입력 | 교집합 결과 표시 |
| 6 | dashboard | "React" 대문자 입력 | 대소문자 무관 매칭 |
| 7 | dashboard | 매칭 카드 확인 | title/tags 매칭 텍스트 bold |

### 8.3 L3: E2E Scenario Test Scenarios

| # | 시나리오 | Steps | 성공 기준 |
|---|---------|-------|---------|
| 1 | 검색 전체 흐름 | 입력 → 결과 확인 → X → 전체 복귀 | SC-1, SC-6 |
| 2 | 복합 필터 | 태그 클릭 → 검색어 입력 → 교집합 확인 | SC-5 |
| 3 | 한글 검색 | 한글 키워드 입력 → 매칭 확인 | SC-2 |

---

## 9. Clean Architecture (Dynamic Level)

### 9.4 이 기능의 레이어 배치

| Component | Layer | Location |
|-----------|-------|----------|
| `SearchBar` | Presentation | `src/components/features/search/` |
| `BookmarkCard` (highlight), `BookmarkList` (empty state) | Presentation | `src/components/features/bookmark/` |
| `use-bookmark.ts` (확장) | Application | `src/hooks/` |
| `matchesQuery` | Domain Logic | `src/hooks/use-bookmark.ts` (내부 함수) |
| `bookmark-store.ts` | Infrastructure | `src/stores/` (변경 없음) |

---

## 10. Coding Convention Reference

### 10.4 이 기능의 컨벤션

| Item | Convention |
|------|-----------|
| 파일명 | kebab-case (`search-bar.tsx`) |
| 컴포넌트 | PascalCase (`SearchBar`) |
| Hook state | `query` (입력값), `debouncedQuery` (필터 적용값) |
| 하이라이트 함수 | `highlightText(text, query)` — 순수 함수 |
| 검색 매칭 함수 | `matchesQuery(bookmark, query)` — hook 내부 |

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── components/features/search/
│   └── search-bar.tsx               ← [신규] 검색창 + X 버튼
├── hooks/
│   └── use-bookmark.ts              ← [수정] query + debounce + filteredBookmarks 확장
├── components/features/bookmark/
│   ├── bookmark-card.tsx            ← [수정] searchQuery prop + highlightText
│   └── bookmark-list.tsx            ← [수정] searchQuery 전달 + 빈 상태 분기
└── app/(main)/dashboard/
    └── page.tsx                     ← [수정] SearchBar 추가
```

### 11.2 Implementation Order

1. [ ] `search-bar.tsx` — 검색창 컴포넌트 (query, onChange, onClear props)
2. [ ] `use-bookmark.ts` 수정 — query state + debounce useEffect + matchesQuery + filteredBookmarks 2단계 필터
3. [ ] `bookmark-card.tsx` 수정 — searchQuery prop + highlightText 함수 (title, tags 하이라이트)
4. [ ] `bookmark-list.tsx` 수정 — searchQuery prop 전달 + 빈 상태 분기
5. [ ] `dashboard/page.tsx` 수정 — SearchBar 추가 (TagFilter 위)

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | 예상 턴 |
|--------|-----------|-------------|:------:|
| SearchBar 컴포넌트 | `module-1` | search-bar.tsx 신규 | 5-8 |
| Hook 확장 | `module-2` | use-bookmark.ts query/debounce/filteredBookmarks | 8-12 |
| Card/List/Dashboard | `module-3` | 하이라이트 + 빈 상태 + 통합 | 8-12 |

#### Recommended Session Plan

| 세션 | 작업 | Scope | 예상 턴 |
|------|------|-------|:------:|
| Session 1 | Plan + Design | 전체 | 완료 |
| Session 2 | Do | `--scope module-1,module-2,module-3` (전체) | 20-30 |
| Session 3 | Check + Report | 전체 | 15-20 |

### 11.4 핵심 구현 패턴

#### highlightText 함수 (XSS 안전)

```typescript
// bookmark-card.tsx 내부
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
```

#### use-bookmark.ts filteredBookmarks 확장

```typescript
// 기존
const filteredBookmarks = activeTag
  ? bookmarks.filter(b => b.tags.includes(activeTag))
  : bookmarks;

// 확장 후
const filteredBookmarks = bookmarks
  .filter(b => !activeTag || b.tags.includes(activeTag))
  .filter(b => !debouncedQuery.trim() || matchesQuery(b, debouncedQuery.trim()));
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-25 | Initial draft (Option C Pragmatic) | kim_yongjin |
