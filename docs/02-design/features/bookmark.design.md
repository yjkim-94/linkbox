# bookmark Design Document

> **Summary**: 로그인 사용자가 URL+제목+태그를 저장하고 태그 필터로 탐색하는 북마크 CRUD 기능
>
> **Project**: linkbox
> **Author**: kim_yongjin
> **Date**: 2026-05-25
> **Status**: Draft
> **Planning Doc**: [bookmark.plan.md](../01-plan/features/bookmark.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 링크 재검색 비용 제거 — 맥락(태그)과 함께 저장해 언제든 빠르게 찾을 수 있게 |
| **WHO** | 다기기 사용 개발자·리서처 (Primary) |
| **RISK** | userId 필터 미동작 시 타사용자 데이터 노출 (Critical) |
| **SUCCESS** | SC-1~SC-6 전체 달성; 저장·조회·삭제·태그 필터 정상 동작 |
| **SCOPE** | URL 저장 + 태그 입력 + 카드 목록 + 태그 필터 + 삭제. 수정·OG파싱·공유 제외 |

---

## 1. Overview

### 1.1 Design Goals

- auth 패턴(`bookmark-store` + `use-bookmark` hook)을 그대로 재사용해 구현 속도를 높인다
- userId를 클라이언트가 임의 조작할 수 없도록 auth-store에서 자동 주입한다
- 태그 필터는 클라이언트 사이드 filter()로 구현 (서버 쿼리 없음, 전체 목록 조회 후 필터)
- dashboard 페이지를 북마크 메인 뷰로 확장한다

### 1.2 Design Principles

- auth 구현 패턴 재사용 (store → hook → component 레이어)
- userId 보안: auth-store에서 주입, 컴포넌트에서 절대 직접 입력 불가
- Optimistic Update 없이 저장/삭제 후 서버 재조회 (단순성 우선)

---

## 2. Architecture

### 2.0 Selected: Option C — Pragmatic Balance

auth 패턴(`auth-store` + `use-auth` hook) 구조를 그대로 bookmark에 복제. TanStack Query 없이 Zustand store에서 직접 bkend.data API를 호출.

### 2.1 Component Diagram

```
dashboard/page.tsx
├── AddBookmarkForm          ← URL + 제목 + 태그 입력 (쉼표 구분)
├── TagFilter                ← 태그 필터 버튼 목록
└── BookmarkList
    └── BookmarkCard[]       ← 카드 + 삭제 버튼 + URL 링크

use-bookmark.ts (Hook)
└── bookmark-store.ts (Zustand)
    └── bkend.data API ('bookmarks' 컬렉션)
        └── bkend.ai MongoDB
```

### 2.2 Data Flow

```
[AddBookmarkForm 제출]
  → use-bookmark.addBookmark(url, title, tags)
  → bookmark-store.create()
  → bkend.data.create('bookmarks', { userId, url, title, tags })
  → store.bookmarks 배열 갱신 (re-fetch)
  → BookmarkList 리렌더링

[BookmarkCard 삭제]
  → use-bookmark.removeBookmark(id)
  → bookmark-store.remove()
  → bkend.data.delete('bookmarks', id)
  → store.bookmarks에서 제거

[TagFilter 클릭]
  → use-bookmark.setActiveTag(tag)
  → store.activeTag 갱신
  → BookmarkList가 filteredBookmarks 계산
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `use-bookmark` | `bookmark-store` | store wrapper |
| `bookmark-store` | `bkend.data`, `auth-store` | CRUD + userId 주입 |
| `AddBookmarkForm` | `use-bookmark` | 저장 액션 |
| `BookmarkList` | `use-bookmark` | 목록 조회 |
| `BookmarkCard` | `Bookmark` type | 카드 표시 |
| `TagFilter` | `use-bookmark` | 필터 상태 |
| `dashboard/page.tsx` | `use-bookmark`, 모든 컴포넌트 | 통합 |

---

## 3. Data Model

### 3.1 Bookmark Entity

```typescript
// types/index.ts — 이미 정의됨, 변경 없음
interface Bookmark extends BaseDocument {
  userId: string;       // auth user._id (자동 주입)
  url: string;          // 필수
  title: string;        // 필수
  description?: string; // MVP 미사용 (폼에서 제외)
  tags: string[];       // 쉼표 구분 입력 → split → trim
  favicon?: string;     // MVP 미사용
}
```

### 3.2 bkend.ai Collection

컬렉션명: `bookmarks`

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| `_id` | ObjectId | auto | bkend.ai 자동 생성 |
| `userId` | String | yes | auth-store user._id에서 주입 |
| `url` | String | yes | URL 형식 검증 (프론트엔드) |
| `title` | String | yes | 최대 200자 |
| `tags` | String[] | no | 빈 배열 허용 |
| `createdAt` | Date | auto | bkend.ai 자동 |
| `updatedAt` | Date | auto | bkend.ai 자동 |

---

## 4. API Specification (bkend.ai data API)

### 4.1 사용 엔드포인트

| 작업 | 호출 | 파라미터 |
|------|------|---------|
| 목록 조회 | `bkend.data.list('bookmarks', { userId })` | userId 필수 (격리) |
| 생성 | `bkend.data.create('bookmarks', body)` | userId 포함 |
| 삭제 | `bkend.data.delete('bookmarks', id)` | id 필수 |

### 4.2 Store 호출 패턴

```typescript
// bookmark-store.ts

// 목록 조회
async fetchBookmarks() {
  const { user } = useAuthStore.getState();
  if (!user) return;
  const res = await bkend.data.list('bookmarks', { userId: user._id });
  set({ bookmarks: res.data ?? res, isLoading: false });
}

// 생성
async create(url: string, title: string, tags: string[]) {
  const { user } = useAuthStore.getState();
  await bkend.data.create('bookmarks', { userId: user!._id, url, title, tags });
  await get().fetchBookmarks(); // 재조회
}

// 삭제
async remove(id: string) {
  await bkend.data.delete('bookmarks', id);
  set(state => ({ bookmarks: state.bookmarks.filter(b => b._id !== id) }));
}
```

---

## 5. UI/UX Design

### 5.1 Screen Layout (dashboard 확장)

```
┌─────────────────────────────────────────┐
│  내 링크함          [user@email] [로그아웃] │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │ URL *        [https://...]      │    │
│  │ 제목 *       [제목 입력]         │    │
│  │ 태그         [react, nextjs]    │    │
│  │              [저장하기]          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [전체] [react] [nextjs] [typescript]   │  ← TagFilter
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ 카드 제목     │  │ 카드 제목     │    │
│  │ https://...  │  │ https://...  │    │
│  │ #react #next │  │ #ts          │    │
│  │          [x] │  │          [x] │    │
│  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
```

### 5.2 User Flow

```
dashboard 진입
  → useBookmark.fetchBookmarks() (mount 시)
  → 목록 표시

북마크 저장
  → URL + 제목 입력 → [저장하기]
  → addBookmark() → API 호출 → 목록 재조회 → 폼 초기화

태그 필터
  → 태그 버튼 클릭 → activeTag 설정
  → filteredBookmarks = bookmarks.filter(b => b.tags.includes(activeTag))
  → 같은 태그 재클릭 → activeTag = null → 전체 표시

삭제
  → [x] 버튼 클릭 → removeBookmark(id)
  → 로컬 배열에서 즉시 제거
```

### 5.3 Component List

| Component | 위치 | 책임 |
|-----------|------|------|
| `AddBookmarkForm` | `components/features/bookmark/` | URL+제목+태그 입력, 유효성 검증, 저장 |
| `TagFilter` | `components/features/bookmark/` | 활성 태그 버튼 목록, 필터 ON/OFF |
| `BookmarkList` | `components/features/bookmark/` | 필터된 카드 목록, 빈 상태 |
| `BookmarkCard` | `components/features/bookmark/` | 단일 카드 UI + 삭제 버튼 |
| `dashboard/page.tsx` | `app/(main)/dashboard/` | 전체 통합 레이아웃 |

### 5.4 Page UI Checklist

#### dashboard (북마크 메인 뷰)

**AddBookmarkForm**
- [ ] Input: URL 입력 (placeholder="https://...", required)
- [ ] Input: 제목 입력 (placeholder="제목을 입력하세요", required)
- [ ] Input: 태그 입력 (placeholder="react, nextjs (쉼표 구분)", optional)
- [ ] Button: 저장하기 (submit, disabled when isSubmitting)
- [ ] Error: URL 미입력 시 인라인 에러 "URL을 입력하세요"
- [ ] Error: 제목 미입력 시 인라인 에러 "제목을 입력하세요"
- [ ] Error: 잘못된 URL 형식 시 인라인 에러 "올바른 URL을 입력하세요"

**TagFilter**
- [ ] Button: "전체" 버튼 (activeTag null일 때 활성 스타일)
- [ ] Button: 각 고유 태그 버튼 (활성 시 강조 스타일)
- [ ] 북마크 없으면 TagFilter 미표시

**BookmarkList**
- [ ] Card 목록: filteredBookmarks 카드 렌더링
- [ ] 빈 상태: 북마크 없을 때 "저장된 링크가 없습니다" 메시지
- [ ] 로딩 상태: fetch 중 스피너

**BookmarkCard**
- [ ] Text: 북마크 제목
- [ ] Link: URL (새 탭으로 열림, `target="_blank" rel="noopener noreferrer"`)
- [ ] Tags: 각 태그 배지 (#tag 형태)
- [ ] Button: 삭제 버튼 (x 아이콘)

---

## 6. Error Handling

| 상황 | 처리 |
|------|------|
| URL 미입력 | 폼 인라인 에러 "URL을 입력하세요" |
| 제목 미입력 | 폼 인라인 에러 "제목을 입력하세요" |
| 잘못된 URL 형식 | 인라인 에러 "올바른 URL을 입력하세요" |
| bkend.ai API 오류 | store 내 serverError 상태 → 상단 에러 배너 |
| 미로그인 상태 | proxy.ts가 /login으로 redirect (auth 기능 처리) |

---

## 7. Security Considerations

- [x] userId는 항상 auth-store에서 주입 — 클라이언트 폼에서 입력 불가
- [x] 삭제 시 id만 전달 — 서버가 userId 소유권 검증 (bkend.ai 자체 검증 확인 필요)
- [x] URL은 클라이언트 형식 검증만 (서버 검증은 bkend.ai가 담당)
- [x] XSS: React의 기본 이스케이핑으로 방어

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L2: UI Action | AddBookmarkForm, TagFilter, BookmarkCard | 수동 확인 | Do |
| L3: E2E | 저장→목록표시→태그필터→삭제 전체 흐름 | 수동 확인 | Check |

### 8.2 L2: UI Action Test Scenarios

| # | Page | Action | Expected Result |
|---|------|--------|----------------|
| 1 | dashboard | 페이지 로드 | 내 북마크 목록 표시 (또는 빈 상태 메시지) |
| 2 | dashboard | URL+제목 입력 후 저장 | 카드 목록 상단에 추가 |
| 3 | dashboard | URL 없이 저장 | 인라인 에러 표시, 저장 안 됨 |
| 4 | dashboard | 태그 버튼 클릭 | 해당 태그 카드만 표시 |
| 5 | dashboard | 같은 태그 재클릭 | 전체 목록 복원 |
| 6 | dashboard | 카드 x 버튼 클릭 | 카드 즉시 제거 |
| 7 | dashboard | URL 카드 클릭 | 새 탭으로 열림 |

### 8.3 L3: E2E Scenario Test Scenarios

| # | 시나리오 | Steps | 성공 기준 |
|---|---------|-------|---------|
| 1 | 저장 → 새로고침 유지 | 저장 → F5 → 목록 확인 | 저장된 북마크 유지 (SC-4) |
| 2 | 데이터 격리 | 사용자 A 저장 → B 로그인 → B 목록 확인 | A 데이터 없음 (SC-5) |
| 3 | 전체 흐름 | 저장 → 태그 필터 → 삭제 | 각 단계 정상 동작 |

---

## 9. Clean Architecture (Dynamic Level)

### 9.4 이 기능의 레이어 배치

| Component | Layer | Location |
|-----------|-------|----------|
| `AddBookmarkForm`, `BookmarkCard`, `BookmarkList`, `TagFilter` | Presentation | `src/components/features/bookmark/` |
| `use-bookmark.ts` | Application | `src/hooks/` |
| `Bookmark` type | Domain | `src/types/index.ts` |
| `bookmark-store.ts` | Infrastructure | `src/stores/` |

---

## 10. Coding Convention Reference

### 10.4 이 기능의 컨벤션

| Item | Convention |
|------|-----------|
| 파일명 | kebab-case (`bookmark-card.tsx`, `use-bookmark.ts`) |
| 컴포넌트 | PascalCase (`BookmarkCard`, `AddBookmarkForm`) |
| Store | `useBookmarkStore` (Zustand, auth-store 패턴 동일) |
| Hook | `useBookmark()` — store wrapper |
| 에러 표시 | `aria-describedby` (auth 패턴 동일) |

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── stores/
│   └── bookmark-store.ts          ← [신규] Zustand store (list/create/delete/activeTag)
├── hooks/
│   └── use-bookmark.ts            ← [신규] store wrapper hook
├── components/features/bookmark/
│   ├── add-bookmark-form.tsx      ← [신규] URL+제목+태그 입력 폼
│   ├── bookmark-card.tsx          ← [신규] 카드 UI + 삭제
│   ├── bookmark-list.tsx          ← [신규] 카드 목록 + 빈 상태
│   └── tag-filter.tsx             ← [신규] 태그 필터 버튼
└── app/(main)/dashboard/
    └── page.tsx                   ← [수정] 북마크 UI 통합
```

### 11.2 Implementation Order

1. [ ] `bookmark-store.ts` — Zustand store (fetchBookmarks/create/remove/activeTag)
2. [ ] `use-bookmark.ts` — store wrapper (filteredBookmarks computed)
3. [ ] `bookmark-card.tsx` — 카드 UI (제목, URL, 태그 배지, 삭제 버튼)
4. [ ] `bookmark-list.tsx` — 목록 + 빈 상태 + 로딩
5. [ ] `add-bookmark-form.tsx` — 폼 (URL 필수, 제목 필수, 태그 선택)
6. [ ] `tag-filter.tsx` — 태그 버튼 목록
7. [ ] `dashboard/page.tsx` 수정 — 모든 컴포넌트 통합

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | 예상 턴 |
|--------|-----------|-------------|:------:|
| Store + Hook | `module-1` | bookmark-store.ts + use-bookmark.ts | 10-15 |
| Components | `module-2` | card + list + form + tag-filter | 15-20 |
| Integration | `module-3` | dashboard 통합 + 최종 검증 | 5-10 |

#### Recommended Session Plan

| 세션 | 작업 | Scope | 예상 턴 |
|------|------|-------|:------:|
| Session 1 | Plan + Design | 전체 | 완료 |
| Session 2 | Do | `--scope module-1,module-2,module-3` (전체) | 30-45 |
| Session 3 | Check + Report | 전체 | 20-30 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-25 | Initial draft (Option C Pragmatic) | kim_yongjin |
