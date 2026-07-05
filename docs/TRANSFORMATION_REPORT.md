# ChainRoute AI — Production Transformation Report

Converted from an AI-generated fake-data demo into a **real, data-driven SaaS** where
every record is user-entered, every analytic is computed, and every control works. The
existing architecture, claymorphism design system, routing, and component library were
**preserved**; only the data direction was inverted.

---

## 1. Audit (Phase 1)
Full report in [`docs/AUDIT.md`](./AUDIT.md). Headline: build was green but **100% of
operational surfaces were fed by a seeded generator** (120 fake shipments, 8 warehouses,
24 vehicles/drivers, 12 customers, a pre-minted 60-block ledger, `DEMO_USER`). No state
management, no persistence, no auth, no working mutations.

## 2. Bugs / anti-patterns found
- Every "action" (create/edit/delete/export/invite/apply) was a `toast()` with no effect.
- All KPIs, charts, revenue, CO₂, trust scores, uptime, "API calls today" were hardcoded.
- Auth was navigation-only; `DEMO_USER` constant; no session, no guard, no RBAC.
- Static notifications, static audit logs, static insights ("AI").
- `relativeTime()` (reads `Date.now()`) rendered on the client — hydration risk.

## 3. Bugs fixed / behaviour now correct
- All fabricated data removed from the app; deleted `services/store`, `services/analytics`,
  `services/simulation`, `lib/data/generators`, and `DEMO_USER`.
- Every mutation persists, writes an audit-log entry, and reactively refreshes the UI.
- Auth is real (client-side): unique-email signup, password hash+verify, session, guard,
  logout, functional password reset.
- Analytics/ledger/insights are computed from stored records; empty until data exists.

## 4. New architecture (Phases 2–14)
| Layer | Module |
|---|---|
| Storage driver (swappable) | `src/lib/db/client.ts` — reactive, SSR-safe, per-org namespaced `localStorage` via `useSyncExternalStore`; cross-tab sync |
| Repository | `src/lib/db/collections.ts` — typed CRUD `Repo<T>` |
| Domain model | `src/lib/db/types.ts` — Organization, Account, Warehouse, Vehicle, Driver, Customer, Shipment, LedgerBlock, Invoice, AuditLog, Notification |
| Auth | `src/lib/auth/accounts.ts` + `providers/auth-provider.tsx` (`useAuth`) + `dashboard/auth-guard.tsx` |
| Reactive reads | `hooks/use-collection.ts`, `hooks/use-org-data.ts`, `hooks/use-notifications.ts` |
| Analytics (pure) | `src/lib/analytics/compute.ts` — stats + 8 series, all empty-when-no-data |
| Ledger | `src/lib/ledger/mint.ts` — `mintLedgerBlock` (hash-chained) + `verifyChain` |
| Domain math | `src/lib/domain/calc.ts` — `shipmentCost`, `shipmentEmissions`, `nextReference` |
| Audit + notifications | `src/lib/db/audit.ts` |
| Forms | `src/components/form/field.tsx`, `src/config/options.ts` |
| Onboarding | `src/app/onboarding/page.tsx` (3-step wizard) |
| Command palette + hotkeys | `components/dashboard/command-palette.tsx`, `hooks/use-hotkey.ts` (⌘K) |

## 5. Features added
- **Organization / company profile** (name, legal name, GSTIN, industry, currency, address).
- **Auth**: signup, login, session management, guard, logout, functional forgot/reset (on-screen code since email is simulated).
- **RBAC**: 5 roles; admin-only nav; team management (invite, role change, suspend; no self-lockout).
- **CRUD** for warehouses, vehicles (with two-way driver linkage), drivers, customers, shipments, invoices — validated (zod), persisted, reactive.
- **Shipment costing**: freight/fuel/packaging/insurance/other + GST → live subtotal/tax/total; estimated CO₂ from weight × distance × mode.
- **Decentralized ledger**: real blocks minted on shipment create + status change; chain-integrity verification.
- **Dynamic analytics**: delivery/revenue/mode/status/cost/fleet/warehouse series + CSV export from real data.
- **Rules-based insight engine** (transparent, no fabricated AI outputs).
- **Onboarding wizard**, **command palette (⌘K)** + `?new=1` deep-links, **real notifications**, **audit log**, **theme system** (light/dark/system, persisted).
- **Professional empty states** on every list/table/chart/KPI.

## 6–9. Security / performance / UX / a11y
- **Security**: unique-email enforcement, hashed passwords, session guard, org-scoped data isolation, no self-suspend. (Documented limitation: client-side demo hashing — swap the storage driver for a server + KDF for production.)
- **Performance**: static prerender of all 26 routes; `useSyncExternalStore` scopes re-renders to changed collections; `optimizePackageImports`; deterministic renders (no hydration mismatch).
- **UX**: guided onboarding, ⌘K palette, deep-linked create dialogs, live totals in forms, empty-state CTAs, loading/skeleton states, toasts.
- **Accessibility**: labeled fields, aria on controls, keyboard nav, focus rings, theme-aware contrast.

## 10. Verification (Phase 15)
- `tsc --noEmit`: **0 errors** (strict, no `any`). `next build`: **0 warnings, 26 routes** prerendered.
- **End-to-end browser test (real Chrome):** signup → org+account+session persisted → onboarding → guard → dashboard empty states (15 "—") → create warehouse (persists, `serviceAreas` parsed) → **Warehouse Utilization KPI recomputed live — → 75%** → audit logged → create customer → create shipment `CR-100001` → **ledger block #1 minted** (genesis prev-hash, chained) → ledger explorer shows block, chain integrity **Valid** → theme toggle light↔dark persisted, no breakage.

## Remaining recommendations
1. **Swap storage driver to a real DB** (Supabase/Postgres): implement the async version of `src/lib/db/client.ts` + move auth to the server with a proper KDF (argon2/bcrypt) and httpOnly session cookies. Feature code above the repository layer needs no changes.
2. Add server-side rate limiting, email delivery (verification/reset/invoices), and file upload for the company logo/avatars.
3. Subscription/billing (Stripe) — the tier model already exists on the marketing side.
4. Wire the insight engine's interface to a real model endpoint (architecture is pluggable).
