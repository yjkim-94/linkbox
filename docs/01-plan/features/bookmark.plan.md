# bookmark Planning Document

> **Summary**: 로그인 사용자가 URL + 제목 + 태그를 저장하고 태그로 필터링하는 북마크 관리 기능
>
> **Project**: linkbox
> **Author**: kim_yongjin
> **Date**: 2026-05-25
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 링크를 맥락 없이 브라우저 즐겨찾기·메모장에 분산 저장해 나중에 찾지 못하거나 어떤 링크인지 기억하지 못해 재검색 비용이 발생한다. |
| **Solution** | URL + 제목 + 태그(쉼표 구분 텍스트)를 입력해 bkend.ai `data` API에 저장하고, 카드 목록 + 태그 필터로 즉시 검색 가능하게 한다. |
| **Function/UX Effect** | 저장 즉시 카드 목록 상단에 추가되고, 태그 클릭으로 1초 내 필터링. URL 카드 클릭 시 새 탭으로 열림. |
| **Core Value** | "저장하면 반드시 다시 찾을 수 있다" — auth 계정 기반 위에 개인 링크 컬렉션을 쌓는 linkbox의 핵심 가치 레이어. |

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

### 1.1 Purpose

로그인한 사용자가 URL + 제목 + 태그를 입력해 북마크를 저장하고, 카드 목록에서 태그 필터로 빠르게 탐색하며, 필요 없는 북마크를 삭제할 수 있는 CRUD 기능을 제공한다.

### 1.2 Background

auth 기능이 완료되어 userId 기반 데이터 귀속이 가능한 상태다. bkend.ai의 `data` API(`bookmarks` 컬렉션)를 활용해 서버사이드 저장·조회를 구현한다. `types/index.ts`에 `Bookmark` 타입이 이미 정의되어 있어 타입 정의 비용이 낮다.

### 1.3 Related Documents

- PRD: `docs/00-pm/bookmark.prd.md`
- auth 레퍼런스: `docs/01-plan/features/auth.plan.md`

---

## 2. Scope

### 2.1 In Scope

- [x] URL + 제목 + 태그(쉼표 구분) 입력 폼 — 저장 시 bkend.ai 생성
- [x] 내 북마크 카드 목록 표시 (최신순)
- [x] 북마크 삭제
- [x] 태그 필터링 (클릭 시 해당 태그 북마크만 표시, 다시 클릭 시 해제)
- [x] URL 카드 클릭 → 새 탭으로 열림
- [x] URL 미입력 시 인라인 에러

### 2.2 Out of Scope

- OG(Open Graph) 메타데이터 자동 파싱 (favicon 포함)
- 북마크 수정(edit)
- 공유, Export/Import
- 읽기 모드, 아카이브
- 다중 태그 AND/OR 필터
- 목록 정렬 옵션 (최신순 고정)
- URL 유효성 실시간 검증 (형식 검증만)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | 요구사항 | Priority | Status |
|----|----------|:--------:|--------|
| FR-01 | URL(필수) + 제목(필수) + 태그(선택, 쉼표 구분) 입력 후 저장 | High | Pending |
| FR-02 | 저장 시 bkend.ai `data.create('bookmarks', {...})` 호출 | High | Pending |
| FR-03 | 내 북마크 카드 목록 — `data.list('bookmarks', {userId})` 조회 | High | Pending |
| FR-04 | 카드 URL 클릭 시 새 탭으로 열림 | High | Pending |
| FR-05 | 북마크 삭제 — `data.delete('bookmarks', id)` | High | Pending |
| FR-06 | 태그 클릭 시 필터 ON/OFF 토글 (단일 태그) | Medium | Pending |
| FR-07 | URL 미입력 또는 형식 오류 시 인라인 에러 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | 측정 방법 |
|----------|----------|---------|
| Security | userId 필드를 클라이언트가 임의 조작 불가 — auth store에서 주입 | 코드 리뷰 |
| UX | 저장 후 목록 즉시 반영 (optimistic update 또는 refetch) | UI 확인 |
| Accessibility | 에러 메시지 aria-describedby 연결 | 코드 리뷰 |

---

## 4. Success Criteria

### 4.1 Success Criteria (SC)

| SC | 기준 | 측정 방법 |
|----|------|---------|
| SC-1 | 유효한 URL + 제목 입력 후 저장 → 카드 목록 상단에 즉시 표시 | UI 확인 |
| SC-2 | 카드 삭제 버튼 클릭 → 목록에서 즉시 제거 | UI 확인 |
| SC-3 | 태그 클릭 → 해당 태그 북마크만 표시, 재클릭 시 전체 복원 | UI 확인 |
| SC-4 | 새로고침 후 북마크 목록 유지 (서버 저장 확인) | bkend.ai 조회 |
| SC-5 | 다른 사용자의 북마크가 노출되지 않음 (userId 격리) | 데이터 격리 검증 |
| SC-6 | URL 미입력 시 저장 불가 + 인라인 에러 표시 | 폼 검증 |

### 4.2 Definition of Done

- [x] FR-01 ~ FR-07 전체 구현
- [x] SC-1 ~ SC-6 전체 달성
- [x] `npm run build` 성공 (TypeScript 에러 0)
- [x] userId 격리 수동 검증 완료

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| userId 필터 미동작 → 타사용자 데이터 노출 | Critical | Low | 구현 첫 단계에서 bkend.ai 필터 동작 검증 |
| tags 배열 타입 저장 이슈 | Medium | Low | 구현 시 배열 저장/조회 단위 테스트 우선 |
| bkend.ai data API 응답 형식 불일치 | Medium | Medium | auth 구현과 동일 패턴 적용; 응답 타입 assertion |
| dashboard 페이지 과부하 (북마크 UI 통합) | Low | Low | dashboard에 목록 포함 vs 별도 /bookmarks 라우트 결정 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `src/types/index.ts` | TypeScript type | `Bookmark` 타입 이미 존재 — 변경 없음 |
| `src/lib/bkend.ts` | API Client | `data` API 이미 구현됨 — 변경 없음 |
| `src/app/(main)/dashboard/page.tsx` | Page | 북마크 목록 UI 추가 또는 `/bookmarks` 라우트로 이동 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `dashboard/page.tsx` | READ | 현재 user 이메일 + 로그아웃만 표시 | 북마크 목록 추가로 확장 |
| `bkend.data` | CRUD | 현재 미사용 | 신규 사용 |

### 6.3 Verification

- [x] dashboard 페이지 확장이 auth 세션 복원에 영향 없음
- [x] bkend.data API 호출이 기존 auth API 호출과 충돌 없음

---

## 7. Architecture Considerations

### 7.1 Project Level

**Dynamic** — bkend.ai data API 기반, 기존 auth 패턴 재사용

### 7.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 페이지 구조 | dashboard 확장 (별도 /bookmarks 라우트 불필요) | MVP 범위 최소화, 라우트 추가 불필요 |
| 상태 관리 | `bookmark-store.ts` (Zustand) | auth-store와 동일 패턴 재사용 |
| 데이터 페칭 | TanStack Query 없음, store 내 직접 fetch | auth 패턴 일관성; TQ는 search 단계에서 고려 |
| 태그 입력 | 쉼표 구분 텍스트 → `split(',').map(trim)` | 가장 단순한 구현 |
| 태그 필터 | 클라이언트 사이드 필터 (전체 목록 조회 후 filter) | 서버 필터 없이 MVP 달성 가능 |
| userId 주입 | auth-store에서 `user._id` 읽어 저장 시 자동 주입 | 사용자가 조작 불가 |

### 7.3 Folder Structure Preview

```
src/
├── stores/
│   └── bookmark-store.ts        ← 신규 (list/create/delete + 태그 필터)
├── hooks/
│   └── use-bookmark.ts          ← 신규 (store wrapper, use-auth 패턴 재사용)
├── components/features/bookmark/
│   ├── add-bookmark-form.tsx    ← 신규 (URL + 제목 + 태그 입력)
│   ├── bookmark-card.tsx        ← 신규 (카드 UI + 삭제 버튼)
│   ├── bookmark-list.tsx        ← 신규 (목록 + 빈 상태)
│   └── tag-filter.tsx           ← 신규 (태그 필터 버튼 목록)
└── app/(main)/dashboard/
    └── page.tsx                 ← 수정 (북마크 UI 통합)
```

---

## 8. Convention Prerequisites

### 8.1 기존 컨벤션 확인

- [x] CLAUDE.md 컨벤션 섹션 존재
- [x] kebab-case 파일명
- [x] PascalCase 컴포넌트
- [x] `type` 우선, `any` 금지

### 8.2 환경변수

bookmark 기능은 추가 환경변수 불필요. 기존 `NEXT_PUBLIC_BKEND_PROJECT_ID` 사용.

---

## 9. Next Steps

1. [ ] `/pdca design bookmark` — 설계 문서 작성 (3가지 아키텍처 옵션)
2. [ ] `/pdca do bookmark` — 구현
3. [ ] `/pdca analyze bookmark` — Gap 분석

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-25 | Initial draft | kim_yongjin |
