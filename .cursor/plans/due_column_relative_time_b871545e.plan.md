---
name: Due column relative time
overview: Update the queue table Due cell to show human-readable relative time from `dueAt` (with red text when past due), hide it entirely when `status === "fulfilled"`, using existing `date-fns` in vendor-portal.
todos:
  - id: helper-format
    content: Add formatQueueDueRelative(dueAt, now) using date-fns intervalToDuration + formatDuration + edge cases
    status: completed
  - id: due-cell-ui
    content: "Update Due TableCell: fulfilled → —; else show label with text-destructive when overdue"
    status: completed
  - id: verify
    content: Smoke-check types/lint and three states (future / past / fulfilled) in UI
    status: completed
isProject: false
---

# Due column: relative time, overdue styling, hide when fulfilled

## Context

- Due cell today: local clock time from `dueAt` plus `(slaMinutesRemaining)m)` in [`queue-priorities.tsx`](<apps/vendor-portal/src/app/(main)/dashboard/default/_components/queue-priorities.tsx>) (lines 307–313).
- [`QueueOrder`](apps/vendor-portal/src/lib/vendor-ops-types.ts) already has `dueAt: string` and `status: QueueStatus` including `"fulfilled"`.
- [`date-fns@^4`](apps/vendor-portal/package.json) is already a dependency; other dashboard code imports from `date-fns` (no `formatDuration` usage yet in the repo).

## Behavior

| Condition                     | UI                                                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status === "fulfilled"`      | Same empty treatment as other columns: e.g. muted `—` (match the Source column pattern) so layout stays aligned.                                                                    |
| `dueAt` in the future         | Prefix **"In "** + compound duration, e.g. **"In 1 hour and 30 minutes"**, using default muted text classes (same family as today).                                                 |
| `dueAt` in the past (overdue) | Same duration style but **past** phrasing, e.g. **"1 hour and 30 minutes ago"**, with **destructive/red** text (`text-destructive` is consistent with shadcn/Tailwind in this app). |
| Edge cases                    | Due **now** or within ~1 minute: a single friendly string (e.g. "Due now" / "Less than a minute ago") avoids noisy "0 minutes" strings.                                             |

**Sorting** stays as-is (`compareQueueByDueAt` still uses `dueAt` timestamps).

**SLA minutes**: The `(Xm)` suffix will be **removed** from this cell so the column reads purely as time relative to `dueAt`. If SLA minutes must remain visible, that would be a separate design (e.g. tooltip or second line); not in scope unless you want it.

## Implementation approach

1. **Add a small pure helper** (either at the bottom of [`queue-priorities.tsx`](<apps/vendor-portal/src/app/(main)/dashboard/default/_components/queue-priorities.tsx>) or a tiny [`apps/vendor-portal/src/lib/format-queue-due.ts`](apps/vendor-portal/src/lib/format-queue-due.ts) if you prefer testability without bloating the component):
   - Parse `dueAt` with `parseISO` (or `new Date` if you already guarantee ISO strings from [`/api/vendor/ops/queue`](apps/vendor-portal/src/app/api/vendor/ops/queue) — quick grep when implementing).
   - Compare to `new Date()` to decide overdue vs upcoming.
   - Use **`intervalToDuration`** between the two instants, then **`formatDuration`** from `date-fns` with a **`delimiter: " and "`** so multi-unit strings match your example. Restrict **units** to those that matter for ops (e.g. `days`, `hours`, `minutes`) so you do not show seconds for long windows.
   - Return `{ label: string; overdue: boolean }` (or `null` for fulfilled handled in JSX).

2. **Update the Due `TableCell`** in [`queue-priorities.tsx`](<apps/vendor-portal/src/app/(main)/dashboard/default/_components/queue-priorities.tsx>):
   - If `item.status === "fulfilled"`: render muted `—` (no relative string).
   - Else: render `label` with `className` that adds `text-destructive` when `overdue`, otherwise keep muted styling consistent with the current cell.

3. **Optional (not required for first pass)**: A `setInterval` (e.g. every 60s) + `useState(now)` to refresh labels so "In 1 hour" drifts correctly without a refetch. The dashboard already refetches on status change; skipping the interval keeps the change smaller.

## Files to touch

- Primary: [`apps/vendor-portal/src/app/(main)/dashboard/default/_components/queue-priorities.tsx`](<apps/vendor-portal/src/app/(main)/dashboard/default/_components/queue-priorities.tsx>) — Due cell + helper import.
- Optional extract: `apps/vendor-portal/src/lib/format-queue-due.ts` — only if you want the formatter unit-tested or reused.

## Verification

- Manually: one future `dueAt`, one past `dueAt`, one `fulfilled` row — confirm copy, red on past, em dash on fulfilled.
- Run `pnpm --filter vendor-portal typecheck` (and lint if you normally do) after edits.
