"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import type { AssetClass, DrawdownType, Firm } from "@/lib/firms";
import {
  formatDays,
  formatLeverage,
  formatMoney,
  formatPct,
  formatSizes,
  numOrNull,
} from "@/lib/firms";

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
  | "cryptoLeverage";

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

function confidenceDot(c: Firm["confidence"]) {
  const color =
    c === "high" ? "bg-accent" : c === "medium" ? "bg-warn" : "bg-danger";
  const label =
    c === "high"
      ? "High confidence (verified recently)"
      : c === "medium"
      ? "Medium confidence (verify before purchase)"
      : "Low confidence (verify thoroughly)";
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${color}`}
      title={label}
      aria-label={label}
    />
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
      className={`text-sm leading-none select-none transition-colors ${
        active ? "text-accent" : "text-muted hover:text-text"
      }`}
    >
      {active ? "★" : "☆"}
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
        const lev = numOrNull(f.cryptoLeverage);
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
          return nullLast(numOrNull(a.cryptoLeverage), numOrNull(b.cryptoLeverage), sortDir);
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir, pinned]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(k === "name" || k === "fundingModel" || k === "drawdownType" ? "asc" : "desc");
    }
  }

  const arrow = (k: SortKey) =>
    sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : "";

  const Th = ({ k, label, align = "left", title }: { k: SortKey; label: string; align?: "left" | "right"; title?: string }) => (
    <th
      scope="col"
      aria-sort={sortKey === k ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      className={`p-0 font-medium whitespace-nowrap text-${align}`}
    >
      <button
        type="button"
        onClick={() => toggleSort(k)}
        title={title}
        className={`w-full px-3 py-2 select-none hover:text-text text-${align} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent`}
      >
        <span className="text-muted">{label}</span>{" "}
        <span className="text-accent">{arrow(k)}</span>
      </button>
    </th>
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-panel">
      <div className="px-4 py-2 border-b border-border text-xs text-muted flex justify-between items-center">
        <span>{sorted.length} firm{sorted.length === 1 ? "" : "s"} shown</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block" /> high</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warn inline-block" /> medium</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger inline-block" /> low</span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Comparison of prop trading firms. Sortable by column header; activate a
            row&apos;s expand button to reveal full notes and source links.
          </caption>
          <thead className="bg-bg/40 border-b border-border text-xs uppercase tracking-wide">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-medium text-muted whitespace-nowrap w-8" title="Pin to shortlist"><span className="sr-only">Pin</span><span aria-hidden="true">★</span></th>
              <Th k="name" label="Firm" />
              <Th k="fundingModel" label="Model" />
              <th scope="col" className="px-3 py-2 text-left font-medium text-muted whitespace-nowrap">Programs</th>
              <th scope="col" className="px-3 py-2 text-left font-medium text-muted whitespace-nowrap">Sizes</th>
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
              <th scope="col" className="px-3 py-2 text-left font-medium text-muted whitespace-nowrap">Crypto Assets</th>
              <th scope="col" className="px-3 py-2 text-left font-medium text-muted whitespace-nowrap">Verified</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f) => {
              const isOpen = expanded.has(f.id);
              const isPinned = pinned.has(f.id);
              return (
                <Fragment key={f.id}>
                  <tr
                    onClick={() => toggleExpand(f.id)}
                    className={`h-[46px] border-b border-border last:border-0 hover:bg-bg/30 cursor-pointer ${
                      f.status === "closed" ? "opacity-50" : ""
                    } ${isOpen ? "bg-bg/20" : ""} ${
                      isPinned ? "border-l-2 border-l-accent bg-accent/[0.04]" : "border-l-2 border-l-transparent"
                    }`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <PinButton
                        active={isPinned}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(f.id);
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-label={isOpen ? `Collapse ${f.name} details` : `Expand ${f.name} details`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(f.id);
                          }}
                          className="text-muted text-[10px] w-4 h-4 inline-flex items-center justify-center select-none hover:text-text rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                        >
                          {isOpen ? "▾" : "▸"}
                        </button>
                        {confidenceDot(f.confidence)}
                        <a
                          href={f.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`font-medium ${
                            f.status === "closed"
                              ? "text-muted line-through hover:text-muted"
                              : "text-text hover:text-accent"
                          }`}
                        >
                          {f.name}
                        </a>
                        {f.status === "closed" && (
                          <span
                            className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-danger/50 text-danger font-semibold"
                            title="This firm has shut down — retained for reference only"
                          >
                            Closed
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        f.fundingModel === "instant"
                          ? "border-accent/40 text-accent"
                          : f.fundingModel === "both"
                          ? "border-warn/40 text-warn"
                          : "border-muted/40 text-muted"
                      }`}>
                        {f.fundingModel}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="truncate max-w-[170px] text-muted text-xs" title={f.programs.join(", ")}>{f.programs.join(", ")}</div>
                    </td>
                    <td className="px-3 py-2 text-muted whitespace-nowrap font-mono text-xs">{formatSizes(f.accountSizes)}</td>
                    <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{formatPct(f.dailyDrawdownPct)}</td>
                    <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{formatPct(f.maxDrawdownPct)}</td>
                    <td className="px-3 py-2 text-muted">{f.drawdownType}</td>
                    <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{formatPct(f.profitTargetPct)}</td>
                    <td className="px-3 py-2 text-right font-mono">{f.profitSplitPct}%</td>
                    <td className="px-3 py-2 text-right font-mono">{f.maxFundedTotal == null ? "—" : formatMoney(f.maxFundedTotal)}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatDays(f.payoutDays)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs whitespace-nowrap">{f.payoutSpeed ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatLeverage(f.cryptoLeverage)}</td>
                    <td className="px-3 py-2">
                      <div className="truncate max-w-[200px] text-muted text-xs" title={f.cryptoAssets}>{f.cryptoAssets}</div>
                    </td>
                    <td className="px-3 py-2 text-muted text-xs font-mono">{f.lastVerified}</td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-border bg-bg/20">
                      <td colSpan={16} className="px-4 pt-1 pb-4">
                        <div className="max-w-[1100px] space-y-2 text-xs leading-relaxed">
                          <p className="text-text/90">{f.notes}</p>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted font-mono">
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
                              Full rules &amp; payout page →
                            </Link>
                            <a
                              href={f.source}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-accent hover:underline"
                            >
                              ↗ Source
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
            {sorted.length === 0 && (
              <tr>
                <td colSpan={16} className="px-3 py-8 text-center text-muted">
                  No firms match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
