# Progress Log

## Roadmap Alignment Snapshot (2026-04-25)

Status: Updated to reflect current planning artifacts.

### Completed (MVP Baseline)

- [x] Monorepo/workspace foundation (`pnpm`, package discovery, root scripts, CI baseline).
- [x] Shared package scaffolding (`packages/config`, `packages/types`, `packages/ui`).
- [x] API service baseline (`apps/api` scaffold with health/version + test wiring).
- [x] Supabase bootstrap (project structure, migration workflow, seed placeholders).
- [x] Customer and vendor MVP flow foundations (tracked as complete in MVP plan).
- [x] Billing/webhook and notification pipeline foundations (tracked as complete in MVP plan).

### Planned (Next Delivery Track)

- [~] Sprint 1: Customer discovery and item experience. (in progress)
- [~] Sprint 2: Cart, checkout, and order lifecycle transparency. (in progress)
- [ ] Sprint 3: Vendor daily operations and queue management.
- [ ] Sprint 4: Merchant growth tools and customer trust features.
- [ ] Sprint 5: Notifications, retention, and personalization.
- [ ] Sprint 6: Hardening, accessibility, and launch readiness.

### 2026-04-25 Sprint 1 Start

- Added a customer discovery surface in `apps/customer-web/src/app/neighborhoods/page.tsx` with:
  - text search across neighborhood, item, and vendor metadata
  - borough filtering and sort options (featured/name)
  - paginated results with count + page controls
  - polished loading, empty, and error list states
- Added `apps/customer-web/src/app/api/neighborhoods/route.ts` query endpoint to support filter/sort/pagination contracts from the UI.
- Added `apps/api/src/index.ts` `/neighborhoods` endpoint with validated query params and paginated response shape to begin formalizing Sprint 1 API behavior.

### 2026-04-25 Sprint 2 Start

- Added `apps/customer-web/src/app/checkout/page.tsx` and `apps/customer-web/src/components/checkout-form.tsx` for a resilient checkout flow with:
  - plan selection and delivery details capture
  - promo placeholder support (`WELCOME10`)
  - deterministic fee/total calculations and guarded submit states
- Added customer order APIs:
  - `apps/customer-web/src/app/api/orders/route.ts` for list/create order
  - `apps/customer-web/src/app/api/orders/[id]/route.ts` for order detail
  - `apps/customer-web/src/app/api/orders/[id]/advance/route.ts` for deterministic status progression in timeline demos/tests
- Added order lifecycle UI:
  - `apps/customer-web/src/app/orders/page.tsx` + `apps/customer-web/src/components/orders-list.tsx`
  - `apps/customer-web/src/app/orders/[id]/page.tsx` + `apps/customer-web/src/components/order-timeline.tsx`
- Added `apps/customer-web/src/lib/order-store.ts` in-memory order/state model to support explicit, testable order progression.
- Updated navigation and plan conversion paths:
  - `apps/customer-web/src/components/site-header.tsx` now includes `Orders` and routes CTA to `Checkout`
  - `apps/customer-web/src/app/plans/page.tsx` plan CTAs now deep-link into checkout with plan preselection

### Notes

- The MVP planning document indicates all core MVP tracks are complete.
- This progress log previously captured mostly Phase 0 detail; this snapshot keeps execution reporting aligned with current roadmap docs.

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
