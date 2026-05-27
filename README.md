# Prop Firm Compare

Sortable, filterable Next.js dashboard comparing 45 crypto-focused prop
trading firms — drawdown, profit split, payout speed, leverage, and
per-program rules. Pin firms to a shortlist and compare them side by side;
each firm has a detail subpage with its full per-program rule breakdown.

## Run

```bash
pnpm install   # or npm install
pnpm dev       # http://localhost:3000
```

## Architecture

- **Data:** `data/firms.json` — typed dataset, one row per firm
- **Types:** `lib/firms.ts` — `Firm` type, formatters
- **UI:** `app/page.tsx` → `components/dashboard.tsx` → `firm-table.tsx` + `filter-bar.tsx` + `compare-panel.tsx`
- **Subpages:** `app/firms/[id]/page.tsx` — statically generated per-firm rule pages
- **Shortlist:** `lib/use-pinned.ts` — pin/compare state persisted to `localStorage`
- **Refresh:** `scripts/refresh.ts` — per-firm scrape adapters

The page is fully static. Filtering and sorting happen client-side over
the seeded JSON. To refresh data, extend the adapters in `scripts/refresh.ts`
and run `pnpm refresh`.

## Why isn't this live-scraping on page load?

Most prop firm pricing pages are:

1. Rendered client-side (JS), so `fetch()` returns an empty shell.
2. Behind Cloudflare's bot challenge.
3. Inconsistent in layout — no two firms share a schema.

The realistic pattern is a scheduled scrape (Vercel Cron or GitHub Action)
running Playwright, writing to `data/firms.json` or to Vercel Blob/KV,
and the dashboard reading from there. The skeleton in `scripts/refresh.ts`
shows the structure.

## Data quality

Each firm row carries a `confidence` value:

- **high (green)** — verified recently against a known source
- **medium (orange)** — values match my last reading but worth re-checking
- **low (red)** — older or thinly sourced; verify thoroughly

The UI shows the dot next to the firm name and surfaces `lastVerified`
as a column. Always confirm on the firm's site before purchasing.

## Adding a firm

1. Append an entry to `data/firms.json` matching the `Firm` type in
   `lib/firms.ts`.
2. Optionally add a scrape adapter in `scripts/refresh.ts`.

## Deploy

```bash
vercel
```

No env vars required for the read-only dashboard. The refresh script
can be wired to a Vercel Cron with an API route that calls `runAll()`
and persists to Blob/KV.
