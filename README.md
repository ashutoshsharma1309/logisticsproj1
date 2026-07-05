# ChainRoute AI

**Decentralized Logistics Intelligence Platform**

An AI-powered logistics SaaS that turns every shipment event into an immutable ledger
entry (**Blockchain Simulation Mode** — a decentralized simulation, *not* a real
blockchain), predicts delays, optimizes routes, and delivers enterprise-grade supply-chain
visibility. Built with a claymorphism design system, full dark/light theming, and premium
motion.

> **Blockchain Simulation Mode:** ChainRoute AI models a decentralized ledger for
> education and demonstration. It is not connected to any live blockchain network.

## ✨ Highlights

- **Landing site** — hero, features, decentralization explainer, AI showcase, live map
  preview, dashboard preview, testimonials, pricing, FAQ, CTA.
- **Authentication UI** — login, signup with role selection, forgot password, 6-digit OTP,
  social buttons (all client-side, form-validated with Zod).
- **Analytics dashboard** — KPI metric cards, revenue/delivery/mode/risk charts, live
  shipments, AI suggestions, activity feed.
- **Shipment management** — filterable table, create/edit dialogs, per-shipment ledger
  timeline & verification.
- **Warehouse module** — capacity, utilization heatmap, zones, inbound/outbound.
- **Fleet module** — vehicles, fuel analytics, maintenance alerts, driver trust scores.
- **Ledger Explorer** — blockchain-explorer-style block/transaction browser with search,
  filter, pagination, hash chaining.
- **Live Simulation** — animated multimodal world map (trucks, ships, planes, rail) that
  mints simulated ledger blocks in real time; play / pause / speed / replay / inspect.
- **AI Intelligence** — delay prediction, route suggestions, risk, warehouse optimization,
  demand & cost forecasting, fraud detection, health scores.
- **Customers, Admin, Settings** — CRM, invoices, user & permission management, platform
  metrics, logs, appearance/security/billing.

## 🧱 Tech Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS · Framer Motion ·
Recharts · React Hook Form · Zod · Radix UI primitives · Lucide · next-themes · Sonner.

All demo data is generated **deterministically** so server and client renders always match
(no hydration mismatch) and the simulated hash-chain stays internally consistent.

## 🚀 Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # strict type check
```

## ☁️ Deploy on Vercel

Zero configuration required — no custom server, no Docker, no unsupported Node APIs. Push to
a Git provider and import into Vercel, or run `vercel`.

## 📁 Structure

```
src/
  app/            # App Router routes: (marketing), (auth), dashboard, system pages
  components/     # ui/ primitives, shared/, charts/, map/, dashboard/, marketing/, brand/, auth/
  features/       # feature-scoped composites
  hooks/          # reusable client hooks (simulation, counters, media query)
  services/       # data store + analytics + simulation derivations
  lib/            # utils, deterministic hashing, geo, data generators
  config/         # navigation, status metadata, demo user
  types/          # shared TypeScript models
  styles/         # global claymorphism design tokens
```
