# Deploy Garage to Cloudflare Workers

Production deploy uses the **generated** Wrangler config from the build output (`dist/server/wrangler.json`), not the root `wrangler.jsonc` alone.

Garage is linked to the Clerk application **barton-home**. Production uses a **secondary** Clerk domain on `garage.bartonhome.dev` because `bartonhome.dev` is already claimed by another Clerk app (`clerk.bartonhome.dev`). Sessions are **not** shared with that other app.

## One-time setup

1. **Cloudflare account** with access to the `bartonhome.dev` zone.
2. Log in: `pnpm exec wrangler login`
3. **Neon**: create a Postgres database and run `pnpm db:migrate` with the pooled `DATABASE_URL`.
4. **Clerk production instance** (already created for barton-home):
   - Add the Clerk CNAMEs below as **DNS only** (grey cloud) on Cloudflare. Proxied records fail Clerk’s DNS check.
   - Production Google OAuth credentials in the Clerk Dashboard (shared Google creds only work in development).
   - After DNS/SSL verify, use **Deploy certificates** in the Clerk Dashboard if it is still pending.
5. Pull production keys locally (gitignored): `npx clerk env pull --instance prod --file .env.production.local`
6. GitHub repository secret `VITE_CLERK_PUBLISHABLE_KEY` = production `pk_live_…` (baked into the client at `vite build`).
7. Worker secret `CLERK_SECRET_KEY` = production `sk_live_…` (`wrangler secret put`, never `vars`).

### Clerk DNS (DNS only)

| Type | Name | Target |
| --- | --- | --- |
| CNAME | `clerk.garage.bartonhome.dev` | `frontend-api.clerk.services` |
| CNAME | `accounts.garage.bartonhome.dev` | `accounts.clerk.services` |
| CNAME | `clkmail.garage.bartonhome.dev` | `mail.yhr5sm7qnye1.clerk.services` |
| CNAME | `clk._domainkey.garage.bartonhome.dev` | `dkim1.yhr5sm7qnye1.clerk.services` |
| CNAME | `clk2._domainkey.garage.bartonhome.dev` | `dkim2.yhr5sm7qnye1.clerk.services` |

Check with `npx clerk deploy status`. Do not proxy these names through Cloudflare.

Local development keeps `pk_test_` / `sk_test_` in `.env.local` and `.dev.vars`.

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
