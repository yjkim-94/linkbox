# supabase-migration Planning Document

> **Summary**: bkend.ai BaaS를 Supabase로 교체하여 linkbox를 실제 동작하는 서비스로 전환
>
> **Project**: linkbox
> **Version**: 0.1.0
> **Date**: 2026-05-25
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | bkend.ai가 아직 출시 전 서비스라 API 호출 전부 실패 — 앱이 동작하지 않음 |
| **Solution** | Supabase(PostgreSQL + Auth + RLS)로 교체, `src/lib/bkend.ts` → `src/lib/supabase.ts` |
| **Function/UX Effect** | 회원가입·로그인·북마크 CRUD 전체 정상 동작 |
| **Core Value** | MVP 3기능(auth/bookmark/search) 실제 서비스 가능 상태로 전환 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | bkend.ai 미출시로 linkbox MVP가 실제 동작 불가 |
| **WHO** | linkbox 사용자 (개발자·리서처) |
| **RISK** | Supabase RLS 미설정 시 타사용자 데이터 노출, ID 필드 타입 불일치 (`_id` → `id`) |
| **SUCCESS** | 회원가입·로그인·북마크 CRUD·검색 전체 정상 동작, 빌드 성공 |
| **SCOPE** | lib 교체 + stores 2개 수정 + types 수정 + env 교체 + Supabase 테이블/RLS 설정 |

---

## 1. Overview

### 1.1 Purpose

bkend.ai API가 응답하지 않아 linkbox MVP 전체 기능이 동작하지 않는 상황을 해결.
Supabase로 교체하여 auth → bookmark → search 전체 레이어를 실제 서비스 가능 상태로 전환.

### 1.2 Background

- bkend.ai: 팝업스튜디오가 개발 중인 BaaS이나 현재 미출시 상태 (ECONNREFUSED)
- Supabase: PostgreSQL 기반 오픈소스 BaaS, 무료 플랜, 즉시 사용 가능
- 코드 구조가 REST 패턴으로 잘 분리되어 있어 교체 범위 최소화 가능

---

## 2. Scope

### 2.1 In Scope

- [x] `src/lib/bkend.ts` → `src/lib/supabase.ts` (클라이언트 교체)
- [x] `src/stores/auth-store.ts` (Supabase Auth API 적용)
- [x] `src/stores/bookmark-store.ts` (Supabase Data API 적용)
- [x] `src/types/index.ts` (`_id` → `id`, `userId` → `user_id`)
- [x] `.env.local` (환경변수 교체)
- [x] Supabase `bookmarks` 테이블 SQL + RLS 정책 (가이드 제공)

### 2.2 Out of Scope

- `middleware.ts` 변경 (현재 없음)
- Supabase Realtime / Storage 기능
- 기존 데이터 마이그레이션 (bkend.ai에 실제 데이터 없었음)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | 회원가입 (`signUp`) 정상 동작 | High |
| FR-02 | 로그인 (`signInWithPassword`) + 세션 유지 | High |
| FR-03 | 로그아웃 (`signOut`) | High |
| FR-04 | 북마크 목록 조회 (본인 데이터만) | High |
| FR-05 | 북마크 추가 | High |
| FR-06 | 북마크 삭제 | High |
| FR-07 | 검색 (클라이언트 필터 — 변경 없음) | Medium |
| FR-08 | 세션 복구 (`onAuthStateChange`) | High |

### 3.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| Security | RLS로 타사용자 데이터 격리 (auth.uid() = user_id) |
| 호환성 | 기존 UI 컴포넌트 변경 없음 — store/lib 레이어만 교체 |
| 타입 안전 | TypeScript 타입 일치 (빌드 오류 0) |

---

## 4. Success Criteria

| SC | 기준 |
|----|------|
| SC-1 | 회원가입 → 대시보드 자동 이동 |
| SC-2 | 로그인 → 세션 유지 (새로고침 후도) |
| SC-3 | 북마크 추가 → 목록에 즉시 반영 |
| SC-4 | 북마크 삭제 → 목록에서 제거 |
| SC-5 | 다른 사용자 데이터 접근 불가 (RLS) |
| SC-6 | `npm run build` 성공 (TypeScript 오류 0) |

---

## 5. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| RLS 미설정 시 데이터 노출 | High | 테이블 생성 직후 RLS enable + policy 적용 |
| `_id` → `id` 타입 변경 누락 | High | `types/index.ts` 먼저 수정 후 store 수정 |
| Supabase 세션 쿠키 vs middleware | Medium | middleware 없으므로 client-side 세션만 관리 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change |
|----------|------|--------|
| `src/lib/bkend.ts` | 클라이언트 모듈 | Supabase 클라이언트로 완전 교체 |
| `src/types/index.ts` | 타입 정의 | `BaseDocument._id` → `id`, `Bookmark.userId` → `user_id` |
| `src/stores/auth-store.ts` | Zustand store | bkend auth → supabase.auth |
| `src/stores/bookmark-store.ts` | Zustand store | bkend.data → supabase.from() |

### 6.2 Current Consumers

| Resource | Consumer | Impact |
|----------|----------|--------|
| `bkend` import | `auth-store.ts`, `bookmark-store.ts` | 교체 필요 |
| `User._id` | `auth-store.ts`, `bookmark-store.ts` | `id`로 변경 |
| `Bookmark._id` | `bookmark-card.tsx` (key prop) | `id`로 변경 |
| `Bookmark.userId` | `bookmark-store.ts` | `user_id`로 변경 |

---

## 7. Supabase 설정 가이드

### 7.1 프로젝트 생성

1. [supabase.com](https://supabase.com) → New Project
2. Project URL, anon key 복사 → `.env.local` 입력

### 7.2 테이블 + RLS SQL

```sql
-- bookmarks 테이블 생성
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  url text not null,
  title text not null,
  description text,
  tags text[] default '{}',
  favicon text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS 활성화
alter table bookmarks enable row level security;

-- 본인 데이터만 접근 가능
create policy "users can manage own bookmarks" on bookmarks
  for all using (auth.uid() = user_id);
```

### 7.3 환경변수 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 8. Architecture Considerations

### 8.1 Key Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Supabase client | `@supabase/supabase-js` | 공식 SDK, 타입 지원 |
| 세션 관리 | Supabase 자동 (localStorage) | 수동 token 관리 제거 |
| ID 필드 | `id: string` (UUID) | Supabase 기본값 |
| RLS | 활성화 | 타사용자 데이터 격리 |
| 토큰 쿠키 미러링 | 제거 | middleware 없으므로 불필요 |

---

## 9. Next Steps

1. [ ] Supabase 프로젝트 생성 + SQL 실행
2. [ ] `/pdca design supabase-migration` 또는 바로 `/pdca do supabase-migration`
3. [ ] `npm install @supabase/supabase-js`
4. [ ] 코드 교체 (lib → stores → types → env)
5. [ ] `npm run build` 확인
6. [ ] 브라우저 동작 테스트 (SC-1 ~ SC-6)
