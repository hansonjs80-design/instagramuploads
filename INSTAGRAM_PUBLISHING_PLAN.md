# Instagram Direct Publishing Plan

## Safety boundary

- Publishing uses Meta's official Instagram API with Instagram Login only.
- Development defaults to `MOCK`; `LIVE` must be selected explicitly.
- A publish job is created only after preflight and a second, explicit confirmation.
- Access tokens are encrypted at rest and never returned to the browser or logs.
- Local files and localhost URLs are never sent to Meta. LIVE requires a public media base URL.

## Architecture

1. `InstagramProvider` isolates account, permission, limit, container, status and publish calls.
2. `MediaStorageProvider` isolates temporary public media hosting.
3. SQLite persists accounts, publish jobs, assets, status transitions and published posts.
4. The browser converts final 1080x1350 PNG renders to high-quality JPEG and submits them for preflight.
5. The server advances the state machine one safe step at a time. A timed-out publish call is verified before any retry.

## State machine

`DRAFT → PREPARING → VALIDATING → UPLOADING_ASSETS → CREATING_CHILD_CONTAINERS → WAITING_CHILDREN → CREATING_CAROUSEL → WAITING_CAROUSEL → READY_TO_PUBLISH → PUBLISHING → PUBLISHED | FAILED`

LIVE polling follows Meta's documented container-status guidance. Closing the local server pauses the job; reopening the app restores the persisted state.
