# Analysis: auth (회원가입 / 로그인)

> PDCA Check Phase — linkbox
> Date: 2026-05-25

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | bookmark/search의 데이터 귀속 기반 신뢰 레이어 |
| **WHO** | 다기기 개발자·리서처 (Primary) |
| **RISK** | bkend.ai Auth 연동(P0), localStorage 토큰 보안, 세션 복원 불안정 |
| **SUCCESS** | 가입 ≥95%, 로그인 ≥98%, 세션 복원 ≥99%, 라우트 차단 100% |
| **SCOPE** | 이메일/PW 가입·로그인·로그아웃 + JWT 세션 + 보호 라우트 |

---

## Match Rate 결과

| 축 | 점수 | 비중 | 기여 |
|----|:----:|:----:|:----:|
| Structural | 97% | 20% | 19.4 |
| Functional | 85% → **95%** (수정 후) | 40% | 38.0 |
| Contract | 95% | 40% | 38.0 |
| **Overall** | **95.4%** | | |

> 수정 전: 91.4% → 수정 후: **95.4%** ✅ (목표 90% 초과)

---

## 성공 기준 최종 평가

| SC | 기준 | 상태 |
|----|------|------|
| SC-1 | 유효 가입 → 자동 로그인 + dashboard | ✅ 완료 |
| SC-2 | 올바른 로그인 → dashboard | ✅ 완료 |
| SC-3 | 로그아웃 → 토큰·쿠키 제거 | ✅ 완료 |
| SC-4 | 새로고침 → 세션 유지 | ✅ 완료 |
| SC-5 | 비로그인 `/dashboard` → `/login` | ✅ 완료 |
| SC-6 | 잘못된 입력 → 인라인 에러 | ✅ 완료 |

**성공 기준 달성: 6/6 (100%)**

---

## 발견된 갭 및 수정

| ID | 심각도 | 내용 | 수정 |
|----|:------:|------|------|
| G1 | Important | 쿠키 max-age=3600 하드코딩 | 환경변수 `NEXT_PUBLIC_TOKEN_MAX_AGE`로 분리 |
| G2 | Minor | dashboard 로딩 중 빈 화면 | 스피너 로딩 UI 추가 |
| G3 | Minor | 루트 `/` 기본 Next.js 화면 | `/login`으로 redirect 추가 |

---

## Decision Record 검증

| 결정 | 준수 여부 |
|------|---------|
| Option C Pragmatic (Hook + 폼 분리 + proxy) | ✅ 준수 |
| 토큰 저장: localStorage + 쿠키 미러링 | ✅ 준수 |
| 만료 시 자동 로그아웃 | ✅ 준수 |
| 비밀번호 8자 이상 | ✅ 준수 |
| Next.js 16 proxy 파일명 적용 | ✅ 적용 (middleware.ts → proxy.ts) |

---

## 다음 단계

`/pdca report auth`
