# Prop Firm Compare

A sortable, filterable dashboard for comparing **48 proprietary trading firms**
side by side — drawdown, profit split, payout speed, leverage, automation/API
policy, and full per-program rules — so you can find the right firm without
opening 48 browser tabs.

🔗 **Live:** https://prop-firm-compare-two.vercel.app

> Crypto-focused, but the dataset also covers firms offering forex and futures.
> Built as part of [TradeSurge](https://tradesurge.co); intended to live at
> `tradesurge.co/propfirms`.

---

## Purpose & intention

Prop-firm terms are scattered, inconsistent, and change often. Every firm
presents its drawdown rules, profit splits, and payout timelines differently,
which makes apples-to-apples comparison genuinely hard. This dashboard pulls the
numbers that actually decide a purchase into **one comparable table**, with an
honest signal of **how trustworthy each number is** and a link back to the
source.

It is a **decision-support tool, not a referral funnel** — there are no
affiliate links steering you toward whoever pays the most. The goal is simply:
see the real tradeoffs quickly, shortlist a few firms, and verify the final
details on the firm's own site before you pay.

## What it is (the build)

- **Next.js 15 + React 19 + TypeScript**, styled with **Tailwind** — a fully
  static site (no backend, no login, no tracking).
- **48 firms** hand-curated into a typed dataset (`data/firms.json`), each with a
  flagship summary row **and** a per-program rule breakdown.
- Filtering, sorting, and side-by-side comparison all happen **client-side** —
  it's fast and works without a server.
- Your shortlist is saved to your **browser's local storage**, so pinned firms
  persist between visits on the same device. Nothing leaves your machine.

## How to navigate

1. **The table (home page)** — one row per firm. Click any **column header** to
   sort (drawdown, profit split, payout speed, leverage, confidence, etc.).
   Sorting again flips the direction.
2. **Filter bar** — narrow the list by funding model (challenge / instant),
   asset class, and other attributes to cut the field down to what fits you.
3. **Column definitions** — tap/click the **header labels** to open a popover
   explaining what each column means (drawdown type, profit split, the
   "Bots / API" automation column, and so on).
4. **Shortlist & compare** — **pin** the firms you're considering, then open the
   **compare panel** to see them head-to-head. In comparison view the **most
   favorable value in each row is highlighted**, so the better drawdown, higher
   split, or faster payout stands out at a glance.
5. **Firm detail page** — click a firm's name to open its subpage
   (`/firms/[id]`) with the **full per-program rule breakdown** — each plan's
   own drawdown, target, split, pricing, and payout terms.

## What to look out for

- **Check the confidence dot first.** Each firm carries a data-confidence rating
  shown as a coloured dot by its name and as a sortable **Confidence** column:
  - 🟢 **high** — verified recently against a known source.
  - 🟠 **medium** — matches my last reading, but worth re-checking.
  - 🔴 **low** — older or thinly sourced; verify thoroughly.
  *(Current dataset: 37 high, 11 medium.)*
- **Mind the `lastVerified` date.** Prop-firm rules change frequently. Every row
  shows when it was last checked — older dates are likelier to be stale.
- **Always confirm on the firm's own site before purchasing.** This dashboard is
  a starting point for comparison, not a contract. Numbers reflect publicly
  stated terms at the verification date.
- **The "Bots / API" column** flags whether you can connect third-party
  execution/copy bots or trade-scope API keys to *your own* funded account — the
  feasibility axis matters if you intend to automate.
- **Not financial advice**, and **not an endorsement** of any firm. Prop trading
  carries real risk of losing your evaluation fee (and more on funded capital).

---

## Run locally

```bash
pnpm install   # or npm install
pnpm dev       # http://localhost:3000
```

## Architecture

- **Data:** `data/firms.json` — typed dataset, one row per firm
- **Types:** `lib/firms.ts` — `Firm` / `ProgramDetail` types, formatters, sort keys
- **UI:** `app/page.tsx` → `components/dashboard.tsx` → `firm-table.tsx` + `filter-bar.tsx` + `compare-panel.tsx`
- **Subpages:** `app/firms/[id]/page.tsx` — statically generated per-firm rule pages
- **Shortlist:** `lib/use-pinned.ts` — pin/compare state persisted to `localStorage`
- **Refresh:** `scripts/refresh.ts` — per-firm scrape adapters

The page is fully static. Filtering and sorting happen client-side over the
seeded JSON. To refresh data, extend the adapters in `scripts/refresh.ts` and
run `pnpm refresh`.

## Why isn't this live-scraping on page load?

Most prop firm pricing pages are:

1. Rendered client-side (JS), so `fetch()` returns an empty shell.
2. Behind Cloudflare's bot challenge.
3. Inconsistent in layout — no two firms share a schema.

The realistic pattern is a scheduled scrape (Vercel Cron or GitHub Action)
running Playwright, writing to `data/firms.json` or to Vercel Blob/KV, and the
dashboard reading from there. The skeleton in `scripts/refresh.ts` shows the
structure.

## Adding a firm

1. Append an entry to `data/firms.json` matching the `Firm` type in `lib/firms.ts`.
2. Optionally add a scrape adapter in `scripts/refresh.ts`.

## Deploy

```bash
vercel
```

No env vars required for the read-only dashboard. The refresh script can be wired
to a Vercel Cron with an API route that calls `runAll()` and persists to Blob/KV.

---

*Data reflects publicly stated terms at each firm's `lastVerified` date. Prop
firm terms change frequently — always confirm on the firm's site before
purchasing. Not financial advice.*
