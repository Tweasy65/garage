# Deploy Garage to Cloudflare Workers

Production deploy uses the **generated** Wrangler config from the build output (`dist/server/wrangler.json`), not the root `wrangler.jsonc` alone.

## One-time setup

1. **Cloudflare account** with access to the `bartonhome.dev` zone.
2. Log in: `pnpm exec wrangler login`
3. **Neon**: create a Postgres database and run `pnpm db:migrate` with the pooled `DATABASE_URL`.
4. **Clerk**: add `https://garage.bartonhome.dev` to allowed origins and redirect URLs (same Clerk app as other Barton Home apps).

## Environment variables

### Build time (client)

`VITE_CLERK_PUBLISHABLE_KEY` must be set when running `vite build`:

```powershell
$env:VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."; pnpm run deploy
```

### Worker secrets (server)

After the first build:

```bash
pnpm exec wrangler secret put DATABASE_URL --config dist/server/wrangler.json
pnpm exec wrangler secret put CLERK_SECRET_KEY --config dist/server/wrangler.json
```

For local dev, copy `.env.example` → `.env.local` and `.dev.vars.example` → `.dev.vars`.

## Deploy

```bash
pnpm run deploy
```

The Worker is routed at `garage.bartonhome.dev` via `wrangler.jsonc`.

## CI

GitHub Actions deploys on push to `main` when these secrets are set:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID` (optional)
- `VITE_CLERK_PUBLISHABLE_KEY`
- `DATABASE_URL` and `CLERK_SECRET_KEY` as Worker secrets in the Cloudflare dashboard (not GitHub secrets unless you wire them in)
