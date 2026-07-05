# ChainRoute AI — Phase 1 Audit Report

_Audited before any modification, per mission brief._

## 1. Snapshot

| Area | Finding |
|---|---|
| Framework | Next.js 15.1.3 (App Router), React 19, TypeScript strict |
| Build | ✅ Compiles, typechecks, lints; 25 static routes; deploys on Vercel zero-config |
| Styling | Tailwind + claymorphism design tokens (light/dark via CSS vars) — **solid, keep** |
| UI library | Radix primitives + custom shadcn-style components — **solid, keep** |
| State mgmt | ❌ None. Pages read module-singleton seeded data |
| Backend | ❌ None. No `/api` routes, no middleware, no DB |
| Auth | ❌ UI-only. Forms validate then `router.push('/dashboard')`; `DEMO_USER` constant |
| Env vars | None required |
| Routing | ✅ `(marketing)`, `(auth)`, `dashboard` groups + system pages (404/error/loading) |

## 2. Architecture as-built

- **Frontend:** App Router pages, mostly `"use client"` for charts/interactivity. Clean component layering (`ui/`, `shared/`, `charts/`, `map/`, `dashboard/`, `marketing/`, `auth/`, `brand/`).
- **"Backend":** a deterministic in-memory generator (`src/lib/data/generators.ts`) feeding a module singleton (`src/services/store.ts`). Analytics (`src/services/analytics.ts`) and simulation (`src/services/simulation.ts`) derive from it.
- **Database schema:** none.
- **Auth flow:** none (simulated navigation).
- **API routes / middleware:** none.

## 3. The core problem — fabricated business data (Phase 2 target)

Every operational surface is populated by seeded fake data. Dependency map:

- `getStore()` consumed by: dashboard home, shipments, warehouses, fleet, customers, analytics, ledger, admin, settings, ai + `activity-feed`, `insights-panel`, `live-shipments`, marketing previews.
- `getKpis()`/analytics consumed by: dashboard, analytics, warehouses, fleet, marketing preview.
- `getSimNodes/Routes()` consumed by: simulation page, marketing preview.
- `DEMO_USER` consumed by: topbar, admin, settings.

**120 fake shipments, 8 warehouses, 24 vehicles/drivers, 12 customers, 32 invoices, a pre-minted 60-block ledger, and 8 AI insights are fabricated at module load.** This is the primary thing to invert.

## 4. Issue register

| Class | Findings |
|---|---|
| Broken imports/routes/components | None (build is green) |
| Placeholder/fabricated data | **Pervasive** — see §3 (primary remediation) |
| Hardcoded business metrics | KPI deltas, revenue, CO₂, savings, trust scores, uptime, "API calls today", ledger stats |
| Mock APIs / dummy responses | All "actions" (create/edit/delete/export/invite) `toast()` only — no persistence |
| Disabled/decorative controls | Create/Edit/Delete/Export/Import/Assign/Invite/Apply — none persist |
| Empty pages | None visually, but none data-driven |
| Missing validation | Auth forms validate (zod); entity create dialogs largely do not persist or fully validate |
| Missing API integration | No data layer at all |
| Auth/session/RBAC | Absent (client `DEMO_USER` only) |
| Audit logs / notifications | Static arrays |
| Hydration risk | `relativeTime()` (reads `Date.now()`) used in client render — low risk (hour/day granularity), will move to mount-safe |
| TODOs / Lorem Ipsum | None found |
| Console/React warnings | None at build time |

## 5. Deployment readiness

✅ Vercel-deployable today. No custom server, no unsupported Node APIs, no Docker.

## 6. Remediation strategy (this engagement)

Invert the data direction: **nothing is seeded; users create every record; analytics/ledger derive from those records; empty states everywhere until data exists.**

### Persistence decision (explicit)

A real hosted Postgres/Supabase DB cannot be provisioned in this non-interactive session (no credentials; Supabase connector unauthenticated). Senior-engineer call: implement a **clean repository/collection abstraction backed by browser storage (per-org, namespaced, reactive)**, so the app is 100% functional and still deploys zero-config on Vercel — and the storage driver can be swapped for Supabase/Postgres by replacing one module (`src/lib/db/client.ts`) without touching feature code. This is documented in Remaining Recommendations.

This keeps the existing architecture, design system, routing, and component library fully intact — we change the **data source and wire real behavior**, not the shell.
