# PRD: bookmark (링크 저장 · 태그 관리)

> Product Requirements Document — linkbox
> Date: 2026-05-25 | Project Level: Dynamic (Next.js + bkend.ai)

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 개발자·리서처는 링크를 브라우저 즐겨찾기나 메모장에 분산 저장하다 보니, 나중에 찾을 수 없거나 어떤 링크인지 기억하지 못해 재검색 비용이 발생한다. |
| **Solution** | URL 저장 시 제목·설명·태그를 함께 입력하고, 태그로 분류하며, 목록에서 빠르게 확인할 수 있는 CRUD 기반 북마크 관리 기능을 제공한다. |
| **Function UX Effect** | 링크를 저장하면 카드 형태로 즉시 목록에 추가되고, 태그 필터로 원하는 링크를 1초 내에 좁힐 수 있어 "나중에 다시 볼게"의 마찰이 사라진다. |
| **Core Value** | "저장하면 반드시 다시 찾을 수 있다" — auth가 만든 계정 기반 위에 개인 링크 컬렉션을 쌓는 linkbox의 핵심 가치 레이어. |

bookmark는 linkbox의 **두 번째이자 핵심 기능**이다. auth가 "누구의 데이터인가"를 해결했다면, bookmark는 "어떤 데이터를 저장하는가"를 해결한다. MVP 범위는 "URL 저장 + 제목/설명/태그 입력 + 목록 보기 + 삭제"로 한정하며, 링크 미리보기 자동화(OG 파싱)·공유·export는 후순위로 분리한다.

---

## 1. Discovery — 기회 분석 (Teresa Torres OST)

### 1.1 5-Step Discovery Chain

**Step 1 — Brainstorm**
- 저장한 링크를 나중에 찾지 못해 재검색하는 비용
- 어떤 맥락에서 저장했는지 기억 못함 (설명 없음)
- 태그 없이 저장 → 카테고리 파악 불가
- 중복 저장 (같은 링크를 여러 번 저장)
- 오래된 링크가 깨져도 모름 (URL 유효성 확인 불가)

**Step 2 — Assumptions**
- A1: 사용자는 링크와 함께 제목·태그를 직접 입력할 의향이 있다
- A2: 태그 기반 분류가 폴더 구조보다 빠른 검색에 유리하다
- A3: 카드 목록 UI가 리스트보다 링크 내용을 파악하기 쉽다
- A4: bkend.ai `data` API로 CRUD 구현이 가능하다
- A5: userId 필터링으로 사용자별 데이터 격리가 충분하다

**Step 3 — Prioritize**

| 가정 | Impact | Risk | 우선순위 |
|------|:------:|:----:|:--------:|
| A4 (bkend.ai data API CRUD) | High | Med | **P0** |
| A5 (userId 격리) | High | Low | **P0** |
| A2 (태그 > 폴더) | Med | Low | P1 |
| A1 (직접 입력 의향) | Med | Low | P1 |
| A3 (카드 UI) | Low | Low | P2 |

**Step 4 — Experiments**
- E1: bkend.ai `data.create('bookmarks', {...})` 실제 호출 검증
- E2: `data.list('bookmarks', { userId })` 필터 동작 확인
- E3: tags 배열 필드 저장/조회 검증

**Step 5 — OST 합성**

```
Outcome: 저장한 링크를 언제든 빠르게 다시 찾을 수 있다
├── Opportunity: 저장 시 맥락 정보(태그, 설명) 입력
│   └── Solution: AddBookmarkForm (URL + 제목 + 태그 입력)
├── Opportunity: 저장된 링크 목록을 빠르게 탐색
│   └── Solution: BookmarkList + 태그 필터
└── Opportunity: 필요 없는 링크 정리
    └── Solution: 삭제 기능
```

---

## 2. Strategy — 가치 제안 (JTBD 6-Part)

### 2.1 JTBD (Jobs-to-be-Done)

| 파트 | 내용 |
|------|------|
| **When** | 나중에 다시 볼 링크를 발견했을 때 |
| **I want to** | URL과 간단한 설명·태그를 붙여 저장하고 |
| **So I can** | 필요한 순간 즉시 찾아볼 수 있게 |
| **But** | 브라우저 즐겨찾기는 기기에 묶여 있고, 태그/메모가 없어 나중에 기억이 안 남 |
| **Which means** | 링크 저장이 "진짜 저장"이 아닌 "임시 보관"에 그침 |
| **Value** | 태그 분류 + 계정 기반 = 어디서든 맥락과 함께 다시 꺼낼 수 있는 개인 링크 컬렉션 |

### 2.2 Lean Canvas (핵심 요소)

| 블록 | 내용 |
|------|------|
| **Problem** | 링크 재검색 비용, 맥락 손실, 기기 종속 |
| **Customer Segment** | 다기기 사용 개발자·리서처 (Primary) |
| **Unique Value** | 태그 + 계정 기반의 경량 북마크 — 설치 불필요, 어디서나 |
| **Solution** | URL 저장 폼 + 태그 필터 목록 + 삭제 |
| **Channels** | linkbox 웹 앱 직접 접속 |
| **Key Metrics** | 북마크 저장 수, 태그 사용율, 재방문율 |
| **Cost Structure** | bkend.ai 데이터 API 호출 비용 |

---

## 3. Research — 사용자 및 시장 분석

### 3.1 Personas

**Persona 1: 박준혁 (개발자, 28세)**
- 매일 GitHub, Stack Overflow, 블로그 링크를 30개 이상 탐색
- 브라우저 북마크가 300개 이상 쌓여 있지만 분류가 안 됨
- 핵심 욕구: "나중에 볼 링크"와 "지금 봐야 할 링크"를 분리하고 싶다

**Persona 2: 이수진 (UX 리서처, 31세)**
- 경쟁사 사례, 아티클 등을 Notion에 붙여넣지만 관리가 번거로움
- 핵심 욕구: 링크를 URL만이 아니라 "어떤 카테고리"로 저장하고 싶다

**Persona 3: 김태양 (사이드 프로젝트 빌더, 25세)**
- Pocket, Raindrop을 써봤지만 무겁고 기능이 많아 오히려 복잡함
- 핵심 욕구: 저장·확인·삭제만 되는 심플한 도구

### 3.2 경쟁 분석

| 서비스 | 강점 | 약점 | 차별화 포인트 |
|--------|------|------|--------------|
| Pocket | 읽기 모드, AI 추천 | 무겁고 유료화 | linkbox: 경량 CRUD |
| Raindrop.io | 풍부한 태그·컬렉션 | 복잡한 UX | linkbox: 1분 내 저장 |
| 브라우저 북마크 | 빠른 저장 | 기기 종속, 태그 미흡 | linkbox: 계정 기반 |
| Notion | 자유도 높음 | 오버킬, 진입 장벽 | linkbox: 링크 특화 |
| Pinboard | 심플 | 구식 UI, 유료 | linkbox: 무료 + 현대 UI |

### 3.3 시장 규모 (간이 추정)
- TAM: 전 세계 지식 노동자 약 1억 명 (링크 관리 필요)
- SAM: 개발자·리서처 중 개인 링크 관리 도구 사용자 약 500만 명
- SOM: linkbox 초기 타깃 (국내 개발자·리서처) 약 5만 명

---

## 4. 기능 요구사항

### 4.1 핵심 기능 (MVP)

| ID | 기능 | 우선순위 |
|----|------|:--------:|
| F1 | URL + 제목 + 설명(선택) + 태그(선택) 입력 후 북마크 저장 | Must |
| F2 | 내 북마크 목록 카드 형태로 표시 | Must |
| F3 | 북마크 삭제 | Must |
| F4 | 태그 필터링 (클릭 시 해당 태그 북마크만 표시) | Should |
| F5 | 북마크 수정 (URL, 제목, 태그 변경) | Could |

### 4.2 Out of Scope (MVP 제외)
- OG(Open Graph) 메타데이터 자동 파싱
- 북마크 공유 (타인에게 링크 컬렉션 공유)
- 읽기 모드 / 아카이브
- Import/Export (CSV, JSON)
- 북마크 정렬 옵션 (최신순 외)
- URL 유효성 실시간 검증

### 4.3 성공 기준 (Success Criteria)

| SC | 기준 | 측정 방법 |
|----|------|---------|
| SC-1 | 유효한 URL + 제목 입력 후 저장 → 목록에 즉시 표시 | UI 확인 |
| SC-2 | 저장된 북마크 삭제 → 목록에서 즉시 제거 | UI 확인 |
| SC-3 | 태그 클릭 → 해당 태그 북마크만 필터링 표시 | UI 확인 |
| SC-4 | 새로고침 후 북마크 목록 유지 (서버 저장 확인) | bkend.ai data API |
| SC-5 | 다른 사용자의 북마크가 노출되지 않음 | userId 필터 검증 |
| SC-6 | URL 미입력 시 저장 불가 + 인라인 에러 표시 | 폼 검증 |

---

## 5. 데이터 모델

```typescript
// types/index.ts에 이미 정의됨
interface Bookmark extends BaseDocument {
  userId: string;     // auth user._id
  url: string;        // 필수
  title: string;      // 필수
  description?: string;
  tags: string[];     // 빈 배열 허용
  favicon?: string;   // MVP 제외 (후순위)
}
```

bkend.ai collection: `bookmarks`

---

## 6. API 계획 (bkend.ai data API)

| 작업 | 호출 | 필터 |
|------|------|------|
| 목록 조회 | `bkend.data.list('bookmarks', { userId })` | userId 필수 |
| 생성 | `bkend.data.create('bookmarks', { userId, url, title, description, tags })` | — |
| 수정 | `bkend.data.update('bookmarks', id, { title, tags })` | 소유권 검증 필요 |
| 삭제 | `bkend.data.delete('bookmarks', id)` | 소유권 검증 필요 |

---

## 7. UX 흐름

```
[dashboard] → "북마크 추가" 버튼 클릭
    ↓
[AddBookmarkForm] URL + 제목 + 태그(optional) 입력
    ↓ 저장
[BookmarkList] 새 카드가 목록 상단에 추가됨
    ↓ 태그 클릭
[FilteredList] 해당 태그 카드만 표시
    ↓ 카드 삭제 버튼
[BookmarkList] 카드 제거 (optimistic update)
```

---

## 8. 리스크

| 리스크 | 심각도 | 대응 |
|--------|:------:|------|
| bkend.ai data.list userId 필터 미동작 | High | 구현 전 E2 실험으로 검증 |
| 다른 사용자 데이터 노출 | Critical | userId 강제 주입 + 서버사이드 확인 |
| 태그 배열 타입 저장 이슈 | Med | 구현 시 테스트 우선 |
| 대량 목록 성능 (200+ 북마크) | Low | MVP 범위 밖, 페이지네이션 후순위 |

---

## 9. Execution Deliverables

### 9.1 Pre-mortem
"프로젝트가 실패했다면 그 이유는?"
- userId 필터가 의도대로 동작하지 않아 다른 사용자 데이터가 노출됨
- bkend.ai data API 응답 형식이 예상과 달라 타입 오류 발생
- 태그 필터 UI가 복잡해져 MVP 완성이 지연됨

대응: F4(태그 필터)는 UI를 최대한 단순하게, 데이터 격리는 구현 첫날 검증.

### 9.2 User Stories

| As a | I want to | So that |
|------|-----------|---------|
| 로그인 사용자 | URL과 제목을 입력해 북마크를 저장하고 싶다 | 나중에 링크를 잃어버리지 않을 수 있다 |
| 로그인 사용자 | 내 북마크 목록을 볼 수 있다 | 저장한 링크를 한눈에 파악할 수 있다 |
| 로그인 사용자 | 태그로 북마크를 분류하고 싶다 | 카테고리별로 빠르게 찾을 수 있다 |
| 로그인 사용자 | 필요 없는 북마크를 삭제하고 싶다 | 목록이 지저분해지지 않는다 |

### 9.3 Test Scenarios

| 시나리오 | 입력 | 예상 결과 |
|---------|------|---------|
| 정상 저장 | URL(valid) + 제목 + 태그 2개 | 카드 목록 상단 추가 |
| URL 누락 저장 | 제목만 입력 | 인라인 에러 "URL을 입력하세요" |
| 태그 필터 | 태그 "react" 클릭 | react 태그 북마크만 표시 |
| 삭제 | 카드 삭제 버튼 | 목록에서 즉시 제거 |
| 데이터 격리 | 사용자 A 북마크 저장 후 사용자 B 로그인 | 사용자 B 목록에 A 데이터 없음 |

---

## 10. 다음 단계

`/pdca plan bookmark` → bookmark 기능 Plan 작성 시작
