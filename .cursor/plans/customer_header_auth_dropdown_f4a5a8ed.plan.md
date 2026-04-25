---
name: Customer header auth dropdown
overview: Add logged-in user visibility in `customer-web` header and replace sign-in action with a user-name dropdown containing Orders and Logout actions.
todos:
  - id: inspect-header-structure
    content: Review current `site-header.tsx` desktop/mobile action sections and identify exact replacement points for auth controls.
    status: completed
  - id: add-auth-state-management
    content: Add client-side user fetch + auth state subscription and derive display name from metadata/email.
    status: completed
  - id: build-user-dropdown
    content: Implement logged-in dropdown trigger and menu items (Orders + Logout) for desktop header.
    status: completed
  - id: wire-mobile-auth-actions
    content: Apply matching logged-in/out behavior for mobile menu actions.
    status: completed
  - id: verify-behavior
    content: Validate login visibility, dropdown actions, logout redirect, and refresh behavior.
    status: completed
isProject: false
---

# Customer-Web Header Auth Dropdown Plan

## Goal

Implement authenticated header UX in `customer-web` so users can:

- See they are logged in (name visible in header)
- Open a dropdown menu by clicking their name
- Navigate to Orders from that dropdown
- Log out and be redirected to `/`

## Files to Update

- [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/components/site-header.tsx`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/components/site-header.tsx)

## Implementation Steps

1. In `SiteHeader`, add client-side auth state loading using [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/lib/supabase-browser.ts`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/lib/supabase-browser.ts):
   - Fetch current user on mount via `supabase.auth.getUser()`.
   - Subscribe to auth state changes with `supabase.auth.onAuthStateChange(...)` to keep header UI in sync after sign-in/out.
2. Compute display label for logged-in users:
   - Primary: `user.user_metadata.full_name`
   - Fallback: `user.email`
3. Replace current desktop `Sign in` button area with conditional auth controls:
   - Logged out: keep existing `Sign in` link.
   - Logged in: show a name-triggered dropdown menu.
4. Implement dropdown menu content for logged-in users:
   - `Orders` link to `/orders`
   - `Logout` action that calls `supabase.auth.signOut()`, then `router.push('/')` and `router.refresh()`.
5. Mirror equivalent conditional behavior in mobile menu section:
   - Logged out: existing `Sign in` button/link.
   - Logged in: show `Orders` and `Logout` actions in mobile-friendly format.
6. Ensure small UX details:
   - Add a simple loading-safe state so the header does not flash incorrect auth actions during initial user fetch.
   - Close dropdown after selection.

## Validation

- Manual checks in `customer-web`:
  - Logged-out user sees `Sign in`.
  - After login, header shows user name and clicking it reveals dropdown.
  - Dropdown contains `Orders` and `Logout`.
  - `Orders` navigates to `/orders`.
  - `Logout` signs out and redirects to `/`.
  - Refreshing page preserves correct header state.

## Notes

- This follows the app’s existing client-side auth pattern used in sign-in (`createSupabaseBrowserClient`) and avoids introducing a new server-action logout flow unless desired later.
