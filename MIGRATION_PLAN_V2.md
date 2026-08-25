# Naver Content Engine v2 Migration Plan

## 유지하는 기존 경계

- `content_items`를 Source 메타데이터와 원문 보관의 기준으로 유지한다.
- `analyses`는 전문가 주장과 재활 원리 분석을 유지한다.
- `instagram_carousels`와 Live Preview Editor는 독립된 플랫폼 결과로 유지한다.
- `blog_posts`를 NaverArticle의 본문 원본으로 확장한다.

## 추가하는 명시적 엔티티

- `keywords`, `keyword_trends`: 후보, 유형, 검색 의도, 선택 상태, 점수, 상대 트렌드
- `content_angles`: 전문가/환자/통증/일상/움직임 관점
- `image_assets`: 이미지 계획, 생성 상태, 위치, 캡션, 로컬 데이터
- `topic_clusters`, `content_topic_clusters`: 지식 라이브러리 연결
- `content_series`, `content_series_items`: 반복 디자인을 갖는 시리즈
- `content_versions`: 수동 편집 전후 스냅샷과 복원 데이터
- `quality_reports`: 독창성, 의료 표현, 가독성, 브랜드, 내부 품질 점수

## 데이터 호환

앱 시작 시 `schema.sql`의 신규 테이블은 `CREATE TABLE IF NOT EXISTS`로 추가한다. 기존 테이블의 신규 열은 `PRAGMA table_info` 확인 후 비파괴 `ALTER TABLE ADD COLUMN`로 보완한다.

## Provider 경계

`NaverTrendProvider` 인터페이스 아래에 `NAVER_API_HUB`와 `LEGACY_NAVER_DEVELOPERS` 구현을 둔다. 환경 변수로 provider와 base URL을 선택하며, UI에서는 응답을 절대 검색량이 아닌 상대 검색 관심도로만 표현한다.

## 편집과 보호

Naver Live Editor는 구조화 섹션과 잠금 목록을 저장한다. AI 개선 요청은 잠금된 섹션을 입력 컨텍스트로만 사용하고 변경 대상에서 제외한다. 수정 전에는 `content_versions`에 스냅샷을 남긴다.
