"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ExternalLink, Pin, SearchX } from "lucide-react";
import type { AssetClass, Automation, DrawdownType, Firm } from "@/lib/firms";
import {
  automationLabel,
  bestValue,
  feasibilityRank,
  formatDays,
  formatLeverage,
  formatMoney,
  formatPct,
  formatSizes,
  leaderClass,
  leverageOrNull,
  numOrNull,
} from "@/lib/firms";
import { Badge } from "./ui/primitives";

type SortKey =
  | "name"
  | "fundingModel"
  | "dailyDrawdownPct"
  | "maxDrawdownPct"
  | "drawdownType"
  | "profitTargetPct"
  | "profitSplitPct"
  | "maxFundedTotal"
  | "payoutDays"
  | "payoutSpeedHours"
  | "cryptoLeverage"
  | "feasibility";

type SortDir = "asc" | "desc";

interface Props {
  firms: Firm[];
  fundingModel: "all" | "challenge" | "instant" | "both";
  assetClass: "all" | AssetClass;
  minLeverage: number;
  drawdownType: "all" | DrawdownType;
  payoutSpeed: "any" | "24" | "48";
  pinnedOnly: boolean;
  search: string;
  pinned: Set<string>;
  togglePin: (id: string) => void;
}

// Columns that are numeric and can show leader highlight, keyed by SortKey.
// Value = "higher" means bigger = better; "lower" means smaller = better.
const NUMERIC_BETTER: Partial<Record<SortKey, "higher" | "lower">> = {
  profitSplitPct: "higher",
  maxFundedTotal: "higher",
  maxDrawdownPct: "lower",
  dailyDrawdownPct: "lower",
  payoutSpeedHours: "lower",
  payoutDays: "lower",
  cryptoLeverage: "higher",
  profitTargetPct: "lower",
};

// Extract the numeric value used for the active sort from a firm row.
function sortNumericValue(f: Firm, k: SortKey): number | null {
  switch (k) {
    case "profitSplitPct":
      return f.profitSplitPct;
    case "maxFundedTotal":
      return f.maxFundedTotal ?? null;
    case "maxDrawdownPct":
      return numOrNull(f.maxDrawdownPct);
    case "dailyDrawdownPct":
      return numOrNull(f.dailyDrawdownPct);
    case "payoutSpeedHours":
      return f.payoutSpeedHours ?? null;
    case "payoutDays":
      return numOrNull(f.payoutDays);
    case "cryptoLeverage":
      return leverageOrNull(f.cryptoLeverage);
    case "profitTargetPct":
      return numOrNull(f.profitTargetPct);
    default:
      return null;
  }
}

function nullLast(a: number | null, b: number | null, dir: SortDir): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return dir === "asc" ? a - b : b - a;
}

function cmpStr(a: string, b: string, dir: SortDir): number {
  const r = a.localeCompare(b);
  return dir === "asc" ? r : -r;
}

function automationCell(a?: Automation) {
  const f = a?.feasibility;
  const tone: "neutral" | "positive" | "negative" | "accent" | "amber" =
    f === "high"
      ? "positive"
      : f === "medium"
      ? "amber"
      : f === "low"
      ? "neutral"
      : f === "none"
      ? "negative"
      : "neutral";
  const title = a
    ? `${a.platform} — EA/bots: ${a.ea}, API keys: ${a.apiKeys}. ${a.copy}. TradeSurge fit: ${a.feasibility}. ${a.note}`
    : "No automation data";
  return (
    <span title={title}>
      <Badge tone={tone}>{automationLabel(a)}</Badge>
    </span>
  );
}

function confidenceDot(c: Firm["confidence"]) {
  const color =
    c === "high" ? "text-positive" : c === "medium" ? "text-warn" : "text-danger";
  const text =
    c === "high" ? "High" : c === "medium" ? "Medium" : "Low";
  const label =
    c === "high"
      ? "High confidence (verified recently)"
      : c === "medium"
      ? "Medium confidence (verify before purchase)"
      : "Low confidence (verify thoroughly)";
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-muted" title={label}>
      <span className={color} aria-hidden="true">●</span>
      <span>{text}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function PinButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? "Unpin firm" : "Pin firm"}
      title={active ? "Unpin from shortlist" : "Pin to shortlist"}
      className={`focus-ring inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md leading-none transition-colors ${
        active ? "text-accent" : "text-muted hover:text-text"
      }`}
    >
      <Pin aria-hidden="true" size={16} strokeWidth={1.5} />
    </button>
  );
}

export default function FirmTable({
  firms,
  fundingModel,
  assetClass,
  minLeverage,
  drawdownType,
  payoutSpeed,
  pinnedOnly,
  search,
  pinned,
  togglePin,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("profitSplitPct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return firms.filter((f) => {
      if (fundingModel !== "all" && f.fundingModel !== fundingModel) return false;
      if (assetClass !== "all" && !f.assetClasses.includes(assetClass)) return false;
      if (drawdownType !== "all" && f.drawdownType !== drawdownType) return false;
      if (payoutSpeed !== "any") {
        const hours = numOrNull(f.payoutSpeedHours);
        const cap = payoutSpeed === "24" ? 24 : 48;
        if (hours == null || hours > cap) return false;
      }
      if (pinnedOnly && !pinned.has(f.id)) return false;
      if (minLeverage > 0) {
        const lev = leverageOrNull(f.cryptoLeverage);
        if (lev == null || lev < minLeverage) return false;
      }
      if (q && !f.name.toLowerCase().includes(q) && !f.cryptoAssets.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [firms, fundingModel, assetClass, minLeverage, drawdownType, payoutSpeed, pinnedOnly, pinned, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      // Pinned firms always float to the top, above the active sort.
      const ap = pinned.has(a.id) ? 0 : 1;
      const bp = pinned.has(b.id) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      switch (sortKey) {
        case "name":
          return cmpStr(a.name, b.name, sortDir);
        case "fundingModel":
          return cmpStr(a.fundingModel, b.fundingModel, sortDir);
        case "drawdownType":
          return cmpStr(a.drawdownType, b.drawdownType, sortDir);
        case "profitTargetPct":
          return nullLast(numOrNull(a.profitTargetPct), numOrNull(b.profitTargetPct), sortDir);
        case "dailyDrawdownPct":
          return nullLast(numOrNull(a.dailyDrawdownPct), numOrNull(b.dailyDrawdownPct), sortDir);
        case "maxDrawdownPct":
          return nullLast(numOrNull(a.maxDrawdownPct), numOrNull(b.maxDrawdownPct), sortDir);
        case "profitSplitPct":
          return sortDir === "asc"
            ? a.profitSplitPct - b.profitSplitPct
            : b.profitSplitPct - a.profitSplitPct;
        case "maxFundedTotal":
          return nullLast(a.maxFundedTotal, b.maxFundedTotal, sortDir);
        case "payoutDays":
          return nullLast(numOrNull(a.payoutDays), numOrNull(b.payoutDays), sortDir);
        case "payoutSpeedHours":
          return nullLast(a.payoutSpeedHours, b.payoutSpeedHours, sortDir);
        case "cryptoLeverage":
          return nullLast(leverageOrNull(a.cryptoLeverage), leverageOrNull(b.cryptoLeverage), sortDir);
        case "feasibility": {
          const ra = feasibilityRank(a.automation?.feasibility);
          const rb = feasibilityRank(b.automation?.feasibility);
          return sortDir === "asc" ? ra - rb : rb - ra;
        }
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir, pinned]);

  // Compute best-in-view value for the active sorted numeric column (#3 decisive-number highlight).
  const activeLeaderBest = useMemo<number | null>(() => {
    const dir = NUMERIC_BETTER[sortKey];
    if (!dir) return null;
    const vals = sorted.map((f) => sortNumericValue(f, sortKey));
    return bestValue(vals, dir);
  }, [sorted, sortKey]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(
        k === "name" || k === "fundingModel" || k === "drawdownType" || k === "feasibility"
          ? "asc"
          : "desc",
      );
    }
  }

  const sortIcon = (k: SortKey) => {
    if (sortKey !== k) return null;
    const Icon = sortDir === "asc" ? ChevronUp : ChevronDown;
    return <Icon aria-hidden="true" className="text-accent" size={14} strokeWidth={1.5} />;
  };

  const Th = ({ k, label, align = "left", title }: { k: SortKey; label: string; align?: "left" | "right"; title?: string }) => {
    const isActive = sortKey === k;
    const alignClass = align === "right" ? "text-right" : "text-left";
    const justifyClass = align === "right" ? "justify-end" : "justify-start";

    return (
      <th
        scope="col"
        aria-sort={isActive ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
        className={`p-0 font-medium whitespace-nowrap ${alignClass}`}
      >
        <button
          type="button"
          onClick={() => toggleSort(k)}
          title={title}
          className={`focus-ring flex w-full items-center gap-1 px-3 py-2 ${justifyClass} ${alignClass} select-none transition-colors hover:bg-panel ${
            isActive
              ? "text-text border-b-2 border-accent"
              : "text-muted hover:text-text"
          } focus-visible:outline-none`}
        >
          <span>{label}</span>
          {sortIcon(k)}
        </button>
      </th>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-panel">
      {/* Caption bar: count + legend (#7 legend/key) */}
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 text-[13px] text-muted">
        <div className="flex items-center justify-between">
          <span>{sorted.length} firm{sorted.length === 1 ? "" : "s"} shown</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="text-positive" aria-hidden="true">●</span> high</span>
            <span className="flex items-center gap-1"><span className="text-warn" aria-hidden="true">●</span> medium</span>
            <span className="flex items-center gap-1"><span className="text-danger" aria-hidden="true">●</span> low</span>
          </span>
        </div>
        {/* Legend row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted leading-relaxed">
          <span className="font-medium text-text/60 uppercase tracking-wide">Key:</span>
          <span><span className="text-positive" aria-hidden="true">●</span> Conf: High (verified)</span>
          <span><span className="text-warn" aria-hidden="true">●</span> Medium (check first)</span>
          <span><span className="text-danger" aria-hidden="true">●</span> Low (verify thoroughly)</span>
          <span aria-hidden="true">·</span>
          <span>Bots/API: <span className="text-positive">green</span> = high fit · <span className="text-warn">amber</span> = medium/low · <span className="text-danger">red</span> = none</span>
          <span aria-hidden="true">·</span>
          <span><span className="font-medium">1st Payout</span> = min days before first withdrawal</span>
          <span><span className="font-medium">Payout Speed</span> = hours to process after request</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <caption className="sr-only">
            Comparison of prop trading firms. Sortable by column header; activate a
            row&apos;s expand button to reveal full notes and source links.
          </caption>
          {/* #1 sticky thead */}
          <thead className="sticky top-0 z-10 border-b-[1.5px] border-text bg-bg text-[11px] uppercase tracking-[0.06em] text-muted">
            <tr>
              {/* Pin col — not sticky, narrow */}
              <th scope="col" className="w-[44px] px-2 py-2 text-left font-medium whitespace-nowrap" title="Pin to shortlist"><span className="sr-only">Pin</span></th>
              {/* Firm name col — sticky left (#1) */}
              <th scope="col" className="sticky left-0 z-20 bg-bg px-3 py-2 text-left font-medium whitespace-nowrap border-r border-border">
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className={`focus-ring flex items-center gap-1 select-none transition-colors hover:bg-panel ${
                    sortKey === "name"
                      ? "text-text border-b-2 border-accent"
                      : "text-muted hover:text-text"
                  } focus-visible:outline-none`}
                >
                  <span>Firm</span>
                  {sortIcon("name")}
                </button>
              </th>
              <Th k="fundingModel" label="Model" />
              <th scope="col" className="px-3 py-2 text-left font-medium whitespace-nowrap">Programs</th>
              <th scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap">Sizes</th>
              <Th k="dailyDrawdownPct" label="Daily DD" align="right" />
              <Th k="maxDrawdownPct" label="Max DD" align="right" />
              <Th k="drawdownType" label="DD Type" />
              <Th k="profitTargetPct" label="Target" align="right" />
              <Th k="profitSplitPct" label="Split" align="right" />
              <Th k="maxFundedTotal" label="Max Funded" align="right" />
              <Th
                k="payoutDays"
                label="1st Payout"
                align="right"
                title="Minimum days on a funded account before your first withdrawal is allowed (payout cycle / add-ons can shorten it — see expanded row). NOT the processing time."
              />
              <Th
                k="payoutSpeedHours"
                label="Payout Speed"
                align="right"
                title="Typical processing time after requesting a withdrawal, in hours, sorted by max hours (0h = instant). NOT the eligibility wait."
              />
              <Th k="cryptoLeverage" label="Lev" align="right" />
              <Th
                k="feasibility"
                label="Bots / API"
                title="Can you connect a 3rd-party execution/copy bot to your OWN account — via real trade-scope API keys or an allowed EA? Cell colour = overall TradeSurge feasibility (green high · amber medium/low · red none). Sort puts the best fits first."
              />
              <th scope="col" className="px-3 py-2 text-left font-medium whitespace-nowrap">Crypto Assets</th>
              <th scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap">Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((f) => {
              const isOpen = expanded.has(f.id);
              const isPinned = pinned.has(f.id);

              // Compute leader class for this row's active-sort numeric cell (#3).
              const activeSortVal = sortNumericValue(f, sortKey);
              const activeLeaderCls = NUMERIC_BETTER[sortKey]
                ? leaderClass(activeSortVal, activeLeaderBest)
                : "";

              // Row bg: pinned > open > default. Pinned also gets accent left border (#4).
              const rowBg = isPinned
                ? "bg-accent-soft"
                : isOpen
                ? "bg-panel2"
                : "";
              const pinnedBorder = isPinned ? "border-l-[1.5px] border-accent" : "";

              // Sticky first-col bg follows row state.
              const stickyBg = isPinned ? "bg-accent-soft" : isOpen ? "bg-panel2" : "bg-bg";

              return (
                <Fragment key={f.id}>
                  <tr
                    onClick={() => toggleExpand(f.id)}
                    className={`h-[48px] cursor-pointer hover:bg-panel2 ${
                      f.status === "closed" ? "opacity-50" : ""
                    } ${rowBg} ${pinnedBorder}`}
                  >
                    <td className="px-2 py-1 whitespace-nowrap">
                      <PinButton
                        active={isPinned}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(f.id);
                        }}
                      />
                    </td>
                    {/* Sticky firm-name cell (#1) */}
                    <td className={`sticky left-0 z-10 px-3 py-2 whitespace-nowrap border-r border-border ${stickyBg}`}>
                      <span className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-label={isOpen ? `Collapse ${f.name} details` : `Expand ${f.name} details`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(f.id);
                          }}
                          className="focus-ring inline-flex h-4 w-4 items-center justify-center rounded text-muted hover:text-text focus-visible:outline-none"
                        >
                          {isOpen ? (
                            <ChevronUp aria-hidden="true" size={14} strokeWidth={1.5} />
                          ) : (
                            <ChevronDown aria-hidden="true" size={14} strokeWidth={1.5} />
                          )}
                        </button>
                        {confidenceDot(f.confidence)}
                        <a
                          href={f.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`inline-flex items-center gap-1 font-medium ${
                            f.status === "closed"
                              ? "text-muted line-through hover:text-muted"
                              : "text-text hover:text-accent"
                          }`}
                        >
                          {f.name}
                          <ExternalLink aria-hidden="true" size={14} strokeWidth={1.5} />
                        </a>
                        {f.status === "closed" && (
                          <span title="This firm has shut down — retained for reference only">
                            <Badge tone="negative">Closed</Badge>
                          </span>
                        )}
                      </span>
                    </td>
                    {/* Funding model badge — #5: instant → neutral, not accent */}
                    <td className="px-3 py-2">
                      <Badge tone={f.fundingModel === "instant" ? "neutral" : f.fundingModel === "both" ? "amber" : "neutral"}>
                        {f.fundingModel}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="truncate max-w-[170px] text-muted text-xs" title={f.programs.join(", ")}>{f.programs.join(", ")}</div>
                    </td>
                    <td className="px-3 py-2 tnum text-right font-mono text-xs text-muted whitespace-nowrap">{formatSizes(f.accountSizes)}</td>
                    {/* Numeric cells — apply activeLeaderCls only on the active sort column (#3) */}
                    <td className={`px-3 py-2 tnum text-right font-mono whitespace-nowrap ${sortKey === "dailyDrawdownPct" ? activeLeaderCls : ""}`}>{formatPct(f.dailyDrawdownPct)}</td>
                    <td className={`px-3 py-2 tnum text-right font-mono whitespace-nowrap ${sortKey === "maxDrawdownPct" ? activeLeaderCls : ""}`}>{formatPct(f.maxDrawdownPct)}</td>
                    <td className="px-3 py-2 text-muted">{f.drawdownType}</td>
                    <td className={`px-3 py-2 tnum text-right font-mono whitespace-nowrap ${sortKey === "profitTargetPct" ? activeLeaderCls : ""}`}>{formatPct(f.profitTargetPct)}</td>
                    <td className={`px-3 py-2 tnum text-right font-mono ${sortKey === "profitSplitPct" ? activeLeaderCls : ""}`}>{f.profitSplitPct}%</td>
                    <td className={`px-3 py-2 tnum text-right font-mono ${sortKey === "maxFundedTotal" ? activeLeaderCls : ""}`}>{f.maxFundedTotal == null ? "—" : formatMoney(f.maxFundedTotal)}</td>
                    <td className={`px-3 py-2 tnum text-right font-mono ${sortKey === "payoutDays" ? activeLeaderCls : ""}`}>{formatDays(f.payoutDays)}</td>
                    <td className={`px-3 py-2 tnum text-right font-mono text-xs whitespace-nowrap ${sortKey === "payoutSpeedHours" ? activeLeaderCls : ""}`}>{f.payoutSpeed ?? "—"}</td>
                    <td className={`px-3 py-2 tnum text-right font-mono ${sortKey === "cryptoLeverage" ? activeLeaderCls : ""}`}>{formatLeverage(f.cryptoLeverage)}</td>
                    <td className="px-3 py-2">{automationCell(f.automation)}</td>
                    <td className="px-3 py-2">
                      <div className="truncate max-w-[200px] text-muted text-xs" title={f.cryptoAssets}>{f.cryptoAssets}</div>
                    </td>
                    <td className="px-3 py-2 tnum text-right font-mono text-xs text-muted">{f.lastVerified}</td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-bg">
                      <td colSpan={17} className="px-4 pt-1 pb-4">
                        <div className="max-w-[1100px] space-y-2 text-xs leading-relaxed">
                          <p className="text-text/90">{f.notes}</p>
                          {f.automation && (
                            <div className="rounded border border-border bg-panel2 p-2 space-y-1">
                              <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted font-mono tnum">
                                <span><span className="text-muted/60">Platform:</span> {f.automation.platform}</span>
                                <span><span className="text-muted/60">EA / bots:</span> {f.automation.ea}</span>
                                <span><span className="text-muted/60">API keys:</span> {f.automation.apiKeys}</span>
                                <span><span className="text-muted/60">TradeSurge fit:</span> {f.automation.feasibility}</span>
                              </div>
                              <p className="text-text/80">{f.automation.note}</p>
                              <p className="text-muted">Copy / 3rd-party: {f.automation.copy}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted font-mono tnum">
                            <span><span className="text-muted/60">Trades:</span> {f.assetClasses.join(", ")}</span>
                            <span><span className="text-muted/60">Programs:</span> {f.programs.join(", ")}</span>
                            <span><span className="text-muted/60">Sizes:</span> {f.accountSizes.map(formatMoney).join(" · ")}</span>
                            <span><span className="text-muted/60">Crypto:</span> {f.cryptoAssets}</span>
                            <span><span className="text-muted/60">1st payout:</span> {f.payoutDays == null ? "—" : typeof f.payoutDays === "number" ? `${f.payoutDays}d min on funded acct` : f.payoutDays}</span>
                            <span><span className="text-muted/60">Payout speed:</span> {f.payoutSpeed ?? "—"} after request</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-muted">
                            <Link
                              href={`/firms/${f.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-accent hover:underline font-medium"
                            >
                              Full rules &amp; payout page
                            </Link>
                            <a
                              href={f.source}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-accent hover:underline"
                            >
                              <ExternalLink aria-hidden="true" size={14} strokeWidth={1.5} />
                              Source
                            </a>
                            <span>Verified {f.lastVerified}</span>
                            <span>Confidence: {f.confidence}</span>
                            <span>Status: {f.status}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {/* #6 zero-results empty state */}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={17} className="px-3 py-12 text-center">
                  <div className="flex flex-col items-center gap-0">
                    <SearchX aria-hidden="true" size={20} strokeWidth={1.5} className="text-muted" />
                    <h3 className="mt-3 text-sm font-medium text-text">No firms match</h3>
                    <p className="mt-1 text-xs text-muted">Try broadening your filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
