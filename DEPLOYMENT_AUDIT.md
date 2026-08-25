# Deployment Audit

## Already Ready

- Next.js App Router, TypeScript strict mode, responsive desktop-first shell
- Production-only deployment is the current operating policy; a separate Preview environment is not required.
- Production administrator login (`admin`) and authenticated PostgreSQL-backed dashboard access were verified on 2026-08-25.
- Server-only OpenAI, Naver and Meta credentials
- 1080x1350 browser rendering and local export
- Instagram provider, Vercel Blob/local storage provider, auth provider boundaries
- Official Instagram Login permission set and explicit final confirmation boundary
- `.env*`, local DB, exports and temporary publish media excluded from Git

## Needs Change

- Production must provision Vercel Blob and configure `BLOB_READ_WRITE_TOKEN` (or add another provider adapter).
- Meta App redirect URI and `APP_BASE_URL` must match the production domain exactly.

## Production Blocker

- Vercel Blob provider is implemented. `CUSTOM_PUBLIC` still writes a local public folder and must not be used as Vercel production storage.

## Security Issue Addressed

- Added server-side single-owner authentication with PBKDF2 password verification and signed HttpOnly sessions.
- Access tokens use AES-256-GCM at rest in LIVE mode.
- Studio pages and private API routes are protected by Next.js Proxy; OAuth callback also verifies the Studio session.
- No secrets or raw authorization headers are returned to the UI or deliberately logged.
- Added an optional server-side administrator username credential alongside the owner email credential.
- Added a Supabase PostgreSQL adapter with prepared statements disabled for the transaction pooler, schema versioning, and transaction-scoped migration locking.

## Optional Improvement

- Add explicit migration versions when the database schema changes after version 1.
- Add R2/S3 provider modules only if Vercel Blob is not selected.
- Add a scheduled cleanup worker; local-server cleanup cannot run while the server is stopped.
