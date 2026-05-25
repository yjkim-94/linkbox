# PRD: search (링크 검색 및 필터링)

> Product Requirements Document — linkbox
> Date: 2026-05-25 | Project Level: Dynamic (Next.js + bkend.ai)

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 북마크가 쌓일수록 태그 필터만으로는 찾기 어렵다. "제목이 뭐였지?"를 기억하지 못할 때, 목록 전체를 스크롤해야 한다. |
| **Solution** | 제목·URL·태그를 가로지르는 키워드 검색을 제공해 북마크 수에 관계없이 1초 내 원하는 링크를 꺼낼 수 있게 한다. |
| **Function UX Effect** | 검색창에 입력하면 실시간(debounce 300ms)으로 매칭 카드만 남고, 태그 필터와 조합해 교집합 결과를 즉시 확인할 수 있다. |
| **Core Value** | "저장하면 반드시 다시 찾을 수 있다"의 완성 — bookmark가 저장 레이어라면 search는 인출 레이어다. |

search는 linkbox의 **세 번째이자 마지막 MVP 기능**이다. auth → bookmark로 쌓인 데이터를 비로소 빠르게 꺼내 쓸 수 있게 하는 완성 레이어다. 클라이언트 검색(이미 메모리에 있는 bookmark 배열 필터)으로 구현하여 서버 왕복 없이 즉각 반응하며, MVP 규모에서 충분하다.

---

## 1. Discovery — 기회 분석 (Teresa Torres OST)

### 1.1 5-Step Discovery Chain

**Step 1 — Brainstorm**
- 북마크 50개 이상 쌓이면 태그 필터만으로는 원하는 링크 찾기 어려움
- "제목에 뭔가 있었던 것 같은데..."처럼 부분적 기억만 남을 때 검색 불가
- 여러 태그를 동시에 좁히고 싶은 니즈 (태그 + 키워드 조합)
- URL에 도메인명을 기억하는 경우 (`github.com/...` 같은 패턴)
- 같은 주제 링크들을 한번에 모아보고 싶은 니즈

**Step 2 — Assumptions**
- A1: 사용자는 제목·태그의 일부만 기억하고 검색을 시도한다
- A2: 클라이언트 검색(메모리 필터)이 MVP 규모(≤500개 북마크)에서 충분히 빠르다
- A3: 검색 + 태그 필터 조합이 단독 검색보다 더 정확한 결과를 준다
- A4: debounce 300ms가 실시간 반응처럼 느껴지면서 불필요한 렌더를 방지한다
- A5: 검색어 하이라이트(bold)가 UX 만족도를 높인다 (Could 항목)

**Step 3 — Prioritize**

| 가정 | Impact | Risk | 우선순위 |
|------|:------:|:----:|:--------:|
| A2 (클라이언트 검색 성능) | High | Low | **P0** |
| A1 (부분 키워드 매칭) | High | Low | **P0** |
| A3 (검색 + 태그 조합) | Med | Low | P1 |
| A4 (debounce 300ms) | Med | Low | P1 |
| A5 (하이라이트) | Low | Low | P2 |

**Step 4 — Experiments**
- E1: 100개 북마크 배열에 `.filter()` 성능 측정 → 1ms 이하 예상
- E2: 한글 검색어 대소문자 무관 매칭 (`toLocaleLowerCase('ko')`)
- E3: 태그 필터 + 검색어 동시 적용 시 교집합 결과 정합성 확인

**Step 5 — OST 합성**

```
Outcome: 저장한 링크를 키워드로 즉시 찾을 수 있다
├── Opportunity: 제목/URL을 부분적으로만 기억하는 상황
│   └── Solution: SearchBar (실시간 키워드 필터)
├── Opportunity: 태그 + 키워드 복합 조건 검색
│   └── Solution: 기존 TagFilter + SearchBar 교집합
└── Opportunity: 검색 결과가 0개일 때 UX 안내
    └── Solution: "검색 결과 없음" 빈 상태 메시지
```

---

## 2. Strategy — 가치 제안 (JTBD 6-Part)

### 2.1 JTBD (Jobs-to-be-Done)

| 파트 | 내용 |
|------|------|
| **When** | "그 리액트 훅 관련 링크 어딨더라"처럼 부분적 기억으로 링크를 찾으려 할 때 |
| **I want to** | 키워드 몇 글자만 입력하면 즉시 매칭 결과를 볼 수 있게 |
| **So I can** | 목록 전체를 스크롤하거나 재검색 없이 바로 해당 링크를 열 수 있도록 |
| **But** | 현재 태그 필터는 정확한 태그명을 알아야 하고, 제목 일부로는 검색이 안 됨 |
| **Which means** | 저장했지만 "찾을 수 없는 링크"가 쌓일수록 북마크 앱의 가치가 떨어짐 |
| **Value** | 키워드 → 즉시 매칭 → 클릭 = 링크함의 완전한 "인출 레이어" 완성 |

### 2.2 Lean Canvas (핵심 요소)

| 블록 | 내용 |
|------|------|
| **Problem** | 북마크 증가 → 태그 필터만으론 찾기 어려움, 제목 부분 기억만 남음 |
| **Customer Segment** | 북마크 30개 이상 쌓인 다기기 개발자·리서처 |
| **Unique Value** | 검색 + 태그 조합, 설치 없이 즉시, 클라이언트 실시간 반응 |
| **Solution** | SearchBar (debounce 300ms, 제목+URL+태그 다중 필드 검색) |
| **Key Metrics** | 검색 사용율, 검색 후 링크 클릭율, 검색 결과 0건 비율 |
| **Cost Structure** | 추가 bkend.ai API 호출 없음 (클라이언트 필터) |

---

## 3. Research — 사용자 및 시장 분석

### 3.1 Personas

**Persona 1: 박준혁 (개발자, 28세)**
- 북마크 200개 이상 쌓인 상황, 태그를 항상 붙이진 않음
- 핵심 니즈: "hooks" 타이핑 → React hooks 관련 링크 즉시 뽑기

**Persona 2: 이수진 (UX 리서처, 31세)**
- 프로젝트별로 수집한 링크를 나중에 "그 figma 관련"처럼 기억
- 핵심 니즈: URL 도메인(`figma.com`)으로도 검색되길 원함

**Persona 3: 김태양 (사이드 프로젝트 빌더, 25세)**
- 태그를 자주 쓰지 않아 제목 검색에 의존
- 핵심 니즈: 검색창 하나로 빠르게 찾고 싶음

### 3.2 경쟁 분석

| 서비스 | 검색 방식 | linkbox 차별화 |
|--------|---------|--------------|
| Pocket | 서버 풀텍스트 검색 | linkbox: 클라이언트 즉시 반응 (0 latency) |
| Raindrop.io | 서버 검색 + 태그 조합 | linkbox: 경량, 설치 불필요 |
| 브라우저 북마크 | 제목만 검색 | linkbox: URL + 태그 포함 다중 필드 |
| Notion | 전체 텍스트 검색 | linkbox: 링크 특화 검색 UX |

### 3.3 시장 규모
- bookmark 기능의 SOM 5만 명 중 활성 사용자가 30개 이상 북마크를 쌓을수록 search 필요성 증가
- search는 bookmark 유지율(retention)을 높이는 핵심 기능

---

## 4. 기능 요구사항

### 4.1 핵심 기능 (MVP)

| ID | 기능 | 우선순위 |
|----|------|:--------:|
| F1 | SearchBar: 키워드 입력 → 실시간(debounce 300ms) 결과 반영 | Must |
| F2 | 검색 범위: 제목(title) + URL(url) + 태그(tags) 동시 검색 | Must |
| F3 | 기존 TagFilter와 교집합: 태그 선택 상태에서 검색어 추가 가능 | Must |
| F4 | 검색어 지우면 전체 목록으로 복귀 | Must |
| F5 | 검색 결과 0건 → "검색 결과가 없습니다 (keyword)" 빈 상태 | Should |
| F6 | 검색어 하이라이트 (매칭 텍스트 bold 표시) | Could |

### 4.2 Out of Scope (MVP 제외)
- 서버사이드 풀텍스트 검색 (bkend.ai 검색 API)
- 검색 히스토리 / 최근 검색어
- 자동완성 / 검색 제안
- 정렬 옵션 (관련도순, 최신순)
- 검색 결과 내 추가 필터 (날짜 범위 등)
- 한영 혼합 검색 (fuzzy match)

### 4.3 성공 기준 (Success Criteria)

| SC | 기준 | 측정 방법 |
|----|------|---------|
| SC-1 | 검색창에 입력 → 300ms 내 결과 반영 (debounce) | UI 확인 |
| SC-2 | 제목 일부 입력 → 해당 카드만 표시 | title 검색 |
| SC-3 | URL 도메인 입력 → 해당 URL 카드 표시 | url 검색 |
| SC-4 | 태그명 입력 → 해당 태그 포함 카드 표시 | tags 검색 |
| SC-5 | 태그 필터 선택 + 검색어 → 교집합 결과 | 복합 필터 |
| SC-6 | 검색어 지우기 → 전체 목록(또는 태그 필터 상태) 복귀 | 상태 복귀 |

---

## 5. 데이터 모델

추가 모델 불필요. 기존 `Bookmark` 타입을 클라이언트에서 필터링.

```typescript
// 검색 로직 (hook 내부)
function matchesQuery(bookmark: Bookmark, query: string): boolean {
  const q = query.toLocaleLowerCase('ko');
  return (
    bookmark.title.toLocaleLowerCase('ko').includes(q) ||
    bookmark.url.toLocaleLowerCase('ko').includes(q) ||
    bookmark.tags.some(t => t.toLocaleLowerCase('ko').includes(q))
  );
}
```

bkend.ai 추가 API 호출 없음.

---

## 6. UX 흐름

```
[dashboard]
    ↓
[SearchBar] 키워드 입력 (debounce 300ms)
    ↓ 검색어 있음
[BookmarkList] 매칭 카드만 표시
    (+ TagFilter 선택 시 교집합)
    ↓ 검색어 없음
[BookmarkList] 전체 목록 복귀
```

### SearchBar 위치
- TagFilter 위, AddBookmarkForm 아래
- placeholder: "제목, URL, 태그로 검색..."
- X 버튼: 검색어 초기화

---

## 7. 리스크

| 리스크 | 심각도 | 대응 |
|--------|:------:|------|
| 한글 검색 대소문자 처리 | Low | `toLocaleLowerCase('ko')` 사용 |
| 500개 이상 북마크 성능 | Low | MVP 범위 밖, 현재 클라이언트 필터로 충분 |
| 검색 + 태그 교집합 상태 관리 복잡도 | Med | hook 내 단일 computed 변수로 처리 |
| debounce 구현 라이브러리 의존 | Low | 직접 구현 또는 `use-debounce` 패키지 |

---

## 8. 리스크

### 8.1 Pre-mortem
"search 기능이 실패했다면 그 이유는?"
- 검색 + 태그 교집합 로직이 복잡해져 버그 발생
- debounce 없이 구현 → 매 키 입력마다 re-render 과부하
- 검색 상태가 bookmark-store에 들어가 관심사 분리 실패

대응: 검색 상태는 hook 레벨 로컬 state로 유지, store 오염 없음.

### 8.2 User Stories

| As a | I want to | So that |
|------|-----------|---------|
| 로그인 사용자 | 키워드로 북마크를 검색하고 싶다 | 목록 스크롤 없이 원하는 링크를 찾을 수 있다 |
| 로그인 사용자 | URL 도메인으로 검색하고 싶다 | github 링크만 모아볼 수 있다 |
| 로그인 사용자 | 태그 필터와 검색어를 함께 쓰고 싶다 | 더 정확한 결과를 볼 수 있다 |
| 로그인 사용자 | 검색어를 지우면 전체 목록으로 돌아가고 싶다 | 검색 후 전체 목록 확인이 쉽다 |

### 8.3 Test Scenarios

| 시나리오 | 입력 | 예상 결과 |
|---------|------|---------|
| 제목 검색 | "react" 입력 | 제목에 "react" 포함 카드만 표시 |
| URL 검색 | "github" 입력 | url에 "github" 포함 카드만 표시 |
| 태그 검색 | "nextjs" 입력 | tags에 "nextjs" 포함 카드만 표시 |
| 복합 필터 | 태그 "react" 선택 + "hooks" 입력 | react 태그 AND title/url/tags에 "hooks" 포함 |
| 0건 결과 | 없는 키워드 입력 | "검색 결과가 없습니다 (없는키워드)" |
| 초기화 | X 버튼 클릭 | 전체 목록 복귀 |
| 한글 검색 | "리액트" 입력 | 대소문자 무관 매칭 |

---

## 9. 다음 단계

`/pdca plan search` → search 기능 Plan 작성 시작
