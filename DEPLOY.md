# Deploy Garage to Cloudflare Workers

Production deploy uses the **generated** Wrangler config from the build output (`dist/server/wrangler.json`), not the root `wrangler.jsonc` alone.

Garage signs in through the shared **Barton Home** Clerk application (`clerk.bartonhome.dev`), the same one the hub and calendar use. `garage.bartonhome.dev` is a subdomain, so it shares the session; signed-out visitors are sent to the auth hub (`https://auth.bartonhome.dev/sign-in?redirect_url=…`) and come back. Access is invite-only, managed from the calendar's Family page. The auth hub must list `https://garage.bartonhome.dev` in its allowed redirect origins (`barton-auth/src/lib/allowed-origins.ts`).

Garage used to have its own secondary Clerk domain (`clerk.garage.bartonhome.dev`). It is retired: its DNS records can be deleted once the shared sign-in is confirmed working.

## One-time setup

1. **Cloudflare account** with access to the `bartonhome.dev` zone.
2. Log in: `pnpm exec wrangler login`
3. **Neon**: create a Postgres database and run `pnpm db:migrate` with the pooled `DATABASE_URL`.
4. **Clerk keys**: the Barton Home application's production keys (`pk_live_…` for `clerk.bartonhome.dev`, and its `sk_live_…`).
5. GitHub repository secret `VITE_CLERK_PUBLISHABLE_KEY` = that `pk_live_…` (baked into the client at `vite build`).
6. Worker secret `CLERK_SECRET_KEY` = that `sk_live_…` (`wrangler secret put`, never `vars`).

Local development keeps the development instance's `pk_test_` / `sk_test_` in `.env.local` and `.dev.vars`, and signs in with Clerk's modal (there is no auth hub in dev).

## Environment variables

### Build time (client)

`VITE_CLERK_PUBLISHABLE_KEY` must be set when running `vite build` (production: `pk_live_…`):

```powershell
$env:VITE_CLERK_PUBLISHABLE_KEY="pk_live_..."; pnpm run deploy
```

Never commit Clerk keys in `wrangler.jsonc`. The GitHub Action injects the publishable key at build time.

### Worker secrets (server)

After the first build:

```bash
pnpm exec wrangler secret put DATABASE_URL --config dist/server/wrangler.json
pnpm exec wrangler secret put CLERK_SECRET_KEY --config dist/server/wrangler.json
```

For local dev, copy `.env.example` → `.env.local` and `.dev.vars.example` → `.dev.vars`.

## Deploy

```bash
pnpm run predeploy:check
pnpm run deploy
```

The Worker is routed at `garage.bartonhome.dev` via `wrangler.jsonc`.

### Predeploy checklist

Run `pnpm run predeploy:check` locally (TypeScript, wrangler route, migrations when `DATABASE_URL` is set). Before the first successful production auth deploy:

1. GitHub repo secrets: `CLOUDFLARE_API_TOKEN`, `VITE_CLERK_PUBLISHABLE_KEY` (`pk_live_…`; optional `CLOUDFLARE_ACCOUNT_ID`).
2. Worker secrets on the `garage` Worker: `DATABASE_URL`, `CLERK_SECRET_KEY` (`sk_live_…`).
3. Neon: `pnpm db:migrate` against production (includes vehicle assets and project-item migrations).
4. Clerk: DNS-only CNAMEs above, `https://garage.bartonhome.dev` allowed, production Google OAuth if you use Google sign-in.

## CI

GitHub Actions deploys on push to `main` when these secrets are set:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID` (optional)
- `VITE_CLERK_PUBLISHABLE_KEY` (production publishable key)
- `DATABASE_URL` and `CLERK_SECRET_KEY` as Worker secrets in the Cloudflare dashboard (not GitHub secrets unless you wire them in)
