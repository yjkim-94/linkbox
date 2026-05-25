# Report: search (링크 검색 및 필터링)

> PDCA Completion Report — linkbox
> Date: 2026-05-25 | Match Rate: 100%

---

## 1. Executive Summary

| 관점 | 계획 | 실제 결과 |
|------|------|---------|
| **Problem** | 북마크가 쌓일수록 태그 필터만으론 찾기 어렵다. 제목·URL을 부분적으로만 기억할 때 목록 전체를 스크롤해야 한다. | 키워드 입력 즉시 제목·URL·태그 동시 검색으로 북마크 인출 레이어 완성 |
| **Solution** | SearchBar(debounce 300ms) + TagFilter 교집합 + 클라이언트 필터 | use-bookmark hook 확장으로 store 오염 없이 완전 구현 |
| **Function UX Effect** | 검색어 입력 → 300ms 후 매칭 카드만 표시, bold 하이라이트 | SC 7/7 달성, 빌드 성공 |
| **Core Value** | bookmark가 저장 레이어라면 search는 인출 레이어 — linkbox MVP 완성 | auth → bookmark → search 3기능 PDCA 사이클 전체 완료 |

### 1.3 Value Delivered

- **클라이언트 검색**: bkend.ai 추가 API 없음 — 이미 메모리의 bookmarks 배열을 `.filter()` 체이닝으로 즉시 처리
- **복합 필터**: TagFilter 선택 + 검색어 교집합 — 단일 `filteredBookmarks` computed에서 통합 처리
- **하이라이트**: `highlightText()` — `dangerouslySetInnerHTML` 없이 span 분리 방식으로 XSS 방지
- **debounce**: 직접 구현 (`useEffect + setTimeout`) — 의존성 추가 없음

---

## 2. PDCA 여정 요약

```
PM → Plan → Design → Do → Check → Report
 ✅     ✅      ✅      ✅     ✅       ✅
```

| 단계 | 주요 산출물 | 결과 |
|------|-----------|------|
| PM | `docs/00-pm/search.prd.md` | PRD 완성, 클라이언트 검색 전략 확정 |
| Plan | `docs/01-plan/features/search.plan.md` | 7개 SC, debounce 직접 구현·하이라이트 SC-7 확정 |
| Design | `docs/02-design/features/search.design.md` | Option C Pragmatic 선택, SearchBar 분리 + hook 로컬 state |
| Do | 신규 1 + 수정 4파일 구현 | 빌드 성공, SC 7/7 구현 |
| Check | `docs/03-analysis/search.analysis.md` | Match Rate 100%, SC 7/7 |

---

## 3. 성공 기준 최종 현황

| SC | 기준 | 결과 | 근거 |
|----|------|:----:|------|
| SC-1 | 검색창 입력 → 300ms 내 결과 반영 | ✅ | `useEffect(() => { setTimeout(300) }, [searchQuery])` |
| SC-2 | 제목 일부 입력 → 해당 카드만 | ✅ | `bookmark.title.toLocaleLowerCase('ko').includes(q)` |
| SC-3 | URL 도메인 입력 → 해당 카드 | ✅ | `bookmark.url.toLocaleLowerCase('ko').includes(q)` |
| SC-4 | 태그명 입력 → 해당 태그 포함 카드 | ✅ | `bookmark.tags.some(t => t...includes(q))` |
| SC-5 | 태그 필터 + 검색어 교집합 | ✅ | 2단계 `.filter()` 체이닝 |
| SC-6 | 검색어 지우기 → 전체 복귀 | ✅ | X 버튼 `onChange('')` → `debouncedQuery` 빈 문자열 |
| SC-7 | 매칭 텍스트 bold 강조 | ✅ | `highlightText()` title + tags 적용 |

**성공률: 7/7 (100%)**

---

## 4. Key Decisions & Outcomes

| 결정 | 근거 | 결과 |
|------|------|------|
| **Option C Pragmatic** (Design) | bookmark 패턴 재사용, SearchBar만 분리 | hook 로컬 state로 store 오염 없음, 신규 파일 1개 |
| **클라이언트 검색** (PRD) | bkend.ai 추가 API 없음, MVP 규모에서 충분 | 서버 왕복 0, 즉시 반응 UX |
| **debounce 직접 구현** (Plan) | `use-debounce` 패키지 추가 없음 | `useEffect + setTimeout` 10줄, 의존성 0 추가 |
| **2단계 filter** (Design) | activeTag AND debouncedQuery 단일 computed | `filteredBookmarks` 하나로 교집합 처리 |
| **span 분리 하이라이트** (Design) | `dangerouslySetInnerHTML` XSS 위험 | `highlightText()` — React.ReactNode 반환, 안전 |
| **SC-7 하이라이트** (Plan Checkpoint 2) | Checkpoint 2에서 사용자 확인으로 Could → Must 격상 | title + tags bold 하이라이트 완전 구현 |

---

## 5. 발견된 갭 및 처리 이력

| ID | 심각도 | 내용 | 처리 |
|----|:------:|------|------|
| G1 | Minor | `highlightText`는 첫 번째 매칭만 bold (다중 매칭 미지원) | 허용 — 설계 명세에 다중 하이라이트 미포함, MVP 충분 |

---

## 6. 구현된 파일 목록

```
src/
├── components/features/search/
│   └── search-bar.tsx               ← [신규] 검색창 + X 버튼 + aria-label
├── hooks/
│   └── use-bookmark.ts              ← [수정] searchQuery + debounce + matchesQuery + 2단계 filter
├── components/features/bookmark/
│   ├── bookmark-card.tsx            ← [수정] searchQuery prop + highlightText (title, tags)
│   └── bookmark-list.tsx            ← [수정] searchQuery prop + 빈 상태 분기
└── app/(main)/dashboard/
    └── page.tsx                     ← [수정] SearchBar 추가 (TagFilter 위)
```

**신규: 1개 파일 / 수정: 4개 파일**

---

## 7. linkbox MVP 완성 — 3기능 PDCA 전체 현황

| 기능 | Match Rate | SC | 상태 |
|------|:----------:|:--:|:----:|
| auth | 95.4% | 6/6 | ✅ completed |
| bookmark | 98% | 6/6 | ✅ completed |
| search | 100% | 7/7 | ✅ completed |

**linkbox MVP 3기능 전체 완료** — auth(인증) → bookmark(저장) → search(인출) 레이어 완성

### 미결 사항 (Out of Scope → 후속 검토)

**search 관련:**
- 검색어 다중 하이라이트 (G1)
- 서버사이드 풀텍스트 검색 (대규모 데이터 대응)
- 검색 히스토리 / 자동완성

**전체 linkbox 후속:**
- `.env.local` `NEXT_PUBLIC_BKEND_PROJECT_ID` 실제 값 설정 (console.bkend.ai)
- Vercel 배포
- OG 이미지 자동 파싱
- 북마크 수정 기능

---

## 8. Match Rate

| 축 | 점수 | 비중 | 기여 |
|----|:----:|:----:|:----:|
| Structural | 100% | 20% | 20.0 |
| Functional | 100% | 40% | 40.0 |
| Contract | 100% | 40% | 40.0 |
| **Overall** | **100%** | | ✅ |

> 목표 90% 대비 +10%p 초과 달성
