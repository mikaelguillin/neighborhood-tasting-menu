---
name: vendor portal auth hardcoded users
overview: Lock down vendor-portal pages to authenticated users, hydrate header/sidebar account UI from the signed-in Supabase user, and remove the hard-coded `users.ts` data dependency.
todos:
  - id: gate-dashboard-routes
    content: Add server-side dashboard auth gate redirecting unauthenticated users to login.
    status: completed
  - id: normalize-auth-user
    content: Create helper to map Supabase auth user to UI-friendly account identity.
    status: completed
  - id: replace-hardcoded-user-wiring
    content: Pass authenticated user into AccountSwitcher and AppSidebar/NavUser instead of users.ts.
    status: completed
  - id: simplify-account-dropdown
    content: Refactor AccountSwitcher from hard-coded multi-user list to current account display.
    status: completed
  - id: validate-auth-and-ui
    content: Verify redirect behavior and account name rendering after login; run lint/type checks.
    status: completed
isProject: false
---

# Vendor Portal Auth And User Identity Plan

## Goals

- Unauthenticated visitors to vendor-portal should only see the login flow.
- Header account dropdown should display the signed-in user identity (name/email/avatar) instead of static demo users.
- Remove hard-coded user data usage from vendor-portal UI wiring.

## Implementation Steps

- Add server-side auth gating in [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/dashboard/layout.tsx`](</Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/dashboard/layout.tsx>):
  - Resolve current user with existing Supabase server helper.
  - If not authenticated, `redirect("/auth/v1/login")` before rendering dashboard shell.
  - Keep dashboard layout rendering only for authenticated users.
- Introduce a shared server helper for vendor-portal user identity in [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/lib/supabase-server.ts`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/lib/supabase-server.ts):
  - Return normalized UI-safe user object `{ id, name, email, avatar, role }` from Supabase auth user.
  - Name fallback order: `user_metadata.full_name`/`name` -> email local-part -> `"Account"`.
  - Avatar fallback: metadata avatar URL or empty string.
- Replace hard-coded imports in dashboard shell and sidebar:
  - Update [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/dashboard/layout.tsx`](</Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/dashboard/layout.tsx>) to pass real user data into `AccountSwitcher`.
  - Update [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/dashboard/_components/sidebar/app-sidebar.tsx`](</Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/dashboard/_components/sidebar/app-sidebar.tsx>) to accept a `user` prop and pass it into `NavUser`.
  - Remove dependency on [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/data/users.ts`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/data/users.ts) from dashboard UI.
- Adjust account dropdown behavior in [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/dashboard/_components/sidebar/account-switcher.tsx`](</Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/dashboard/_components/sidebar/account-switcher.tsx>):
  - Convert from multi-user switcher state to single current-account display.
  - Keep the existing dropdown structure/actions, but render the authenticated user’s name/email consistently.
- Optional UX hardening for auth page:
  - In [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/auth/v1/login/page.tsx`](</Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/auth/v1/login/page.tsx>), redirect already-authenticated users to dashboard.

## Validation

- Manual checks:
  - While signed out, navigating to `/`, `/dashboard/default`, and other dashboard routes redirects to `/auth/v1/login`.
  - After sign-in, dashboard loads and account dropdown shows real user name/email/avatar fallback.
  - Sidebar user card (`NavUser`) reflects the same authenticated identity.
- Run vendor-portal lint/type checks for touched files and verify no imports remain from `src/data/users.ts` in dashboard shell/sidebar paths.
