# Architecture

## Private web and deployment boundary

- `src/lib/auth`: single-owner authentication abstraction, PBKDF2 credential verification and signed HttpOnly session.
- `src/proxy.ts`: protects Studio pages and private API routes before rendering; route handlers still enforce sensitive OAuth state/session checks.
- `src/services/instagram`: Meta provider, Mock provider, OAuth, token encryption, media storage, health and persisted publishing state machine.
- `src/lib/db/provider.ts`: reports the active database provider boundary. SQLite is the local adapter; production must use a persistent provider.
- `src/app/api/system-status`: exposes readiness labels only and never returns credentials.

Instagram LIVE publishing is an explicit side effect. It cannot start from content generation or page load, and requires health/preflight plus a second user confirmation. Media containers are polled separately from `media_publish`; unsafe publish calls are not blindly retried.

## 기술 구성

- Next.js App Router + React + TypeScript
- Tailwind CSS
- Node.js 내장 `node:sqlite`의 `DatabaseSync`
- OpenAI Responses API + strict JSON Schema Structured Outputs
- OpenAI Image API를 통한 카드별 독창적 배경 이미지 생성
- 브라우저 DOM 렌더링을 이용한 1080 × 1350 PNG 내보내기
- 로컬 파일 기반 데이터베이스 `.data/exercise-content-studio.db`

## 애플리케이션 경계

```text
Browser
  ├─ Server-rendered pages: dashboard, library, outputs, sources, settings
  ├─ Client form: save and generate actions
  └─ Live Preview Editor: immediate card state + debounced persistence + PNG export
          │
          ▼
Next.js Route Handlers
  ├─ input validation
  ├─ content repository
  └─ generation orchestration
          │
          ├──────────────► OpenAI Responses API
          │                 strict structured JSON
          │
          ▼
SQLite repository
  ├─ sources and transcripts
  ├─ categorized tags
  ├─ structured analysis
  ├─ Instagram carousel drafts
  └─ blog drafts
```

## 디렉터리 역할

```text
src/app/                 pages, layouts, route handlers
src/components/          reusable UI and interactive forms
src/lib/db/              SQLite connection and migrations
src/lib/content/         validation, types, rules, copyright guard
src/lib/ai/              Responses API schema and generation
database/schema.sql      canonical database schema
.data/                   local runtime database, git ignored
```

## 데이터 흐름

### 등록

1. 브라우저가 입력을 검증하고 `/api/contents`로 전송한다.
2. 서버가 URL 플랫폼, 필수 필드, 스크립트 길이를 다시 검증한다.
3. 콘텐츠와 분류 태그를 하나의 SQLite 트랜잭션으로 저장한다.

### 생성

1. `/api/contents/:id/generate`가 저장된 원문과 출처를 읽는다.
2. 서버 전용 환경 변수에서 API 키를 읽어 OpenAI Responses API를 호출한다.
3. strict JSON Schema로 공통 분석, 5~9장 Instagram Engine 결과, Naver 전용 글을 구조화해 받는다.
4. 원문과 생성 결과 사이의 긴 구문 중복을 검사한다.
5. 검사를 통과한 결과만 트랜잭션으로 저장한다.

### Live Preview 편집

1. 저장된 카드 JSON을 편집기 초기 상태로 전달한다.
2. 텍스트와 스타일 변경은 브라우저 상태에 즉시 반영해 오른쪽 4:5 카드에 렌더링한다.
3. 변경 상태는 짧은 지연 후 SQLite의 카드 JSON에 저장한다.
4. 이미지 재생성은 서버에서 OpenAI Image API를 호출하고 base64 PNG를 로컬 카드 데이터에 넣는다.
5. 내보내기는 동일한 미리보기 DOM을 1080 × 1350 캔버스로 렌더링해 PNG로 다운로드한다.

### 검색

콘텐츠의 제목·전문가·원문, 분류 태그, 분석 JSON 텍스트를 함께 조회한다. 태그는 `topic`, `body_part`, `exercise`, `symptom`, `biomechanics` 유형을 가진다.

## 보안과 개인정보

- API 키는 브라우저 번들, SQLite, 로그에 저장하지 않는다.
- 외부 API 호출은 Node.js 서버 런타임에서만 수행한다.
- 원문은 로컬 SQLite에만 저장하지만, AI 생성 시 사용자가 선택한 원문이 OpenAI API로 전송됨을 UI에 알린다.
- URL은 `https`와 허용된 YouTube/Instagram 호스트만 받는다.

## 확장 방향

저장소와 생성기를 인터페이스 경계로 나눠 향후 PostgreSQL, 인증, 큐 기반 생성, 카드 이미지 렌더러로 교체할 수 있다. 현재 MVP는 로컬 단일 프로세스의 단순성과 복구 용이성을 우선한다.
