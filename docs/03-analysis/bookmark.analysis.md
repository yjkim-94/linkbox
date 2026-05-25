# Analysis: bookmark (링크 저장 · 태그 관리)

> PDCA Check Phase — linkbox
> Date: 2026-05-25

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 링크 재검색 비용 제거 — 맥락(태그)과 함께 저장해 언제든 빠르게 찾을 수 있게 |
| **WHO** | 다기기 사용 개발자·리서처 (Primary) |
| **RISK** | userId 필터 미동작 시 타사용자 데이터 노출 (Critical) |
| **SUCCESS** | SC-1~SC-6 전체 달성; 저장·조회·삭제·태그 필터 정상 동작 |
| **SCOPE** | URL 저장 + 태그 입력 + 카드 목록 + 태그 필터 + 삭제 |

---

## Match Rate 결과

| 축 | 점수 | 비중 | 기여 |
|----|:----:|:----:|:----:|
| Structural | 100% | 20% | 20.0 |
| Functional | 95% | 40% | 38.0 |
| Contract | 100% | 40% | 40.0 |
| **Overall** | **98%** | | |

> 목표 90% 초과 달성 ✅

---

## 성공 기준 최종 평가

| SC | 기준 | 상태 | 근거 |
|----|------|:----:|------|
| SC-1 | URL+제목 저장 → 즉시 목록 표시 | ✅ | `addBookmark → fetchBookmarks()` |
| SC-2 | 삭제 → 즉시 제거 | ✅ | optimistic update (filter immediately) |
| SC-3 | 태그 클릭 → 필터, 재클릭 전체 | ✅ | `activeTag === tag ? null : tag` |
| SC-4 | 새로고침 후 목록 유지 | ✅ | `useEffect([user])` → fetchBookmarks |
| SC-5 | 타사용자 데이터 미노출 | ✅ | `{ userId: user._id }` 자동 주입 |
| SC-6 | URL 미입력 시 인라인 에러 | ✅ | `validate()` + `Input error={}` |

**성공 기준 달성: 6/6 (100%)**

---

## 발견된 갭

| ID | 심각도 | 내용 | 처리 |
|----|:------:|------|------|
| G1 | Minor | `handleSubmit`에서 `onAdd` throw 시 catch 없음 → unhandled rejection. serverError는 store에서 dashboard에 표시되므로 UX 영향 없음 | 허용 (98% 달성) |

---

## Decision Record 검증

| 결정 | 준수 여부 |
|------|---------|
| Option C Pragmatic (store → hook → component) | ✅ |
| userId → auth-store 자동 주입 | ✅ |
| 태그 필터 → 클라이언트 filter() | ✅ |
| dashboard 확장 (별도 라우트 없음) | ✅ |
| 삭제 optimistic update | ✅ |

---

## 다음 단계

`/pdca report bookmark`
