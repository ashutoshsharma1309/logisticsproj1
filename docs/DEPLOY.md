# Deploying ChainRoute AI

The app is a standard Next.js 15 App Router project with **no backend, no database,
and no environment variables required**. It builds to fully static + client-rendered
output and hosts anywhere that runs Next.js.

## Option A — Vercel (recommended, 1 minute)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset auto-detects **Next.js**. Leave all defaults. No env vars needed.
4. Click **Deploy**. Your site is live at `https://<project>.vercel.app`.

Or via CLI:

```bash
npm i -g vercel
vercel            # preview deploy
vercel --prod     # production deploy
```

## Option B — Netlify

1. Import the repo at [app.netlify.com](https://app.netlify.com).
2. Build command: `npm run build` · Publish: `.next` (the official
   `@netlify/plugin-nextjs` is auto-installed). Deploy.

## Option C — Any Node host / Docker

```bash
npm ci
npm run build
npm run start     # serves on $PORT (default 3000)
```

Put it behind a reverse proxy (Nginx/Caddy) with TLS. The app already sets
security headers (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy)
via `next.config.mjs`.

## Notes for a public/hosted demo

- **Data model:** each visitor gets their own private workspace persisted in **their
  browser** (localStorage, namespaced per organization). Nothing is shared or sent to a
  server. This is ideal for a portfolio/demo deploy — zero infra, zero cost.
- **Demo data:** visitors can click **"Load demo data"** (dashboard empty state or
  Settings → Data) to populate a realistic sample dataset, and reset it anytime.
- **Going multi-user / multi-device:** swap the single storage driver
  `src/lib/db/client.ts` for a hosted DB (Supabase/Postgres) and move auth to the server.
  No feature code changes are required above the repository layer. See
  `docs/TRANSFORMATION_REPORT.md` → Remaining recommendations.

## Pre-deploy checklist

```bash
npm run typecheck   # 0 errors
npm run build       # 0 warnings, all routes generated
```
