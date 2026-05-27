/**
 * Refresh data/firms.json by re-scraping per-firm adapters.
 *
 * Reality check: most prop firm pricing pages are JS-rendered behind
 * Cloudflare. A robust scrape needs:
 *   - playwright (or a Browserless API) for JS rendering
 *   - residential proxies for some firms that geo/ASN-block
 *   - per-firm CSS/text extraction adapters because no two sites match
 *
 * This file is the skeleton. Each adapter returns a partial Firm patch
 * (only the fields it can reliably extract). The merger preserves existing
 * fields when extraction fails so a single broken adapter never wipes the
 * dataset.
 *
 * Run: pnpm refresh   (or)   npx tsx scripts/refresh.ts
 * Recommended: schedule via Vercel Cron pointing at an API route that
 * imports this script's `runAll()`, writes to KV/Blob, and the dashboard
 * reads from there.
 */

import fs from "node:fs";
import path from "node:path";
import type { Firm } from "../lib/firms";

interface DatasetFile {
  generatedAt: string;
  disclaimer: string;
  firms: Firm[];
}

type Adapter = (current: Firm) => Promise<Partial<Firm> | null>;

const DATA_PATH = path.join(process.cwd(), "data", "firms.json");

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function pctFromHtml(html: string, pattern: RegExp): number | null {
  const m = html.match(pattern);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Per-firm adapters. These are intentionally minimal stubs. For production,
 * replace `fetchHtml` with a Playwright session per adapter and tighten
 * the extraction regex to the specific DOM of each site.
 * ──────────────────────────────────────────────────────────────────────── */

const cryptoFundTrader: Adapter = async (firm) => {
  const html = await fetchHtml("https://cryptofundtrader.com/pricing");
  if (!html) return null;
  return {
    dailyDrawdownPct: pctFromHtml(html, /daily\s*(?:loss|drawdown)[^%]{0,30}?(\d+(?:\.\d+)?)\s*%/i) ?? firm.dailyDrawdownPct,
    maxDrawdownPct:   pctFromHtml(html, /(?:max|maximum)\s*(?:loss|drawdown)[^%]{0,30}?(\d+(?:\.\d+)?)\s*%/i) ?? firm.maxDrawdownPct,
  };
};

const ftmo: Adapter = async (firm) => {
  const html = await fetchHtml("https://ftmo.com/en/trading-conditions");
  if (!html) return null;
  return {
    dailyDrawdownPct: pctFromHtml(html, /daily\s*loss[^%]{0,30}?(\d+(?:\.\d+)?)\s*%/i) ?? firm.dailyDrawdownPct,
    maxDrawdownPct:   pctFromHtml(html, /max(?:imum)?\s*loss[^%]{0,30}?(\d+(?:\.\d+)?)\s*%/i) ?? firm.maxDrawdownPct,
  };
};

// Add more adapters here, keyed by Firm.id.
const adapters: Record<string, Adapter> = {
  "crypto-fund-trader": cryptoFundTrader,
  ftmo,
};

async function runAll(): Promise<void> {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const dataset = JSON.parse(raw) as DatasetFile;

  const today = new Date().toISOString().slice(0, 10);
  const updated: Firm[] = [];
  let changed = 0;

  for (const firm of dataset.firms) {
    const adapter = adapters[firm.id];
    if (!adapter) {
      updated.push(firm);
      continue;
    }
    try {
      const patch = await adapter(firm);
      if (!patch) {
        console.warn(`[skip] ${firm.id}: adapter returned null`);
        updated.push(firm);
        continue;
      }
      const merged: Firm = { ...firm, ...patch, lastVerified: today };
      const firmRecord = firm as unknown as Record<string, unknown>;
      const diff = Object.entries(patch).filter(
        ([k, v]) => firmRecord[k] !== v,
      );
      if (diff.length > 0) {
        changed++;
        console.log(`[updated] ${firm.id}:`, Object.fromEntries(diff));
      }
      updated.push(merged);
    } catch (err) {
      console.warn(`[error] ${firm.id}:`, err);
      updated.push(firm);
    }
  }

  const out: DatasetFile = {
    ...dataset,
    generatedAt: today,
    firms: updated,
  };
  fs.writeFileSync(DATA_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${DATA_PATH}. ${changed} firm(s) had field changes.`);
}

runAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
