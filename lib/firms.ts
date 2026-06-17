export type FundingModel = "challenge" | "instant" | "both";
export type DrawdownType = "static" | "trailing" | "mixed";
export type Confidence = "high" | "medium" | "low";
export type FirmStatus = "active" | "closed";
export type AssetClass = "crypto" | "forex" | "futures";

/** TradeSurge automation/API axis: can a trader connect a 3rd-party execution/copy bot to their OWN account? */
export type AutomationLevel = "allowed" | "restricted" | "banned" | "unknown";
export type ApiKeyAccess = "trade" | "read-only" | "none" | "unknown";
export type MiraFeasibility = "high" | "medium" | "low" | "none";

export interface Automation {
  platform: string;             // execution platform / infrastructure
  ea: AutomationLevel;          // Expert-Advisor / bot / algo policy on funded accounts
  apiKeys: ApiKeyAccess;        // real broker/exchange trade-scope API keys to the trader's own account
  copy: string;                 // copy-trading / account-sharing / 3rd-party-management constraint
  feasibility: MiraFeasibility; // overall fit for connecting a SaaS via the trader's own key/EA
  note: string;
}

/**
 * One purchasable program/plan within a firm, with its OWN rules. Most firms run
 * several with materially different drawdown/target/split — the flat Firm fields
 * carry the flagship; `programDetails` carries the full breakdown for the subpage.
 * Drawdown is always a % (convert $-denominated futures limits via $ / account
 * size; a range string like "2.7-4%" is fine). "None"/"N/A" allowed; null = unknown.
 */
export interface ProgramDetail {
  name: string;                              // "1-Phase", "Instant", "Rapid", "Knight 1-Step"
  steps?: string;                            // "1-step" | "2-step" | "3-step" | "instant" | "allocation"
  model?: FundingModel;
  accountSizes?: number[];                   // omit when identical to the firm-level sizes
  dailyDrawdownPct: number | string | null;
  maxDrawdownPct: number | string | null;
  drawdownType: DrawdownType;
  profitTargetPct: number | string | null;
  profitSplitPct: number | string | null;
  payoutDays?: number | string | null;
  note?: string;                             // short qualifier (e.g. "EOD trailing; pauses, doesn't fail")
}

export interface Firm {
  id: string;
  name: string;
  website: string;
  fundingModel: FundingModel;
  assetClasses: AssetClass[];
  programs: string[];
  accountSizes: number[];
  // Drawdown / target / payout-days / leverage accept a string for cases the
  // dashboard must show accurately but aren't a single %: dollar-denominated
  // limits (e.g. "$2.5k–7.5k"), "None" (no such limit), or "N/A" (allocation
  // models). A number still means a percentage / days / leverage multiple.
  dailyDrawdownPct: number | string | null;
  maxDrawdownPct: number | string | null;
  drawdownType: DrawdownType;
  profitTargetPct: number | string | null;
  profitSplitPct: number;
  maxFundedTotal: number | null;
  payoutDays: number | string | null;
  payoutSpeed: string | null;
  payoutSpeedHours: number | null;
  cryptoLeverage: number | string | null;
  cryptoAssets: string;
  notes: string;
  source: string;
  lastVerified: string;
  confidence: Confidence;
  status: FirmStatus;
  /** Per-program rule breakdown (optional; subpage falls back to flagship fields). */
  programDetails?: ProgramDetail[];
  /** TradeSurge automation/API-key feasibility axis (added 2026-06-07). */
  automation?: Automation;
}

export function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) {
    const k = n / 1_000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `$${n}`;
}

export function formatSizes(sizes: number[]): string {
  if (sizes.length === 0) return "—";
  if (sizes.length === 1) return formatMoney(sizes[0]);
  const min = Math.min(...sizes);
  const max = Math.max(...sizes);
  return `${formatMoney(min)}–${formatMoney(max)}`;
}

export function formatPct(n: number | string | null): string {
  if (n == null) return "—";
  return typeof n === "number" ? `${n}%` : n;
}

export function formatDays(n: number | string | null): string {
  if (n == null) return "—";
  return typeof n === "number" ? `${n}d` : n;
}

export function formatLeverage(n: number | string | null): string {
  if (n == null) return "—";
  return typeof n === "number" ? `1:${n}` : n;
}

/** Sort key for fields that may hold a string ($/None/N/A) — strings sort last. */
export function numOrNull(v: number | string | null): number | null {
  return typeof v === "number" ? v : null;
}

/** Short label for the "Bots / API" column — the primary way a trader could automate. */
export function automationLabel(a?: Automation): string {
  if (!a) return "—";
  if (a.apiKeys === "trade") return "API key";
  if (a.ea === "allowed") return "EA / bots";
  if (a.ea === "restricted") return "EA limited";
  if (a.ea === "banned") return "No bots";
  return "Unknown";
}

/** Sort rank for the automation column (best fit first). */
export function feasibilityRank(f?: MiraFeasibility): number {
  return f === "high" ? 0 : f === "medium" ? 1 : f === "low" ? 2 : f === "none" ? 3 : 4;
}
