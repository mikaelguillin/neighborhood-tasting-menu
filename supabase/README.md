# Supabase Workflow

## Directory layout

- `migrations/`: SQL migrations applied in order.
- `seed.sql`: development seed data.

## Local workflow

1. Install Supabase CLI.
2. Link project: `supabase link --project-ref <project-ref>`.
3. Create migration: `supabase migration new <name>`.
4. Apply migrations locally: `supabase db reset`.
5. Push migrations to hosted project: `supabase db push`.

## Notes

- Keep all schema and policy changes in migration files.
- Avoid editing production data manually; prefer idempotent SQL migrations.
