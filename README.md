# Garage

Vehicle inventory and maintenance tracking for [bartonhome.dev](https://bartonhome.dev), deployed at `garage.bartonhome.dev`.

## Stack

- TanStack Start on Cloudflare Workers
- Clerk auth (shared with other Barton Home apps)
- Neon Postgres via Drizzle ORM

## Local setup

1. Copy `.env.example` to `.env.local` and fill in Clerk + Neon values.
2. Copy `.dev.vars.example` to `.dev.vars` with the same secrets for Worker server functions.
3. Install dependencies: `pnpm install`
4. Apply migrations: `pnpm db:migrate`
5. Start dev server: `pnpm dev`

## Deploy

1. Create a Neon database and run `pnpm db:migrate` against it.
2. Set Worker secrets:
   - `DATABASE_URL`
   - `CLERK_SECRET_KEY`
3. Add `https://garage.bartonhome.dev` to your Clerk app's allowed origins.
4. Deploy: `pnpm deploy`
