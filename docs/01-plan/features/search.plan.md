# search Planning Document

> **Summary**: 로그인 사용자가 제목·URL·태그 키워드로 북마크를 실시간 검색하고 태그 필터와 조합하는 기능
>
> **Project**: linkbox
> **Author**: kim_yongjin
> **Date**: 2026-05-25
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 북마크가 쌓일수록 태그 필터만으론 원하는 링크를 찾기 어렵다. 제목·URL을 부분적으로만 기억할 때 목록 전체를 스크롤해야 한다. |
| **Solution** | 제목·URL·태그를 동시에 검색하는 SearchBar(debounce 300ms)를 추가하고, 기존 TagFilter와 교집합으로 즉각 반응하게 한다. |
| **Function/UX Effect** | 검색어 입력 즉시(300ms) 매칭 카드만 표시, 매칭 텍스트 bold 하이라이트. TagFilter와 조합 시 교집합 결과 표시. |
| **Core Value** | bookmark가 저장 레이어라면 search는 인출 레이어 — "저장하면 반드시 다시 찾을 수 있다"의 완성. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 북마크 증가로 태그 필터 한계 도달 — 키워드 인출로 찾기 비용 제거 |
| **WHO** | 북마크 30개 이상 쌓인 개발자·리서처 (Primary) |
| **RISK** | 검색 + 태그 교집합 상태 관리 복잡도; 성능은 MVP 규모에서 문제없음 |
| **SUCCESS** | SC-1~SC-7 전체 달성; 키워드·태그 복합 검색 정상 동작 |
| **SCOPE** | SearchBar(debounce) + TagFilter 교집합 + 빈 상태 + 하이라이트. 서버 검색·히스토리 제외 |

---

## 1. Overview

### 1.1 Purpose

로그인한 사용자가 키워드 입력만으로 제목·URL·태그를 동시에 검색해 원하는 북마크를 즉시 찾을 수 있게 한다. 기존 TagFilter와 교집합으로 복합 조건 검색도 지원한다.

### 1.2 Background

bookmark 기능이 완료되어 `useBookmark` hook에 `filteredBookmarks` computed가 있다. 현재 `filteredBookmarks`는 `activeTag` 단일 조건이며, 여기에 `searchQuery` 조건을 추가하는 방식으로 확장한다. bkend.ai 추가 API 호출 없음 — 이미 메모리에 있는 배열을 클라이언트에서 필터링한다.

### 1.3 Related Documents

- PRD: `docs/00-pm/search.prd.md`
- bookmark 레퍼런스: `docs/01-plan/features/bookmark.plan.md`
- bookmark 설계: `docs/02-design/features/bookmark.design.md`

---

## 2. Scope

### 2.1 In Scope

- [x] SearchBar 컴포넌트 — placeholder "제목, URL, 태그로 검색...", X 버튼 초기화
- [x] debounce 300ms (직접 구현: `useEffect + setTimeout`)
- [x] 검색 범위: `title` + `url` + `tags` 3개 필드 동시 매칭 (대소문자 무관)
- [x] 기존 TagFilter와 교집합: 태그 선택 상태에서 검색어 추가 가능
- [x] 검색어 지우기 → 전체 목록(또는 태그 필터 상태) 복귀
- [x] 검색 결과 0건 → "검색 결과가 없습니다" + 검색어 표시 빈 상태
- [x] 검색어 하이라이트: 제목·태그에서 매칭 텍스트 `font-bold` 강조

### 2.2 Out of Scope

- 서버사이드 풀텍스트 검색 (bkend.ai 검색 API)
- 검색 히스토리 / 최근 검색어
- 자동완성 / 검색 제안
- 정렬 옵션 (관련도순, 날짜순)
- fuzzy 검색 (오타 허용)
- URL 필드 하이라이트 (제목·태그만)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | 요구사항 | Priority | Status |
|----|----------|:--------:|--------|
| FR-01 | SearchBar 컴포넌트: 텍스트 입력 + X 버튼 초기화 | High | Pending |
| FR-02 | debounce 300ms: 입력 멈춤 후 300ms 뒤 검색 반영 | High | Pending |
| FR-03 | title 검색: `title.toLocaleLowerCase('ko').includes(q)` | High | Pending |
| FR-04 | url 검색: `url.toLocaleLowerCase('ko').includes(q)` | High | Pending |
| FR-05 | tags 검색: `tags.some(t => t.toLocaleLowerCase('ko').includes(q))` | High | Pending |
| FR-06 | TagFilter 교집합: `activeTag && searchQuery` 동시 적용 | Medium | Pending |
| FR-07 | 검색 결과 0건 빈 상태: "검색 결과가 없습니다 ({query})" | Medium | Pending |
| FR-08 | 하이라이트: 제목·태그 매칭 텍스트 `font-bold` + `text-gray-900` | Should | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | 측정 방법 |
|----------|----------|---------|
| Performance | 100개 북마크 기준 필터 1ms 이하 (클라이언트 filter) | 직관적 확인 |
| UX | debounce 300ms — 즉각 반응처럼 느껴짐 | UI 확인 |
| State Isolation | 검색 상태 hook 로컬 유지, bookmark-store 오염 없음 | 코드 리뷰 |

---

## 4. Success Criteria

### 4.1 Success Criteria (SC)

| SC | 기준 | 측정 방법 |
|----|------|---------|
| SC-1 | 검색창 입력 → 300ms 내 결과 반영 | UI 확인 |
| SC-2 | 제목 일부 입력 → 해당 카드만 표시 | title 검색 |
| SC-3 | URL 도메인 입력 → 해당 URL 카드 표시 | url 검색 |
| SC-4 | 태그명 입력 → 해당 태그 포함 카드 표시 | tags 검색 |
| SC-5 | 태그 필터 선택 + 검색어 → 교집합 결과 표시 | 복합 필터 |
| SC-6 | 검색어 지우기 → 전체(또는 태그 필터) 목록 복귀 | 상태 복귀 |
| SC-7 | 검색어와 매칭된 제목·태그 텍스트 bold 강조 | UI 확인 |

### 4.2 Definition of Done

- [x] FR-01 ~ FR-08 전체 구현
- [x] SC-1 ~ SC-7 전체 달성
- [x] `npm run build` 성공 (TypeScript 에러 0)
- [x] 한글/영문 검색어 대소문자 무관 동작 확인

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| 검색 + 태그 교집합 상태 복잡도 | Medium | Low | hook 내 단일 computed로 처리, store 분리 |
| 하이라이트 구현 시 XSS (dangerouslySetInnerHTML) | Medium | Low | 마크업 사용 금지, `font-bold` span 분리 방식 사용 |
| 대량 북마크 성능 (500개+) | Low | Low | MVP 범위 밖; 현재 filter()로 충분 |
| debounce state 누락으로 search 미반영 | Low | Low | 직접 구현 패턴 명시, useEffect 클린업 필수 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `src/hooks/use-bookmark.ts` | Hook | `searchQuery` state + debounce + `filteredBookmarks` 조건 확장 |
| `src/app/(main)/dashboard/page.tsx` | Page | SearchBar 컴포넌트 추가 (TagFilter 위) |
| `src/components/features/bookmark/bookmark-card.tsx` | Component | 하이라이트 prop 추가 |
| `src/components/features/bookmark/bookmark-list.tsx` | Component | 빈 상태 메시지 search-aware 분기 |

### 6.2 New Resources

| Resource | Type | Description |
|----------|------|-------------|
| `src/components/features/search/search-bar.tsx` | Component | 검색창 + X 버튼 + 접근성 |

### 6.3 Verification

- [x] SearchBar 추가가 기존 TagFilter 동작에 영향 없음
- [x] 검색 상태가 bookmark-store를 변경하지 않음
- [x] 하이라이트 구현이 XSS 위험 없음 (span 분리, innerHTML 사용 안 함)

---

## 7. Architecture Considerations

### 7.1 Project Level

**Dynamic** — 기존 bookmark 패턴 확장, bkend.ai 추가 API 없음

### 7.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 검색 상태 위치 | `use-bookmark` hook 로컬 state | store 오염 방지, 관심사 분리 |
| debounce 방식 | 직접 구현 (`useEffect + setTimeout`) | 의존성 0개 추가 |
| 검색 범위 | title + url + tags 동시 | 단일 쿼리로 3필드 커버 |
| 교집합 처리 | `filteredBookmarks` computed에서 처리 | 단일 진실 공급원 |
| 하이라이트 방식 | span 분리 (`font-bold`) | XSS 위험 없음 (`dangerouslySetInnerHTML` 사용 안 함) |
| SearchBar 컴포넌트 위치 | `features/search/` 폴더 | bookmark 폴더와 관심사 분리 |

### 7.3 Folder Structure Preview

```
src/
├── components/features/search/
│   └── search-bar.tsx               ← 신규 (검색창 + X 버튼)
├── hooks/
│   └── use-bookmark.ts              ← 수정 (searchQuery + debounce + filteredBookmarks 확장)
├── components/features/bookmark/
│   ├── bookmark-card.tsx            ← 수정 (하이라이트 prop)
│   └── bookmark-list.tsx            ← 수정 (빈 상태 search-aware)
└── app/(main)/dashboard/
    └── page.tsx                     ← 수정 (SearchBar 추가)
```

---

## 8. Convention Prerequisites

### 8.1 기존 컨벤션 확인

- [x] kebab-case 파일명 (`search-bar.tsx`)
- [x] PascalCase 컴포넌트 (`SearchBar`)
- [x] `type` 우선, `any` 금지
- [x] `'use client'` 지시자 필요 (상태 있음)

### 8.2 환경변수

추가 환경변수 없음. 기존 bkend.ai 설정 재사용.

---

## 9. Next Steps

1. [ ] `/pdca design search` — 설계 문서 작성 (3가지 아키텍처 옵션)
2. [ ] `/pdca do search` — 구현
3. [ ] `/pdca analyze search` — Gap 분석

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-25 | Initial draft | kim_yongjin |
