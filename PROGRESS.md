# Progress Log

## Phase 0: Foundation

Status: Completed (initial Phase 0 baseline)

### Checklist

- [x] Initialize `pnpm` workspace baseline at repo root.
- [x] Define monorepo package discovery (`customer-web`, `vendor-portal`, `apps/*`, `packages/*`).
- [x] Add missing `customer-web/package.json` so both Next.js apps are workspace packages.
- [x] Scaffold `apps/api` Node.js + TypeScript service with health/version endpoints.
- [x] Scaffold shared workspace packages: `packages/config`, `packages/types`, `packages/ui`.
- [x] Add CI workflow for workspace install, lint, typecheck, and build via `pnpm`.
- [x] Add/verify env management baseline for all apps.
- [x] Add baseline automated tests and wire them into workspace scripts.
- [x] Bootstrap Supabase project structure and migration workflow.

### 2026-04-22 Updates

- Created root `package.json` with workspace-oriented scripts and pinned `pnpm` package manager.
- Added `pnpm-workspace.yaml` and included both existing Next.js apps plus `apps/*` and `packages/*`.
- Added missing `customer-web/package.json` and enabled `typecheck` script.
- Added `typecheck` script to `vendor-portal`.
- Added initial API app scaffold under `apps/api` with Fastify + Zod and TypeScript build/dev scripts.
- Added initial shared packages:
  - `packages/config` with base TypeScript config
  - `packages/types` with starter shared domain types
  - `packages/ui` with starter token stylesheet
- Added `.github/workflows/ci.yml` using `pnpm` for install/lint/typecheck/build.
- Added `.env.example` files at root plus `customer-web`, `vendor-portal`, and `apps/api`.
- Added baseline API test wiring (`apps/api/src/health.test.ts`) and workspace test command support.
- Added `supabase/` bootstrap with migration placeholder, `seed.sql`, and workflow README.
- Added root scripts for Supabase reset/push workflows.
- Validation note: `pnpm install` currently fails in this environment due filesystem permission constraints while linking one package (`resolve`) into `node_modules`.

### Next up (Phase 0 continuation)

1. Resolve local install permission issue and generate a clean lockfile.
2. Add customer-web and vendor-portal smoke tests.
3. Expand Supabase schema from placeholder table to MVP entities + RLS policies.
