# Exercise Content Studio

운동·재활 전문가의 YouTube 및 Instagram 자료를 출처와 함께 보관하고, 원문을 복제하지 않는 분석을 거쳐 Instagram과 Naver에 각각 최적화된 콘텐츠를 만드는 private Next.js web application입니다.

## MVP 기능

- YouTube/Instagram URL 하나로 플랫폼 감지, 공개 메타데이터 분석, 근거 수준 표시
- 스크립트·자막·소유 미디어는 선택 입력이며 추가 시 전사 근거로 분석 업그레이드
- 신체 부위·증상·움직임·생체역학·검색 의도·KR/EN 키워드 자동 분류와 수정/확정/잠금
- 전문가·플랫폼·URL·등록일·분류 태그·원본 스크립트의 SQLite 보관
- 핵심 주장부터 임상 해석, 쉬운 설명, 운동 아이디어, 주의사항까지 구조화된 AI 분석
- 10개 후크 채점, 6개 이상 콘텐츠 각도, 5~9장 Swipe Flow와 Storyboard를 만드는 Instagram Engine
- 좌측 편집 패널과 우측 4:5 렌더러로 구성된 Live Preview Editor
- 문구·타이포그래피·배경·이미지·카드 순서 편집 및 1080 × 1350 PNG 내보내기
- 카드별 이미지 업로드와 OpenAI 이미지 재생성
- 네이버 블로그 구조에 맞춘 해설 중심 글 초안
- 네이버 검색 의도·상대 검색 트렌드·키워드 점수·원문/해석/적용 분리·품질 검사
- Meta 공식 Instagram API with Instagram Login provider와 명시적 최종 확인 게시 흐름
- Mock 게시, 상태 머신, 중복 게시 방지, 게시 기록, 공식 API 연결 상태 검사
- 단일 소유자 서버 인증과 HttpOnly 서명 세션
- 전문가, 신체 부위, 운동, 증상, 생체역학 개념, 태그 통합 검색
- 원문 장문 재사용을 감지하는 생성 결과 안전 검사

## 로컬 실행

Node.js 22.13 이상이 필요합니다. 로컬 개발은 Node.js 내장 SQLite를 사용합니다.

```bash
npm install
cp .env.local.example .env.local
npm run auth:hash -- "12자 이상의 안전한 비밀번호"
npm run dev
```

생성된 password hash를 `.env.local`의 `STUDIO_PASSWORD_HASH`에 복사하고 `STUDIO_OWNER_EMAIL`, 32자 이상의 `STUDIO_SESSION_SECRET`, `APP_BASE_URL=http://localhost:3000`을 설정합니다. 브라우저에서 `http://localhost:3000`을 열고 소유자 계정으로 로그인합니다. 데이터베이스는 최초 실행 시 `.data/exercise-content-studio.db`에 자동 생성됩니다.

AI 생성을 사용하려면 `.env.local`에 서버 전용 API 키를 입력합니다.

```dotenv
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-transcribe
YOUTUBE_API_KEY=optional_youtube_data_api_key
```

키가 없어도 자료 등록, 검색, 출처 관리는 사용할 수 있습니다. AI 생성 요청만 명확한 설정 오류를 반환합니다.

## 검증 명령

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Instagram Workflow

1. Settings → Instagram에서 기본 `MOCK` 계정을 연결하고 연결 상태를 검사합니다.
2. New Content에서 링크를 입력하고 `자동 분석`을 누릅니다. Script와 Experience Layer는 선택사항입니다.
3. Live Preview에서 Hook, 문구, 잠금, 카드 순서, 이미지, Caption과 품질 경고를 확인합니다.
4. `Instagram에 게시`를 누르면 사전검사를 수행하고 최종 확인 Modal을 표시합니다.
5. 사용자가 Modal의 두 번째 게시 버튼을 눌러야 Publish Job이 만들어집니다.
6. LIVE에서는 Meta가 접근할 수 있는 HTTPS 미디어 저장소와 Business/Creator 계정이 필요합니다. 페이지를 열거나 AI 생성만 해서는 절대 게시되지 않습니다.

공식 게시 과정은 child media container → status check → carousel container → status check → `media_publish` 순서입니다. Meta status 확인은 LIVE에서 1분 간격을 사용합니다. 로컬 서버를 종료하면 작업은 멈추며, DB에 저장된 상태는 보존됩니다.

## Automatic Link Analysis Workflow

1. `New Content`에서 YouTube 영상/Shorts 또는 Instagram Post/Reel URL을 붙여 넣습니다.
2. `FAST`, `STANDARD`, `DEEP` 중 분석 비용·정확도 모드를 고르고 `자동 분석`을 누릅니다.
3. 앱은 공식 API 또는 공식 공개 메타데이터를 우선 사용합니다. YouTube API 키가 없으면 oEmbed 최소 정보로 낮춰 동작하며, Instagram 본문·미디어에 권한이 없으면 링크 이상의 내용을 추측하지 않습니다.
4. Source Accuracy에서 Metadata, Transcript, Visual Frames, Evidence Level(A~E), Confidence를 확인합니다.
5. AI 분류 칩을 확정·추가·삭제·정렬하고 중요한 값은 잠급니다. 재분석해도 잠금 및 사용자 수정값은 보존됩니다.
6. `어떤 콘텐츠를 만들까요?`에서 네이버 블로그 KR, Instagram KR, Instagram EN 중 하나 이상을 선택합니다.
7. `선택한 콘텐츠 만들기`는 고른 엔진만 호출하고, `모두 만들기`는 세 엔진을 실행합니다. Source Analysis와 Research Core는 한 번만 공유합니다.
8. Instagram EN은 Instagram KR 번역본이 아니라 Research Core에서 영어권 후크·비유·CTA·검색어·캡션을 독립 생성합니다.
9. 각 출력은 별도 저장·버전 기록을 가지며, 분류를 수정한 뒤 변경을 반영할 출력만 다시 선택할 수 있습니다.

업로드한 영상·오디오는 사용자가 소유하거나 분석 권한이 있는 파일만 사용해야 합니다. 현재 서버 전사는 지원하지만 프레임 추출기는 배포 환경의 영상 처리기 연결 전까지 `UNAVAILABLE`로 명확히 표시됩니다. 임의의 제3자 영상 다운로드나 비공식 자막 우회는 사용하지 않습니다.

Vercel Preview에서는 `VERCEL_URL`을 자동 인식합니다. Preview에서 임시 SQLite를 사용할 경우 `SQLITE_DATABASE_PATH=/tmp/exercise-content-studio.db`로 설정할 수 있지만, 함수 재시작 시 데이터가 초기화될 수 있으므로 화면·워크플로 검증에만 사용합니다.

## Deployment

1. 프로젝트를 GitHub의 **Private Repository**에 추가합니다. `.env*`, `.data`, `exports`, `public/publish-assets`가 추적되지 않는지 확인합니다.
2. Vercel에서 private repository를 Import합니다.
3. `.env.example`에 나열된 값을 Vercel Environment Variables에 등록합니다. 실제 key/token은 repository에 넣지 않습니다.
4. `APP_BASE_URL`을 실제 HTTPS production domain으로 설정합니다.
5. Vercel Function의 파일시스템은 영속 저장소가 아니므로 production DB provider와 migrations를 연결합니다. 현재 checkout의 SQLite adapter는 localhost 전용입니다.
6. Vercel Storage에서 Blob을 생성하고 `MEDIA_STORAGE_PROVIDER=VERCEL_BLOB`, `BLOB_READ_WRITE_TOKEN`을 설정합니다. 구현된 Blob adapter는 Instagram 게시용 JPEG를 공개 URL로 업로드합니다. `CUSTOM_PUBLIC` adapter는 local/mock 검증용입니다.
7. Meta App에 `${APP_BASE_URL}/api/instagram/oauth/callback`과 동일한 Redirect URI를 등록하고 Instagram Login 최소 권한을 검토받습니다.
8. 배포 후 로그인 → Settings → System Status에서 AI, DB, Storage, Instagram, Naver, URL, Authentication 상태를 확인합니다.

Vercel build와 Vercel Blob adapter는 준비되어 있습니다. production에서 모든 기능을 실제로 사용하려면 영속 DB adapter와 migration은 여전히 필요합니다. 자세한 판단은 [DEPLOYMENT_AUDIT.md](./DEPLOYMENT_AUDIT.md)를 참고하세요.

## 주요 문서

- [PROJECT_PLAN.md](./PROJECT_PLAN.md): MVP 범위와 단계
- [CONTENT_RULES.md](./CONTENT_RULES.md): 저작권 및 생성 규칙
- [ARCHITECTURE.md](./ARCHITECTURE.md): 애플리케이션 구조와 데이터 흐름
- [INSTAGRAM_PUBLISHING_PLAN.md](./INSTAGRAM_PUBLISHING_PLAN.md): 공식 API 게시 상태 머신과 안전 경계
- [DEPLOYMENT_AUDIT.md](./DEPLOYMENT_AUDIT.md): localhost/Vercel 준비 상태와 production blocker
- [database/schema.sql](./database/schema.sql): SQLite 스키마

## 중요한 제한

원문 전체 번역, 원문 문장의 장문 복사, 타 제작자 이미지 또는 카드뉴스 디자인 복제를 허용하지 않습니다. 생성물은 반드시 사람이 사실관계와 임상적 안전성을 검토하고 원 제작자 이름과 출처 URL을 유지해야 합니다. Instagram LIVE 게시에는 사용자의 사전검사와 최종 확인이 모두 필요하며, 앱은 AI 생성 직후 자동 게시하지 않습니다.
