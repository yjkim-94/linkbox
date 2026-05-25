# Plan: auth (회원가입 / 로그인)

> PDCA Plan Phase — linkbox
> Date: 2026-05-25 | Project Level: Dynamic

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 북마크 데이터가 기기·세션에 종속되어 다기기 접근이 불가하고 데이터 소유권이 불명확하다. |
| **Solution** | 이메일/비밀번호 인증 + JWT 세션 유지 + 보호 라우트로 "내 데이터" 귀속 레이어를 구축한다. |
| **Function UX Effect** | 한 번 로그인 후 새로고침·재방문에도 세션이 유지되고, 비로그인 시 보호 페이지 접근이 차단된다. |
| **Core Value** | bookmark·search 모든 후속 기능의 데이터 귀속 기반 신뢰 레이어. |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | bookmark/search가 의미를 가지려면 데이터가 특정 사용자에게 귀속되어야 함. auth가 그 단일 진입점. |
| **WHO** | 다기기 사용 개발자·리서처 (Primary), 가벼운 수집가 (Secondary) |
| **RISK** | bkend.ai Auth 연동 불안정(P0), 토큰 보관 보안(클라이언트 JWT 탈취), 세션 복원 불안정 |
| **SUCCESS** | 가입 성공률 ≥95%, 로그인 성공률 ≥98%, 세션 복원율 ≥99%, 보호 라우트 차단율 100% |
| **SCOPE** | In: 이메일/PW 가입·로그인·로그아웃, JWT 세션, 보호 라우트 / Out: 소셜 로그인, PW 재설정, RBAC |

---

## 1. 기능 요구사항 (FR)

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-1 | bkend.ai Auth signup/login API 연동, 성공 시 JWT(accessToken·refreshToken) 수신 | Must |
| FR-2 | 인증 상태를 Zustand `auth-store`에서 관리 (user, accessToken, status: idle/loading/authenticated/unauthenticated) | Must |
| FR-3 | 앱 로드 시 localStorage의 accessToken으로 `/auth/me` 호출 → 세션 복원 | Must |
| FR-4 | 보호 라우트 가드: 미인증 → `/login` 리다이렉트, 인증 상태에서 `/login` → `/dashboard` 리다이렉트 | Must |
| FR-5 | 로그아웃 시 `bkend.auth.signout()` 호출 + localStorage 토큰 제거 + 스토어 초기화 | Must |
| FR-6 | 폼 클라이언트 검증: 이메일 형식, 비밀번호 최소 8자. 서버 에러 인라인 표시 | Must |

---

## 2. 비기능 요구사항 (NFR)

| 항목 | 요구사항 |
|------|---------|
| **보안** | 토큰 저장: localStorage (MVP 범위). httpOnly 쿠키는 추후 고려. 짧은 accessToken 만료 + refreshToken 갱신 정책 |
| **성능** | 로그인·세션 복원 체감 지연 최소화 (BaaS API 왕복 기준) |
| **접근성** | 폼 레이블·에러 메시지 스크린리더 대응 (`aria-describedby`) |
| **코드 규약** | 파일 kebab-case, 컴포넌트 PascalCase, `type` 우선, `any` 금지 (CLAUDE.md 준수) |

---

## 3. 토큰 저장 정책 (결정)

> MVP 범위에서는 **localStorage** 사용. 이유: bkend.ai REST API 기반으로 httpOnly 쿠키 설정이 BaaS 제약으로 복잡하며, MVP 검증 속도 우선. 보안 강화는 bookmark 기능 완료 후 별도 검토.

- `bkend_access_token` → localStorage
- `bkend_refresh_token` → localStorage
- 만료 시: `/auth/me` 실패 → 스토어 초기화 → `/login` 리다이렉트

---

## 4. 세션 만료 정책 (결정)

> 만료 시 **자동 로그아웃** (재인증 팝업 없음). 이유: MVP 단순성 우선. 사용자 경험상 로그아웃보다 팝업 방해가 더 큰 마찰.

---

## 5. 파일 구조 계획

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (main)/
│       └── dashboard/page.tsx        ← 보호 라우트
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── input.tsx
│   └── features/auth/
│       ├── login-form.tsx
│       └── register-form.tsx
├── hooks/
│   └── use-auth.ts                   ← auth-store wrapper hook
├── lib/
│   └── bkend.ts                      ← 기존 (수정 없음)
├── stores/
│   └── auth-store.ts                 ← 기존 (수정 필요)
└── middleware.ts                     ← Next.js 보호 라우트 가드
```

---

## 6. 구현 순서

1. **bkend.ai Auth 스파이크** — signup/login API 직접 curl 테스트 (P0 가정 검증)
2. **auth-store 완성** — status 필드 추가, fetchMe 보강
3. **middleware.ts** — 보호 라우트 가드
4. **UI 컴포넌트** — Button, Input (기본 ui/)
5. **login/register 페이지** — 폼 + 검증 + 에러 처리
6. **dashboard 페이지** — 로그인 후 진입점 (빈 화면)
7. **세션 복원 연결** — layout.tsx에서 앱 로드 시 fetchMe 호출

---

## 7. 성공 기준 (Success Criteria)

| SC | 기준 | 측정 방법 |
|----|------|---------|
| SC-1 | 유효 이메일/PW로 회원가입 성공 → 자동 로그인 + dashboard 진입 | 수동 테스트 |
| SC-2 | 올바른 자격증명 로그인 → dashboard 진입 | 수동 테스트 |
| SC-3 | 로그아웃 → localStorage 토큰 제거 + 보호 라우트 접근 차단 | 수동 테스트 |
| SC-4 | 로그인 후 새로고침/재방문 → 세션 유지 | 수동 테스트 |
| SC-5 | 비로그인 상태로 `/dashboard` 접근 → `/login` 리다이렉트 | 수동 테스트 |
| SC-6 | 중복 이메일·잘못된 형식·짧은 PW → 인라인 에러 표시 | 수동 테스트 |

---

## 8. 리스크 & 완화책

| 리스크 | 심각도 | 완화책 |
|--------|:------:|--------|
| bkend.ai Auth API 미동작 (A5) | Critical | 구현 전 curl 스파이크로 먼저 검증 |
| 세션 복원 불안정 | High | `fetchMe` 실패 시 명확한 fallback(로그아웃) |
| 토큰 탈취 | Medium | MVP 범위 localStorage 인정, 추후 httpOnly 쿠키 전환 태스크로 분리 |

---

## 9. 의존성

- `bkend.ts` REST 클라이언트 (기존)
- `auth-store.ts` Zustand 스토어 (기존, 수정 필요)
- `NEXT_PUBLIC_BKEND_PROJECT_ID` 환경변수 설정 완료 필요
- Next.js middleware (신규)

---

## 다음 단계

`/pdca design auth`
