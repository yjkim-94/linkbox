# Analysis: search (링크 검색 및 필터링)

> PDCA Check Phase — linkbox
> Date: 2026-05-25

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 북마크 증가로 태그 필터 한계 도달 — 키워드 인출로 찾기 비용 제거 |
| **WHO** | 북마크 30개 이상 쌓인 개발자·리서처 (Primary) |
| **RISK** | 하이라이트 XSS (span 분리로 방지됨), 교집합 상태 복잡도 |
| **SUCCESS** | SC-1~SC-7 전체 달성; 키워드·태그 복합 검색 정상 동작 |
| **SCOPE** | SearchBar + debounce + TagFilter 교집합 + 빈 상태 + 하이라이트 |

---

## Match Rate 결과

| 축 | 점수 | 비중 | 기여 |
|----|:----:|:----:|:----:|
| Structural | 100% | 20% | 20.0 |
| Functional | 100% | 40% | 40.0 |
| Contract | 100% | 40% | 40.0 |
| **Overall** | **100%** | | |

> 목표 90% 초과 달성 ✅

---

## 성공 기준 최종 평가

| SC | 기준 | 상태 | 근거 |
|----|------|:----:|------|
| SC-1 | debounce 300ms 반영 | ✅ | `setTimeout(300)` + useEffect cleanup |
| SC-2 | 제목 일부 입력 → 해당 카드만 | ✅ | `bookmark.title.toLocaleLowerCase('ko').includes(q)` |
| SC-3 | URL 도메인 입력 → 해당 카드 | ✅ | `bookmark.url.toLocaleLowerCase('ko').includes(q)` |
| SC-4 | 태그명 입력 → 해당 태그 포함 카드 | ✅ | `bookmark.tags.some(t => t...includes(q))` |
| SC-5 | 태그 필터 + 검색어 교집합 | ✅ | 2단계 `.filter()` 체이닝 |
| SC-6 | 검색어 지우기 → 복귀 | ✅ | `onChange('')` → debouncedQuery 빈 문자열 |
| SC-7 | 매칭 텍스트 bold 강조 | ✅ | `highlightText()` title + tags 모두 적용 |

**성공 기준 달성: 7/7 (100%)**

---

## 발견된 갭

| ID | 심각도 | 내용 | 처리 |
|----|:------:|------|------|
| G1 | Minor | `highlightText`는 첫 번째 매칭만 하이라이트. "react react" → 첫 번째만 bold. 설계 명세에 다중 하이라이트 미포함 | 허용 (100% 달성) |

---

## Decision Record 검증

| 결정 | 준수 여부 |
|------|---------|
| Option C Pragmatic (SearchBar 분리 + hook 로컬 state) | ✅ |
| debounce 직접 구현 (useEffect + setTimeout) | ✅ |
| filteredBookmarks 2단계 filter (activeTag AND debouncedQuery) | ✅ |
| `dangerouslySetInnerHTML` 없이 span 분리 하이라이트 | ✅ |
| SearchBar → TagFilter → BookmarkList 순서 | ✅ |
| bookmark-store 변경 없음 (store 오염 없음) | ✅ |

---

## 다음 단계

`/pdca report search`
