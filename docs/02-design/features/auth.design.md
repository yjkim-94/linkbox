# Design: auth (회원가입 / 로그인)

> PDCA Design Phase — linkbox
> Date: 2026-05-25 | Architecture: Option C (Pragmatic Balance)

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | bookmark/search가 의미를 가지려면 데이터가 특정 사용자에게 귀속되어야 함. auth가 그 단일 진입점. |
| **WHO** | 다기기 사용 개발자·리서처 (Primary), 가벼운 수집가 (Secondary) |
| **RISK** | bkend.ai Auth 연동 불안정(P0), 토큰 보관 보안(localStorage), 세션 복원 불안정 |
| **SUCCESS** | 가입 성공률 ≥95%, 로그인 성공률 ≥98%, 세션 복원율 ≥99%, 보호 라우트 차단율 100% |
| **SCOPE** | In: 이메일/PW 가입·로그인·로그아웃, JWT 세션, 보호 라우트 / Out: 소셜 로그인, PW 재설정, RBAC |

---

## 1. 선택된 아키텍처: Option C — Pragmatic Balance

Hook으로 스토어를 래핑하고, 폼 컴포넌트는 UI만 담당, middleware로 라우트 가드 처리.
bookmark/search에서도 동일 패턴 재사용 가능한 구조.

---

## 2. 파일 구조

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx             ← use-auth Hook 사용, 레이아웃만
│   │   └── register/
│   │       └── page.tsx             ← use-auth Hook 사용, 레이아웃만
│   ├── (main)/
│   │   └── dashboard/
│   │       └── page.tsx             ← 보호 라우트 (인증 필요)
│   └── layout.tsx                   ← 수정: 앱 로드 시 fetchMe 호출
├── components/
│   ├── ui/
│   │   ├── button.tsx               ← 신규
│   │   └── input.tsx                ← 신규
│   └── features/auth/
│       ├── login-form.tsx           ← 신규: 폼 UI + 클라이언트 검증
│       └── register-form.tsx       ← 신규: 폼 UI + 클라이언트 검증
├── hooks/
│   └── use-auth.ts                  ← 신규: auth-store 래퍼 Hook
├── stores/
│   └── auth-store.ts               ← 수정: status 필드, fetchMe 보강
├── lib/
│   └── bkend.ts                    ← 기존 (변경 없음)
├── types/
│   └── index.ts                    ← 수정: AuthStatus 타입 추가
└── middleware.ts                    ← 신규: 보호 라우트 가드
```

---

## 3. 데이터 모델

### AuthStatus
```typescript
type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
```

### AuthStore State
```typescript
interface AuthState {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}
```

### Token 저장 (localStorage)
```
bkend_access_token   → JWT accessToken
bkend_refresh_token  → refreshToken
```

---

## 4. API 명세

| Method | Endpoint | 요청 | 응답 | 비고 |
|--------|----------|------|------|------|
| POST | `/auth/email/signup` | `{email, password}` | `{user, accessToken, refreshToken}` | 회원가입 |
| POST | `/auth/email/signin` | `{email, password}` | `{user, accessToken, refreshToken}` | 로그인 |
| GET | `/auth/me` | - (Bearer) | `{user}` | 세션 복원 |
| POST | `/auth/signout` | - (Bearer) | `{success}` | 로그아웃 |

모든 인증 필요 요청: `Authorization: Bearer {accessToken}` 헤더 포함 (`bkend.ts` 자동 처리).

---

## 5. 컴포넌트 설계

### use-auth.ts (Hook)
```typescript
// auth-store 래퍼 — 컴포넌트는 이 Hook만 사용
export function useAuth() {
  const { user, status, login, register, logout } = useAuthStore();
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  return { user, status, isAuthenticated, isLoading, login, register, logout };
}
```

### login-form.tsx
- 입력: email, password
- 클라이언트 검증: 이메일 형식(regex), 비밀번호 8자 이상
- 에러 표시: 필드별 인라인 + 서버 에러 상단 배너
- 제출: `useAuth().login()` 호출 → 성공 시 `/dashboard` push

### register-form.tsx
- 입력: email, password (confirm-password는 MVP 제외)
- 클라이언트 검증: 동일
- 제출: `useAuth().register()` 호출 → 성공 시 `/dashboard` push

### Button / Input (ui/)
- Tailwind 기반 기본 스타일
- Input: `aria-describedby`로 에러 메시지 연결 (접근성)

---

## 6. 보호 라우트 (middleware.ts)

```
보호 경로: /dashboard, /bookmarks (추후), /search (추후)
공개 경로: /login, /register, / (랜딩)

로직:
- 비인증 + 보호 경로 → /login?redirect={원래 경로}
- 인증됨 + /login or /register → /dashboard
```

Next.js `middleware.ts` 사용. localStorage는 서버에서 접근 불가 → 쿠키에 accessToken 미러링 필요.

> **설계 결정**: 미들웨어는 쿠키 기반으로 동작. 로그인 성공 시 `document.cookie`에도 accessToken 저장, 로그아웃 시 쿠키 제거.

---

## 7. 세션 복원 흐름

```
앱 로드 (layout.tsx)
  │
  ├─ localStorage에 accessToken 있음?
  │     YES → GET /auth/me
  │              성공 → status: 'authenticated', user 세팅
  │              실패 → localStorage 토큰 제거, status: 'unauthenticated'
  │
  └─ accessToken 없음 → status: 'unauthenticated'
```

---

## 8. 테스트 계획

| 레벨 | 테스트 | 방법 |
|------|--------|------|
| L1 (수동) | 회원가입 성공/실패, 로그인 성공/실패 | 브라우저 직접 |
| L1 (수동) | 로그아웃 → 토큰 제거 확인 | DevTools > Application > localStorage |
| L1 (수동) | 새로고침 → 세션 유지 | 브라우저 새로고침 |
| L2 (수동) | 비로그인 `/dashboard` 접근 → `/login` 리다이렉트 | URL 직접 입력 |
| L2 (수동) | 로그인 상태 `/login` 접근 → `/dashboard` 리다이렉트 | URL 직접 입력 |
| L3 (수동) | 잘못된 이메일·짧은 PW → 인라인 에러 표시 | 폼 입력 |

---

## 9. 구현 순서

1. `src/types/index.ts` — AuthStatus 타입 추가
2. `src/stores/auth-store.ts` — status 필드, register 액션, 쿠키 미러링 추가
3. `src/hooks/use-auth.ts` — 스토어 래퍼 Hook
4. `src/middleware.ts` — 보호 라우트 가드
5. `src/components/ui/button.tsx` — 기본 Button
6. `src/components/ui/input.tsx` — 기본 Input (aria 포함)
7. `src/components/features/auth/login-form.tsx`
8. `src/components/features/auth/register-form.tsx`
9. `src/app/(auth)/login/page.tsx`
10. `src/app/(auth)/register/page.tsx`
11. `src/app/(main)/dashboard/page.tsx` — 빈 화면
12. `src/app/layout.tsx` — fetchMe 호출 추가

---

## 10. Session Guide

### Module Map

| 모듈 | 파일 | 예상 시간 |
|------|------|---------|
| M1: 기반 (타입·스토어·Hook) | types, auth-store, use-auth | 20분 |
| M2: 라우트 가드 | middleware.ts | 15분 |
| M3: UI 컴포넌트 | button, input, login-form, register-form | 30분 |
| M4: 페이지 + 세션 | login/page, register/page, dashboard/page, layout | 20분 |

### 추천 세션 플랜
- **단일 세션**: M1 → M2 → M3 → M4 (전체 85분)
- **2세션 분리**: 세션1: M1+M2 / 세션2: M3+M4

```
/pdca do auth --scope M1,M2   # 세션 1
/pdca do auth --scope M3,M4   # 세션 2
```

---

## 다음 단계

`/pdca do auth`
