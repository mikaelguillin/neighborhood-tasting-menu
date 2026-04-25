---
name: customer profile edit page
overview: Add a customer profile page in the customer web app where authenticated users can view their account details and edit phone and default delivery address stored in `public.users`.
todos:
  - id: add-profile-route
    content: Create `/profile` page with server-side auth guard and initial user profile load.
    status: completed
  - id: build-profile-form
    content: Implement client `ProfileForm` UI for editing phone and default address with submit states.
    status: completed
  - id: add-profile-api
    content: Create `GET/PATCH /api/profile` handlers with auth checks and safe update validation.
    status: completed
  - id: wire-header-nav
    content: Add `Profile` navigation entry to authenticated account menus in site header.
    status: completed
  - id: verify-behavior
    content: Run lint/typecheck and manually verify auth redirect + successful profile updates.
    status: completed
isProject: false
---

# Add Customer Profile Edit Page

## Scope

Implement a profile experience in the customer app only, with editable fields:

- `phone`
- `default_address`

Non-editable but visible:

- email (read-only)
- name (read-only fallback from `public.users.full_name` or auth metadata)

## Implementation Steps

1. Add a new authenticated route at [apps/customer-web/src/app/profile/page.tsx](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/app/profile/page.tsx).
   - Use `createSupabaseServerClient()` from [apps/customer-web/src/lib/supabase-server.ts](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/lib/supabase-server.ts) to load current user/session on the server.
   - Redirect unauthenticated users to `/sign-in`.
   - Fetch the current row from `public.users` by `auth.uid()` to prefill form defaults.

2. Create a client form component at [apps/customer-web/src/components/profile-form.tsx](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/components/profile-form.tsx).
   - Inputs: `phone`, `defaultAddress`.
   - Read-only display: `email`, `fullName`.
   - Add save action with loading, success, and error UI consistent with existing patterns in [apps/customer-web/src/components/sign-in/sign-in-form.tsx](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/app/sign-in/sign-in-form.tsx) and [apps/customer-web/src/components/checkout-form.tsx](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/components/checkout-form.tsx).

3. Add a profile update API route at [apps/customer-web/src/app/api/profile/route.ts](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/app/api/profile/route.ts).
   - `GET`: return current user profile shape (`email`, `fullName`, `phone`, `defaultAddress`).
   - `PATCH`: validate payload, normalize empty strings to `null`, update `public.users` where `id = auth.uid()`.
   - Reuse `requireCustomerUserId()` from [apps/customer-web/src/lib/supabase-server.ts](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/lib/supabase-server.ts) for auth guard.

4. Wire navigation to the new page in [apps/customer-web/src/components/site-header.tsx](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/components/site-header.tsx).
   - Add `Profile` item in desktop account dropdown.
   - Add `Profile` action in mobile authenticated menu.

5. Optional UX enhancement for later iteration (out of core scope):
   - Prefill checkout address in [apps/customer-web/src/components/checkout-form.tsx](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/components/checkout-form.tsx) from saved `default_address`.

## Validation and Testing

- Verify unauthenticated access to `/profile` redirects to `/sign-in`.
- Verify authenticated users can load current values and save updates.
- Verify RLS behavior allows updating only own `public.users` row.
- Verify header navigation exposes `Profile` and route works on desktop + mobile.
- Run lint/typecheck for customer app after edits.
