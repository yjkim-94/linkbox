@AGENTS.md

# linkbox

## Project Level
**Dynamic** — Fullstack app (Next.js + bkend.ai BaaS)

## Tech Stack
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS
- State: Zustand + TanStack Query
- Backend: bkend.ai (Auth, Database)

## Features
1. **auth** — 회원가입 / 로그인
2. **bookmark** — 링크 저장, 태그 관리
3. **search** — 링크 검색 및 필터링

## Package Manager
**항상 npm 사용** (yarn, pnpm 금지)

## Conventions
- 파일명: kebab-case
- 컴포넌트: PascalCase
- 타입은 `type` 우선, `any` 사용 금지

## Key Paths
- `src/lib/bkend.ts` — bkend.ai REST 클라이언트
- `src/stores/auth-store.ts` — 인증 상태 (Zustand)
- `src/types/index.ts` — 공통 타입 정의
- `docs/` — PDCA 문서

## bkend.ai MCP
- MCP 서버: `.mcp.json` 설정 완료
- Project ID: `.env.local`의 `NEXT_PUBLIC_BKEND_PROJECT_ID` 설정 필요

## PDCA Status
- [ ] auth
- [ ] bookmark
- [ ] search
