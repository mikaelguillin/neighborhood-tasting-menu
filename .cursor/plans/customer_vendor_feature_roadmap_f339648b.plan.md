---
name: Customer Vendor Feature Roadmap
overview: Define a scoped, sprint-based implementation roadmap that evolves the existing MVP Next.js customer app and Next.js vendor portal from basic functionality to polished, measurable, and launch-ready experiences within a pnpm monorepo.
todos:
  - id: sprint-1-discovery
    content: Scope and implement customer discovery/search/filter improvements with polished list and card states.
    status: pending
  - id: sprint-2-checkout-orders
    content: Implement resilient cart/checkout and customer-visible order lifecycle timeline with hardened API states.
    status: pending
  - id: sprint-3-vendor-ops
    content: Upgrade vendor portal into a daily operations dashboard with queue priorities and stronger inventory controls.
    status: pending
  - id: sprint-4-growth-trust
    content: Ship vendor promos plus customer ratings/reviews and reorder shortcuts.
    status: pending
  - id: sprint-5-retention
    content: Implement notification center/preferences and basic recommendation surfaces.
    status: pending
  - id: sprint-6-hardening
    content: Complete accessibility/performance hardening, observability, and launch-readiness testing/documentation.
    status: pending
isProject: false
---

# Scoped Implementation Roadmap

## Current Baseline

You already have core MVP plumbing in place (monorepo, shared UI tokens, basic customer and vendor flows, Supabase schema/RLS, billing/webhooks, notifications, and CI). This roadmap focuses on product depth and UX quality rather than redoing foundations.

Primary reference files:

- [DESIGN.md](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/DESIGN.md)
- [PROGRESS.md](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/PROGRESS.md)
- [neighborhood_monorepo_mvp_plan_d71af8d6.plan.md](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/.cursor/plans/neighborhood_monorepo_mvp_plan_d71af8d6.plan.md)

## Scope and Goals

- Upgrade both apps from “functional MVP” to “operator-usable and customer-trustworthy”.
- Prioritize high-impact features that improve conversion, operational efficiency, and retention.
- Keep delivery incremental with demoable outcomes every sprint.
- Keep all implementation within one `pnpm` monorepo using shared types/config/tokens and selective (not blanket) UI sharing.

## 6-Sprint Roadmap (2 weeks each)

### Sprint 1: Customer Discovery and Item Experience

- **Customer app (Next.js):** Add robust discovery/search/filter/sort, richer vendor/item cards, favorites.
- **Shared UI:** Introduce polished list states (empty/loading/error), skeletons, and card variants using existing token system.
- **API/data:** Add query/filter endpoints and response pagination for discovery surfaces.
- **Monorepo standard:** Use `pnpm` workspace scripts and shared package contracts for all app/API updates.
- **Success metric:** Users can find relevant vendors/items in <3 interactions.

Target implementation areas:

- [apps/customer-web](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web)
- [packages/ui](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/packages/ui)
- [apps/api](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/api)

### Sprint 2: Cart, Checkout, and Order Lifecycle Transparency

- **Customer app (Next.js):** Build resilient cart and checkout UX (fees, promos placeholder, confirmation state).
- **Customer app (Next.js):** Add order timeline/status history view with explicit state progression.
- **API/data:** Harden order state machine and webhook reconciliation visibility.
- **Success metric:** Checkout completion and order status visibility are deterministic and test-covered.

Target implementation areas:

- [apps/customer-web](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web)
- [apps/api](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/api)
- [supabase/migrations](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/supabase/migrations)

### Sprint 3: Vendor Daily Operations and Queue Management

- **Vendor portal (Next.js):** Replace basic lists with an operations dashboard (live queue, prep priorities, SLA timers).
- **Vendor portal (Next.js):** Improve inventory controls (bulk toggle, low-stock signals, out-of-stock reasons).
- **API/data:** Add operational endpoints/events for status transitions and queue summaries.
- **Success metric:** Vendors can process active orders without context switching.

Target implementation areas:

- [apps/vendor-portal](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal)
- [apps/api](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/api)
- [packages/types](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/packages/types)

### Sprint 4: Merchant Growth Tools and Customer Trust Features

- **Vendor portal (Next.js):** Add promo campaign primitives (time-boxed discount, item bundles, basic reporting).
- **Customer app (Next.js):** Add ratings/reviews and reorder shortcuts from order history.
- **API/data:** Add moderated review model and promo eligibility checks.
- **Success metric:** Repeat ordering and merchant campaign usage become measurable.

Target implementation areas:

- [apps/vendor-portal](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal)
- [apps/customer-web](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web)
- [apps/api](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/api)

### Sprint 5: Notifications, Retention, and Personalization

- **Customer app (Next.js):** Notification center and preference granularity (transactional vs marketing).
- **Platform services:** Reliable notification retries, templates, and audit surfacing.
- **Customer app (Next.js):** Basic recommendations (recently ordered, similar items, nearby trending).
- **Success metric:** Engagement events and reactivation flows are observable.

Target implementation areas:

- [apps/customer-web](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web)
- [apps/api](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/api)
- [packages/types](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/packages/types)

### Sprint 6: Hardening, Accessibility, and Launch Readiness

- **Both apps:** Accessibility pass, interaction polish, performance budget checks.
- **Platform:** Monitoring/alerting for critical order/billing/notification paths.
- **Engineering quality:** Expand smoke/e2e coverage for high-risk flows via `pnpm` workspace CI commands.
- **Success metric:** CI + e2e green with launch checklist complete.

Target implementation areas:

- [apps/customer-web](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web)
- [apps/vendor-portal](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal)
- [.github/workflows/ci.yml](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/.github/workflows/ci.yml)

## Cross-Cutting Guardrails

- Reuse the token/component standards in [DESIGN.md](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/DESIGN.md) for all new UI.
- Keep API contracts centralized through [packages/types](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/packages/types).
- Keep component sharing selective: use shared primitives for true cross-app needs, keep workflow-specific components app-local.
- Use `pnpm` consistently for local and CI workflows.
- For each sprint, require: demo script, acceptance checklist, and at least one KPI instrumented.

## Definition of Done per Sprint

- Feature flags or safe rollout strategy for user-visible changes.
- Happy-path and failure-path tests for new order or billing logic.
- Updated docs in [PROGRESS.md](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/PROGRESS.md) with what shipped and what remains.

## Recommended Execution Order for Immediate Start

1. Sprint 1 (Discovery UX)
2. Sprint 2 (Checkout + Order Transparency)
3. Sprint 3 (Vendor Ops Dashboard)

This sequence gives the fastest visible product quality improvement while preserving a stable operational backbone.
