"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp, ExternalLink, Info, Pin, SearchX } from "lucide-react";
import type { AssetClass, Automation, DrawdownType, Firm } from "@/lib/firms";
import {
  automationLabel,
  bestValue,
  confidenceRank,
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
  | "confidence"
  | "feasibility";

type SortDir = "asc" | "desc";

interface Props {
  firms: Firm[];
  fundingModel: "all" | "challenge" | "instant" | "both";
  assetClass: "all" | AssetClass;
  minLeverage: number;
  drawdownType: "all" | DrawdownType;
  payoutSpeed: "any" | "24" | "48";
  minSplit: 0 | 80 | 90;
  minMaxDdBuffer: 0 | 6 | 8 | 10;
  automation: "any" | "high" | "ea" | "none";
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

// ---------------------------------------------------------------------------
// HeaderInfo — tappable ⓘ button + portal popover for column definitions.
// ---------------------------------------------------------------------------

interface PopoverPos { top: number; left: number }

interface HeaderInfoProps {
  definition: string;
  colId: string;
  openColId: string | null;
  setOpenColId: (id: string | null) => void;
  popoverPos: PopoverPos | null;
  setPopoverPos: (pos: PopoverPos | null) => void;
  isMounted: boolean;
}

function HeaderInfo({
  definition,
  colId,
  openColId,
  setOpenColId,
  popoverPos,
  setPopoverPos,
  isMounted,
}: HeaderInfoProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverId = `col-def-${colId}`;
  const isOpen = openColId === colId;

  const open = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const POPOVER_WIDTH = 260;
    const MARGIN = 8;
    let left = rect.left;
    if (left + POPOVER_WIDTH + MARGIN > window.innerWidth) {
      left = window.innerWidth - POPOVER_WIDTH - MARGIN;
    }
    setPopoverPos({ top: rect.bottom + 6, left });
    setOpenColId(colId);
  }, [colId, setOpenColId, setPopoverPos]);

  const close = useCallback(() => {
    setOpenColId(null);
    setPopoverPos(null);
    btnRef.current?.focus();
  }, [setOpenColId, setPopoverPos]);

  function handleToggle(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle(e);
    }
  }

  // Close this popover on Escape (when open).
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Outside-click handler lives on the popover portal element (see below).

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Column definition"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onPointerDown={(e) => e.stopPropagation()}
        className="focus-ring inline-flex items-center justify-center rounded text-muted hover:text-text focus-visible:outline-none"
        style={{ lineHeight: 0 }}
      >
        <Info aria-hidden="true" size={12} strokeWidth={1.5} />
      </button>

      {/* Portal popover — SSR-safe: only rendered after mount and when open */}
      {isMounted && isOpen && popoverPos &&
        createPortal(
          <div
            role="dialog"
            id={popoverId}
            aria-label="Column definition"
            style={{
              position: "fixed",
              top: popoverPos.top,
              left: popoverPos.left,
              zIndex: 200,
            }}
            className="max-w-[260px] rounded-lg border border-border bg-bg p-3 text-[13px] text-text shadow-lg"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {definition}
          </div>,
          document.body
        )
      }
    </>
  );
}

// Outside-click: close the popover when clicking anywhere outside it.
// Attached at the document level inside FirmTable when a popover is open.

export default function FirmTable({
  firms,
  fundingModel,
  assetClass,
  minLeverage,
  drawdownType,
  payoutSpeed,
  minSplit,
  minMaxDdBuffer,
  automation,
  pinnedOnly,
  search,
  pinned,
  togglePin,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("profitSplitPct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const confidenceHeaderRef = useRef<HTMLTableCellElement>(null);
  const [detailPanelMetrics, setDetailPanelMetrics] = useState({
    leftOffset: 0,
    containerWidth: 0,
  });

  // Popover state — keyed by column id so only one is open at a time.
  const [openColId, setOpenColId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPos | null>(null);
  // SSR-safety: only render portal after mount.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const updateDetailPanelMetrics = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    const confidenceHeader = confidenceHeaderRef.current;
    if (!scrollContainer || !confidenceHeader) return;

    const containerWidth = scrollContainer.clientWidth;
    const leftOffset = confidenceHeader.offsetLeft;

    setDetailPanelMetrics((prev) =>
      prev.leftOffset === leftOffset && prev.containerWidth === containerWidth
        ? prev
        : { leftOffset, containerWidth },
    );
  }, []);

  useEffect(() => {
    updateDetailPanelMetrics();

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const resizeObserver = new ResizeObserver(updateDetailPanelMetrics);
    resizeObserver.observe(scrollContainer);
    // Also observe the Confidence header: filtering/sorting changes the widest
    // firm name → the Firm column width → the Confidence column's offsetLeft,
    // without changing the scroll container's size. Observing the header cell
    // catches that so the pinned panel stays anchored after a filter change.
    if (confidenceHeaderRef.current) {
      resizeObserver.observe(confidenceHeaderRef.current);
    }
    window.addEventListener("resize", updateDetailPanelMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDetailPanelMetrics);
    };
  }, [updateDetailPanelMetrics]);

  // Outside-click: close when clicking outside the popover.
  useEffect(() => {
    if (!openColId) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      // Check if click is inside a portal popover div.
      const popover = document.getElementById(`col-def-${openColId}`);
      if (popover && popover.contains(target)) return;
      setOpenColId(null);
      setPopoverPos(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openColId]);

  // Close the popover on scroll/resize (its fixed coords would otherwise go stale
  // and detach from the trigger). Capture phase catches inner overflow scrolling.
  useEffect(() => {
    if (!openColId) return;
    function dismiss() {
      setOpenColId(null);
      setPopoverPos(null);
    }
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [openColId]);

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
      if (minSplit > 0 && f.profitSplitPct < minSplit) return false;
      if (minMaxDdBuffer > 0) {
        const maxDd = numOrNull(f.maxDrawdownPct);
        if (maxDd == null || maxDd < minMaxDdBuffer) return false;
      }
      if (automation === "high" && f.automation?.feasibility !== "high") return false;
      if (automation === "ea" && f.automation?.ea !== "allowed") return false;
      if (
        automation === "none" &&
        f.automation?.ea !== "banned" &&
        f.automation?.feasibility !== "none"
      ) {
        return false;
      }
      if (q && !f.name.toLowerCase().includes(q) && !f.cryptoAssets.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [
    firms,
    fundingModel,
    assetClass,
    minLeverage,
    drawdownType,
    payoutSpeed,
    minSplit,
    minMaxDdBuffer,
    automation,
    pinnedOnly,
    pinned,
    search,
  ]);

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
        case "confidence": {
          const ra = confidenceRank(a.confidence);
          const rb = confidenceRank(b.confidence);
          return sortDir === "asc" ? ra - rb : rb - ra;
        }
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
        k === "name" || k === "fundingModel" || k === "drawdownType" || k === "feasibility" || k === "confidence"
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

  // Shared props threaded into every HeaderInfo instance.
  const infoProps = {
    openColId,
    setOpenColId,
    popoverPos,
    setPopoverPos,
    isMounted,
  };

  const { leftOffset, containerWidth } = detailPanelMetrics;

  const Th = ({ k, label, align = "left", title, headerRef }: { k: SortKey; label: string; align?: "left" | "right"; title?: string; headerRef?: React.Ref<HTMLTableCellElement> }) => {
    const isActive = sortKey === k;
    const alignClass = align === "right" ? "text-right" : "text-left";
    const justifyClass = align === "right" ? "justify-end" : "justify-start";

    return (
      <th
        ref={headerRef}
        scope="col"
        aria-sort={isActive ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
        className={`p-0 font-medium whitespace-nowrap ${alignClass}`}
      >
        <div className={`flex items-center gap-1 px-3 py-2 ${justifyClass}`}>
          <button
            type="button"
            onClick={() => toggleSort(k)}
            title={title}
            className={`focus-ring flex items-center gap-1 ${alignClass} select-none transition-colors hover:bg-panel ${
              isActive
                ? "text-text border-b-2 border-accent"
                : "text-muted hover:text-text"
            } focus-visible:outline-none`}
          >
            <span>{label}</span>
            {sortIcon(k)}
          </button>
          {title && (
            <HeaderInfo
              definition={title}
              colId={k}
              {...infoProps}
            />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-panel">
      {/* Caption bar: count + compact legend (#7 legend/key) */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-border px-4 py-3 text-[13px] text-muted">
        <span>{sorted.length} firm{sorted.length === 1 ? "" : "s"} shown</span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="font-medium text-text/60 uppercase tracking-wide">Confidence:</span>
          <span className="flex items-center gap-1"><span className="text-positive" aria-hidden="true">●</span> High</span>
          <span className="flex items-center gap-1"><span className="text-warn" aria-hidden="true">●</span> Medium</span>
          <span className="flex items-center gap-1"><span className="text-danger" aria-hidden="true">●</span> Low</span>
          <span aria-hidden="true" className="text-border">·</span>
          <span className="font-medium text-text/60 uppercase tracking-wide">Bots/API:</span>
          <span className="flex items-center gap-1"><span className="text-positive" aria-hidden="true">●</span> high fit</span>
          <span className="flex items-center gap-1"><span className="text-warn" aria-hidden="true">●</span> medium/low</span>
          <span className="flex items-center gap-1"><span className="text-danger" aria-hidden="true">●</span> none</span>
        </span>
      </div>
      {/* NOTE: keep this scroll container padding-free. The expanded detail panel
          anchors via confidenceHeader.offsetLeft (table-relative) used as a sticky
          `left` (scroll-container-relative); the two origins only coincide while the
          table sits flush at x=0 here. If you add px-* to this div, subtract that
          padding from leftOffset in updateDetailPanelMetrics. */}
      <div ref={scrollContainerRef} className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <caption className="sr-only">
            Comparison of prop trading firms. Sortable by column header; activate a
            row&apos;s expand button to reveal full notes and source links.
          </caption>
          {/* #1 sticky thead */}
          <thead className="sticky top-0 z-10 border-b-[1.5px] border-text bg-bg text-[11px] uppercase tracking-[0.06em] text-muted">
            <tr>
              {/* Pin col — sticky, narrow */}
              <th scope="col" className="sticky left-0 z-20 w-[44px] bg-bg px-2 py-2 text-left font-medium whitespace-nowrap" title="Pin a firm to your shortlist to compare side by side.">
                <span className="sr-only">Pin</span>
              </th>
              {/* Firm name col — sticky left (#1) */}
              <th scope="col" className="sticky left-[44px] z-20 bg-bg px-3 py-2 text-left font-medium whitespace-nowrap border-r border-border">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    title="Prop firm name — click a row's name to open the firm's site."
                    className={`focus-ring flex items-center gap-1 select-none transition-colors hover:bg-panel ${
                      sortKey === "name"
                        ? "text-text border-b-2 border-accent"
                        : "text-muted hover:text-text"
                    } focus-visible:outline-none`}
                  >
                    <span>Firm</span>
                    {sortIcon("name")}
                  </button>
                  <HeaderInfo
                    definition="Prop firm name — click a row's name to open the firm's site."
                    colId="name"
                    {...infoProps}
                  />
                </div>
              </th>
              <Th k="confidence" label="Confidence" title="Data confidence — High (recently verified), Medium (check before buying), Low (verify thoroughly)." headerRef={confidenceHeaderRef} />
              <Th k="fundingModel" label="Model" title="Funding model — Challenge (pass an evaluation first), Instant (funded immediately), or Both." />
              <th scope="col" className="px-3 py-2 text-left font-medium whitespace-nowrap" title="Challenge program tiers offered by this firm (e.g. 1-step, 2-step, instant).">
                <div className="flex items-center gap-1">
                  <span>Programs</span>
                  <HeaderInfo
                    definition="Challenge program tiers offered by this firm (e.g. 1-step, 2-step, instant)."
                    colId="programs"
                    {...infoProps}
                  />
                </div>
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap" title="Account sizes available (in USD).">
                <div className="flex items-center justify-end gap-1">
                  <HeaderInfo
                    definition="Account sizes available (in USD)."
                    colId="sizes"
                    {...infoProps}
                  />
                  <span>Sizes</span>
                </div>
              </th>
              <Th k="dailyDrawdownPct" label="Daily DD" align="right" title="Daily drawdown limit — the most you can lose in a single day before breaching." />
              <Th k="maxDrawdownPct" label="Max DD" align="right" title="Maximum overall drawdown — total loss allowed before the account fails." />
              <Th k="drawdownType" label="DD Type" title="Drawdown type — Static (fixed floor), Trailing (follows your peak balance), or Mixed." />
              <Th k="profitTargetPct" label="Target" align="right" title="Profit target — % gain required to pass the evaluation." />
              <Th k="profitSplitPct" label="Split" align="right" title="Profit split — share of profits the trader keeps." />
              <Th k="maxFundedTotal" label="Max Funded" align="right" title="Maximum funded capital available after scaling." />
              <Th
                k="payoutDays"
                label="1st Payout"
                align="right"
                title="Minimum days before your first withdrawal."
              />
              <Th
                k="payoutSpeedHours"
                label="Payout Speed"
                align="right"
                title="Hours to process a payout after you request it."
              />
              <Th k="cryptoLeverage" label="Lev" align="right" title="Maximum crypto leverage offered." />
              <Th
                k="feasibility"
                label="Bots / API"
                title="Automation fit — can you connect a 3rd-party bot/EA or trade-scope API keys to your own account? Green = high fit, amber = medium/low, red = none."
              />
              <th scope="col" className="px-3 py-2 text-left font-medium whitespace-nowrap" title="Cryptocurrency pairs or assets available to trade on this firm.">
                <div className="flex items-center gap-1">
                  <span>Crypto Assets</span>
                  <HeaderInfo
                    definition="Cryptocurrency pairs or assets available to trade on this firm."
                    colId="cryptoAssets"
                    {...infoProps}
                  />
                </div>
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap" title="When this firm's terms were last verified.">
                <div className="flex items-center justify-end gap-1">
                  <HeaderInfo
                    definition="When this firm's terms were last verified."
                    colId="verified"
                    {...infoProps}
                  />
                  <span>Verified</span>
                </div>
              </th>
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
                    <td className={`sticky left-0 z-[11] w-[44px] px-0 py-1 whitespace-nowrap ${stickyBg}`}>
                      <PinButton
                        active={isPinned}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(f.id);
                        }}
                      />
                    </td>
                    {/* Sticky firm-name cell (#1) — z below the header's z-20 sticky cells */}
                    <td className={`sticky left-[44px] z-[11] px-3 py-2 whitespace-nowrap border-r border-border ${stickyBg}`}>
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
                    <td className="px-3 py-2">{confidenceDot(f.confidence)}</td>
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
                    <td className="px-3 py-2 tnum text-right font-mono text-xs text-muted whitespace-nowrap">{f.lastVerified}</td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-bg">
                      <td colSpan={18} className="p-0">
                        {/* One sticky container fills the visible viewport and stays
                            fixed on horizontal scroll: the left rail sits under the
                            frozen Pin+Firm region, the description aligns to the
                            Confidence column. */}
                        <div
                          style={{
                            position: "sticky",
                            left: 0,
                            width: containerWidth || undefined,
                            zIndex: 1,
                          }}
                        >
                          <div className="flex gap-4 py-3 text-xs leading-relaxed">
                            {/* Left rail — actions as buttons + read-only meta badges */}
                            <aside
                              className="shrink-0 space-y-2 border-r border-border pl-3 pr-3"
                              style={{ width: leftOffset || undefined }}
                            >
                              <Link
                                href={`/firms/${f.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="focus-ring inline-flex w-full items-center justify-center gap-1 rounded-md bg-accent px-2.5 py-1.5 font-medium text-white transition-colors hover:bg-accent-hover"
                              >
                                Full rules
                                <ArrowRight aria-hidden="true" size={13} strokeWidth={2} />
                              </Link>
                              {f.source && (
                                <a
                                  href={f.source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="focus-ring inline-flex w-full items-center justify-center gap-1 rounded-md border border-border bg-bg px-2.5 py-1.5 font-medium text-text transition-colors hover:bg-panel"
                                >
                                  <ExternalLink aria-hidden="true" size={13} strokeWidth={1.5} />
                                  Source
                                </a>
                              )}
                              <dl className="space-y-1 pt-0.5 text-muted">
                                <div>
                                  <dt className="inline mr-1 text-muted/60">Verified</dt>
                                  <dd className="inline tnum">{f.lastVerified}</dd>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <dt className="text-muted/60">Confidence</dt>
                                  <dd>
                                    <Badge tone={f.confidence === "high" ? "positive" : f.confidence === "medium" ? "amber" : "negative"}>
                                      {f.confidence}
                                    </Badge>
                                  </dd>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <dt className="text-muted/60">Status</dt>
                                  <dd>
                                    <Badge tone={f.status === "active" ? "neutral" : "negative"}>
                                      {f.status}
                                    </Badge>
                                  </dd>
                                </div>
                              </dl>
                            </aside>

                            {/* Description — pr-4 keeps text off the right edge (overhang fix) */}
                            <div className="min-w-0 max-w-[1100px] flex-1 space-y-2 break-words pr-4">
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
                            </div>
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
                <td colSpan={18} className="px-3 py-12 text-center">
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
