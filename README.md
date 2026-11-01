# Garage

Vehicle inventory and maintenance tracking for [bartonhome.dev](https://bartonhome.dev), deployed at `garage.bartonhome.dev`.

## Stack

- TanStack Start on Cloudflare Workers
- Clerk auth (barton-home app: development keys locally, production instance for garage.bartonhome.dev)
- Neon Postgres via Drizzle ORM

## Local setup

1. Copy `.env.example` to `.env.local` and `.dev.vars.example` to `.dev.vars`.
2. Set `DATABASE_URL` from the Neon **garage** project (`morning-tree-19979220`) — use the **pooled** connection string.
3. Set `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from the **barton-home** Clerk development instance (`npx clerk env pull`).
4. Install dependencies: `pnpm install`
5. Apply migrations: `pnpm db:migrate` (already applied if using the shared Neon garage project)
6. Start dev server: `pnpm dev`

## Deploy

1. Create a Neon database and run `pnpm db:migrate` against it.
2. Set Worker secrets:
   - `DATABASE_URL`
   - `CLERK_SECRET_KEY` (production `sk_live_…`)
3. Use production `pk_live_…` as GitHub `VITE_CLERK_PUBLISHABLE_KEY`. See `DEPLOY.md` for Clerk DNS (must be DNS-only).
4. Deploy: `pnpm deploy`
