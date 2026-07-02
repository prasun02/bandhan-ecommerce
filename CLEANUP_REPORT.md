# Repository Cleanup Report

Audit date: 2026-07-02

This report was created before any repository files were deleted. The starting
Git state was `main...origin/main` with a pre-existing local modification to
`.gitignore`. No untracked, non-ignored files were present.

## Security findings

- Only `.env.example` is currently tracked. `.env`, `.env.local`,
  `.env.production.local`, and `.env.admin.production` are not tracked.
- Git history contains no committed private environment file, but two early
  revisions of `.env.example` contained a credential-shaped Neon PostgreSQL
  connection URL. The referenced database has been deleted, but its password
  and any password reused elsewhere must be rotated. No secret values are
  reproduced in this report.
- The local `.env.production.local` is an old Vercel environment export and
  `.env.local` contains an old Vercel OIDC token. Both belong to the deleted
  Vercel project and are classified as temporary secret files.
- `.env.admin.production` contains one-time administrator bootstrap variables
  and an old database URL. It is classified as a temporary secret file.
- The local `.env` contains a mixture of database, authentication, optional
  service, and historical seed variables. It is ignored and retained because
  some non-database service settings may still be useful. Its values require
  manual review before reuse.

## Classification

| Path or group | Classification | Decision and evidence |
| --- | --- | --- |
| `app/`, `components/`, `lib/`, `types/` | Required | Active Next.js application code and imported shared code. Retain. |
| `prisma/schema.prisma` | Database configuration | Canonical schema. Retain. |
| `prisma/migrations/` | Database configuration | Contains the initial schema and additive follow-up migrations. Retain. |
| `prisma.config.ts`, `lib/prisma.ts` | Database configuration | Active Prisma 7 CLI and runtime configuration. Retain and correct as needed. |
| `data/catalog.ts` | Product data | Canonical catalog data retained for seed maintenance. |
| `public/images/` | Product data | Product, category, and storefront assets referenced by source/CSV data. Retain. |
| `lib/services/admin-product-import.ts` | Product data | Canonical protected CSV/XLSX product import path. |
| `scripts/create-admin.ts`, `scripts/reset-admin-password.ts` | Required | The two explicit administrator maintenance commands. Retain and harden. |
| `scripts/smoke-demo-flow.ts` | Unknown and requires manual review | Useful database-dependent verification helper, but not an automatic deployment step. Retain. |
| `prisma/seed.ts` | Outdated | Creates demo users and reviews, which is unsafe for a new production database. Replace with catalog-only behavior; do not delete the path because Prisma references it. |
| `docs/deployment-guide.md`, `docs/setup-guide.md`, `docs/admin-user-setup-guide.md`, `README.md` | Outdated | Contain old seed/admin instructions. Retain and update or supersede with `NEW_DEPLOYMENT_GUIDE.md`. |
| `.env.example` | Deployment configuration | Tracked template. Retain, remove obsolete demo-account variables, and keep placeholders non-secret. |
| `.gitignore` | Deployment configuration | Retain the user's existing edit and expand it with explicit safe ignores. |
| `.vercel/` | Generated and safe to delete | Local link metadata for the deleted Vercel project; already ignored. Delete. |
| `.next/` | Generated and safe to delete | Next.js build output; ignored and reproducible. Delete before validation. |
| `.tmp/` | Generated and safe to delete | Node/tsx cache. 599 files were incorrectly tracked; reproducible. Delete and ignore. |
| `.tmp-prisma/` | Generated and safe to delete | Prisma/Node compile cache. 596 files were incorrectly tracked; reproducible. Delete and ignore. |
| `tsconfig.tsbuildinfo` | Generated and safe to delete | TypeScript incremental build output was incorrectly tracked. Delete and ignore via `*.tsbuildinfo`. |
| `node_modules/` | Generated and safe to delete | Installed dependencies, ignored and reproducible. It may be replaced by `npm install`; it is not a repository deletion target. |
| `.env.local` | Temporary secret file | Contains only stale Vercel OIDC data from the deleted project. Delete. |
| `.env.production.local` | Temporary secret file | Old Vercel production export tied to the deleted project/database. Delete. |
| `.env.admin.production` | Temporary secret file | One-time old database/admin bootstrap values. Delete. |
| `.env` | Unknown and requires manual review | Ignored local configuration may include still-useful third-party settings. Retain; replace its database/auth values before local use. |
| `.agents/` | Unknown and requires manual review | Local Codex workspace metadata, not application code. Leave untouched. |
| `package-lock.json` | Required | Reproducible dependency lockfile. Retain. |

## Duplicate audit

- One Next.js application, one Prisma schema/config pair, one reusable runtime
  Prisma singleton, one NextAuth credentials implementation, and one active
  server-backed cart implementation were found.
- No duplicate pages or API route paths were found.
- Script-local Prisma clients are intentional for short-lived CLI processes;
  they disconnect in `finally` and are not duplicate request-time clients.
- Both Prisma adapter packages are listed in `package.json`, but neither auth
  adapter is used by the credentials/JWT setup. Unused dependencies will be
  removed only after install, lint, type, test, and build validation.

## Migration audit

- `20260620133304_initial_setup` creates all application tables represented by
  the original schema.
- `20260620195500_demo_storefront_updates` is additive/idempotent and retains
  existing data.
- `20260701120000_fix_auth_cart_admin` adds active/session controls, admin
  audit history, site events, cart indexes, and foreign keys.
- No migration is scheduled for deletion. A real empty PostgreSQL database is
  still required to prove `prisma migrate deploy` end to end; static schema and
  SQL inspection alone cannot substitute for that database-dependent test.
