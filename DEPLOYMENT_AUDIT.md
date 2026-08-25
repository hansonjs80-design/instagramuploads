# Deployment Audit

## Already Ready

- Next.js App Router, TypeScript strict mode, responsive desktop-first shell
- Server-only OpenAI, Naver and Meta credentials
- 1080x1350 browser rendering and local export
- Instagram provider, Vercel Blob/local storage provider, auth provider boundaries
- Official Instagram Login permission set and explicit final confirmation boundary
- `.env*`, local DB, exports and temporary publish media excluded from Git

## Needs Change

- Production must select and configure a persistent database provider before real data is stored.
- Production must provision Vercel Blob and configure `BLOB_READ_WRITE_TOKEN` (or add another provider adapter).
- Meta App redirect URI and `APP_BASE_URL` must match the production domain exactly.

## Production Blocker

- The current working repository is backed by local SQLite. SQLite is supported for localhost only; a Vercel Function filesystem is not durable. System Status reports this as an error in production.
- Vercel Blob provider is implemented. `CUSTOM_PUBLIC` still writes a local public folder and must not be used as Vercel production storage.

## Security Issue Addressed

- Added server-side single-owner authentication with PBKDF2 password verification and signed HttpOnly sessions.
- Access tokens use AES-256-GCM at rest in LIVE mode.
- Studio pages and private API routes are protected by Next.js Proxy; OAuth callback also verifies the Studio session.
- No secrets or raw authorization headers are returned to the UI or deliberately logged.

## Optional Improvement

- Add a managed Postgres adapter and migrations when a production provider is selected.
- Add R2/S3 provider modules only if Vercel Blob is not selected.
- Add a scheduled cleanup worker; local-server cleanup cannot run while the server is stopped.
