---
name: Customer Signup Page
overview: Add a new customer-web sign-up page that mirrors the sign-in design and allows account creation via Supabase auth.
todos:
  - id: add-signup-route
    content: Create sign-up page wrapper matching sign-in page style and metadata
    status: completed
  - id: build-signup-form
    content: Implement sign-up form component with Supabase signUp logic and UX states
    status: completed
  - id: wire-auth-links
    content: Update sign-in CTA to /sign-up and add sign-up back-link to /sign-in
    status: completed
  - id: verify-auth-flow
    content: Run lint/checks and validate redirect-or-confirmation behavior manually
    status: completed
isProject: false
---

# Add Customer-Web Sign-Up Page

## Scope

Implement a new `/sign-up` experience in customer-web using the same visual language as sign-in, and connect it to Supabase account creation.

## Planned Changes

- Create a new route page at [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/app/sign-up/page.tsx`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/app/sign-up/page.tsx) that mirrors the structure and spacing of the existing sign-in page in [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/app/sign-in/page.tsx`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/app/sign-in/page.tsx).
- Add a new client form component at [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/app/sign-up/sign-up-form.tsx`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/app/sign-up/sign-up-form.tsx), reusing the same input/button styling classes used by [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/app/sign-in/sign-in-form.tsx`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/app/sign-in/sign-in-form.tsx).
- Implement sign-up submit logic with `createSupabaseBrowserClient()` and `supabase.auth.signUp({ email, password })`, including loading + error states consistent with sign-in.
- Handle post-submit UX in the form:
  - If a session is returned immediately, redirect to `/orders`.
  - If no session is returned (email confirmation flow), show a success message prompting the user to verify their email before signing in.
- Update the “Create a new account” CTA in [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/app/sign-in/sign-in-form.tsx`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/customer-web/src/app/sign-in/sign-in-form.tsx) from `href="#"` to `href="/sign-up"`.
- Add reciprocal navigation on sign-up (e.g., “Already have an account? Sign in”) pointing to `/sign-in`.

## Validation

- Run lint/type checks for customer-web auth files changed.
- Manually verify:
  - `/sign-up` renders and matches sign-in aesthetics.
  - Validation/error messaging appears for Supabase failures.
  - Successful sign-up either redirects (auto session) or shows email-confirmation message.
  - Sign-in and sign-up cross-links navigate correctly.
