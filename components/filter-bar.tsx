"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pin, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import type { AssetClass, DrawdownType, Firm } from "@/lib/firms";
import { SegButton } from "./ui/primitives";

type FundingFilter = "all" | "challenge" | "instant" | "both";
type AssetFilter = "all" | AssetClass;
type PayoutSpeedFilter = "any" | "24" | "48";
type MinSplitFilter = 0 | 80 | 90;
type MinMaxDdBufferFilter = 0 | 6 | 8 | 10;
type AutomationFilter = "any" | "high" | "ea" | "none";

interface Props {
  firms: Firm[];
  matchCount: number;
  fundingModel: FundingFilter;
  setFundingModel: (v: FundingFilter) => void;
  assetClass: AssetFilter;
  setAssetClass: (v: AssetFilter) => void;
  minLeverage: number;
  setMinLeverage: (n: number) => void;
  drawdownType: "all" | DrawdownType;
  setDrawdownType: (v: "all" | DrawdownType) => void;
  payoutSpeed: PayoutSpeedFilter;
  setPayoutSpeed: (v: PayoutSpeedFilter) => void;
  minSplit: MinSplitFilter;
  setMinSplit: (v: MinSplitFilter) => void;
  minMaxDdBuffer: MinMaxDdBufferFilter;
  setMinMaxDdBuffer: (v: MinMaxDdBufferFilter) => void;
  automation: AutomationFilter;
  setAutomation: (v: AutomationFilter) => void;
  pinnedOnly: boolean;
  setPinnedOnly: (v: boolean) => void;
  pinnedCount: number;
  search: string;
  setSearch: (s: string) => void;
}

type Option<T extends string | number> = {
  value: T;
  label: string;
  count?: number;
};

type ActiveChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

const modelLabels: Record<FundingFilter, string> = {
  all: "All",
  challenge: "Challenge",
  instant: "Instant",
  both: "Both",
};

const assetLabels: Record<AssetFilter, string> = {
  all: "All",
  crypto: "Crypto",
  forex: "Forex",
  futures: "Futures",
};

const drawdownLabels: Record<"all" | DrawdownType, string> = {
  all: "All",
  static: "Static",
  trailing: "Trailing",
  mixed: "Mixed",
};

const payoutSpeedLabels: Record<PayoutSpeedFilter, string> = {
  any: "Any",
  "24": "≤ 24h",
  "48": "≤ 48h",
};

const automationLabels: Record<AutomationFilter, string> = {
  any: "Any",
  high: "High fit",
  ea: "EA allowed",
  none: "No bots",
};

const modelOptions: Array<Option<FundingFilter>> = [
  { value: "all", label: modelLabels.all },
  { value: "challenge", label: modelLabels.challenge },
  { value: "instant", label: modelLabels.instant },
  { value: "both", label: modelLabels.both },
];

const assetOptions: Array<Option<AssetFilter>> = [
  { value: "all", label: assetLabels.all },
  { value: "crypto", label: assetLabels.crypto },
  { value: "forex", label: assetLabels.forex },
  { value: "futures", label: assetLabels.futures },
];

const leverageOptions: Array<Option<number>> = [
  { value: 0, label: "Any" },
  { value: 2, label: "≥ 1:2" },
  { value: 5, label: "≥ 1:5" },
  { value: 10, label: "≥ 1:10" },
];

const drawdownOptions: Array<Option<"all" | DrawdownType>> = [
  { value: "all", label: drawdownLabels.all },
  { value: "static", label: drawdownLabels.static },
  { value: "trailing", label: drawdownLabels.trailing },
  { value: "mixed", label: drawdownLabels.mixed },
];

const payoutSpeedOptions: Array<Option<PayoutSpeedFilter>> = [
  { value: "any", label: payoutSpeedLabels.any },
  { value: "24", label: payoutSpeedLabels["24"] },
  { value: "48", label: payoutSpeedLabels["48"] },
];

const profitSplitOptions: Array<Option<MinSplitFilter>> = [
  { value: 0, label: "Any" },
  { value: 80, label: "80%" },
  { value: 90, label: "90%" },
];

const maxDdBufferOptions: Array<Option<MinMaxDdBufferFilter>> = [
  { value: 0, label: "Any" },
  { value: 6, label: "6%" },
  { value: 8, label: "8%" },
  { value: 10, label: "10%" },
];

const automationOptions: Array<Option<AutomationFilter>> = [
  { value: "any", label: automationLabels.any },
  { value: "high", label: automationLabels.high },
  { value: "ea", label: automationLabels.ea },
  { value: "none", label: automationLabels.none },
];

const gridClasses: Record<1 | 2 | 3, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

function Segmented<T extends string | number>({
  ariaLabel,
  options,
  value,
  onChange,
  columns = 2,
}: {
  ariaLabel: string;
  options: Array<Option<T>>;
  value: T;
  onChange: (v: T) => void;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`grid ${gridClasses[columns]} gap-1 rounded-md border border-border bg-panel p-1`}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        const hasCount = opt.count != null;
        return (
          <SegButton
            key={String(opt.value)}
            type="button"
            active={active}
            onClick={() => onChange(opt.value)}
            className={
              hasCount
                ? "flex min-h-9 min-w-0 items-center justify-between gap-1 px-2"
                : "flex min-h-9 min-w-0 items-center justify-center px-2"
            }
          >
            <span className="truncate">{opt.label}</span>
            {hasCount && (
              <span
                className={`tnum rounded-sm bg-bg px-1.5 py-0.5 font-mono text-[11px] ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                {opt.count}
              </span>
            )}
          </SegButton>
        );
      })}
    </div>
  );
}

function FilterGroup({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] uppercase tracking-[0.06em] text-muted">{label}</label>
      {children}
      {hint && <p className="text-xs leading-snug text-muted">{hint}</p>}
    </div>
  );
}

export default function FilterBar({
  firms,
  matchCount,
  fundingModel,
  setFundingModel,
  assetClass,
  setAssetClass,
  minLeverage,
  setMinLeverage,
  drawdownType,
  setDrawdownType,
  payoutSpeed,
  setPayoutSpeed,
  minSplit,
  setMinSplit,
  minMaxDdBuffer,
  setMinMaxDdBuffer,
  automation,
  setAutomation,
  pinnedOnly,
  setPinnedOnly,
  pinnedCount,
  search,
  setSearch,
}: Props) {
  const [mobileMounted, setMobileMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const assetCounts = useMemo(() => {
    const counts: Record<AssetFilter, number> = {
      all: firms.length,
      crypto: 0,
      forex: 0,
      futures: 0,
    };

    for (const firm of firms) {
      for (const asset of firm.assetClasses) {
        counts[asset] += 1;
      }
    }

    return counts;
  }, [firms]);

  const assetOptionsWithCounts = useMemo(
    () => assetOptions.map((opt) => ({ ...opt, count: assetCounts[opt.value] })),
    [assetCounts],
  );

  const resetAll = useCallback(() => {
    setFundingModel("all");
    setAssetClass("all");
    setMinLeverage(0);
    setDrawdownType("all");
    setPayoutSpeed("any");
    setMinSplit(0);
    setMinMaxDdBuffer(0);
    setAutomation("any");
    setPinnedOnly(false);
    setSearch("");
  }, [
    setFundingModel,
    setAssetClass,
    setMinLeverage,
    setDrawdownType,
    setPayoutSpeed,
    setMinSplit,
    setMinMaxDdBuffer,
    setAutomation,
    setPinnedOnly,
    setSearch,
  ]);

  const activeChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];
    const trimmedSearch = search.trim();

    if (assetClass !== "all") {
      chips.push({
        key: "asset",
        label: `Asset: ${assetLabels[assetClass]}`,
        onRemove: () => setAssetClass("all"),
      });
    }
    if (fundingModel !== "all") {
      chips.push({
        key: "model",
        label: `Model: ${modelLabels[fundingModel]}`,
        onRemove: () => setFundingModel("all"),
      });
    }
    if (minLeverage > 0) {
      chips.push({
        key: "leverage",
        label: `Leverage ≥ 1:${minLeverage}`,
        onRemove: () => setMinLeverage(0),
      });
    }
    if (drawdownType !== "all") {
      chips.push({
        key: "drawdown",
        label: `DD: ${drawdownLabels[drawdownType]}`,
        onRemove: () => setDrawdownType("all"),
      });
    }
    if (payoutSpeed !== "any") {
      chips.push({
        key: "payout",
        label: `Payout ${payoutSpeedLabels[payoutSpeed]}`,
        onRemove: () => setPayoutSpeed("any"),
      });
    }
    if (minSplit > 0) {
      chips.push({
        key: "split",
        label: `Split ≥ ${minSplit}%`,
        onRemove: () => setMinSplit(0),
      });
    }
    if (minMaxDdBuffer > 0) {
      chips.push({
        key: "buffer",
        label: `Max DD ≥ ${minMaxDdBuffer}%`,
        onRemove: () => setMinMaxDdBuffer(0),
      });
    }
    if (automation !== "any") {
      chips.push({
        key: "automation",
        label: `Bots: ${automationLabels[automation]}`,
        onRemove: () => setAutomation("any"),
      });
    }
    if (pinnedOnly) {
      chips.push({
        key: "pinned",
        label: "Pinned",
        onRemove: () => setPinnedOnly(false),
      });
    }
    if (trimmedSearch) {
      chips.push({
        key: "search",
        label: `Search: ${trimmedSearch}`,
        onRemove: () => setSearch(""),
      });
    }

    return chips;
  }, [
    assetClass,
    fundingModel,
    minLeverage,
    drawdownType,
    payoutSpeed,
    minSplit,
    minMaxDdBuffer,
    automation,
    pinnedOnly,
    search,
    setAssetClass,
    setFundingModel,
    setMinLeverage,
    setDrawdownType,
    setPayoutSpeed,
    setMinSplit,
    setMinMaxDdBuffer,
    setAutomation,
    setPinnedOnly,
    setSearch,
  ]);

  const activeFilterCount = activeChips.length;

  const openMobile = useCallback(() => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setMobileMounted(true);
    window.requestAnimationFrame(() => {
      setMobileOpen(true);
      mobileCloseRef.current?.focus();
    });
  }, []);

  const closeMobile = useCallback(() => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
    }
    setMobileOpen(false);
    closeTimerRef.current = window.setTimeout(() => {
      setMobileMounted(false);
      closeTimerRef.current = null;
      mobileTriggerRef.current?.focus();
    }, 180);
  }, []);

  useEffect(() => {
    if (!mobileMounted) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMobile();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileMounted, closeMobile]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const renderSidebarContent = (titleId: string, searchId: string, onClose?: () => void) => (
    <div className="flex min-h-full flex-col gap-5">
      <div className="border-b-[1.5px] border-text pb-4">
        <div className="flex items-start justify-between gap-3">
          <p id={titleId} className="text-[13px] uppercase tracking-[0.06em] text-muted">
            Filters
          </p>
          {onClose && (
            <button
              ref={mobileCloseRef}
              type="button"
              aria-label="Close filters"
              onClick={onClose}
              className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:text-text"
            >
              <X aria-hidden="true" size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="tnum font-mono text-3xl leading-none text-text">{matchCount}</p>
            <p className="mt-1 text-[13px] text-muted">firm{matchCount === 1 ? "" : "s"}</p>
          </div>
          <p className="tnum font-mono text-xs text-muted">{firms.length} total</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b border-border pb-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] uppercase tracking-[0.06em] text-muted">Active</p>
          <button
            type="button"
            onClick={resetAll}
            disabled={activeFilterCount === 0}
            className={`focus-ring inline-flex items-center gap-1 rounded px-2 py-1 text-[13px] transition-colors ${
              activeFilterCount === 0
                ? "cursor-not-allowed text-muted/50"
                : "text-muted hover:text-text"
            }`}
          >
            <RotateCcw aria-hidden="true" size={14} strokeWidth={1.5} />
            Reset all
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {activeChips.length === 0 ? (
            <span className="text-[13px] text-muted">No active filters</span>
          ) : (
            activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onRemove}
                className="focus-ring inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-bg px-2 py-1 text-[12px] text-text transition-colors hover:bg-panel"
              >
                <span className="truncate">{chip.label}</span>
                <X aria-hidden="true" size={12} strokeWidth={1.5} className="shrink-0 text-muted" />
              </button>
            ))
          )}
        </div>
      </div>

      <FilterGroup label="Search">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            size={16}
            strokeWidth={1.5}
          />
          <input
            id={searchId}
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Firm or asset (e.g. SOL)"
            className="focus-ring h-10 w-full rounded-md border border-border bg-bg py-2 pl-9 pr-3 text-[13px] text-text placeholder:text-muted"
          />
        </div>
      </FilterGroup>

      <FilterGroup label="Shortlist">
        <button
          type="button"
          onClick={() => setPinnedOnly(!pinnedOnly)}
          aria-pressed={pinnedOnly}
          className={`focus-ring flex min-h-10 items-center justify-between gap-3 rounded-md border px-3 py-2 text-[13px] transition-colors ${
            pinnedOnly
              ? "border-accent/40 bg-accent-soft text-accent"
              : "border-border bg-panel text-muted hover:text-text"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Pin aria-hidden="true" size={16} strokeWidth={1.5} />
            Pinned
          </span>
          <span className="tnum font-mono text-xs">{pinnedCount}</span>
        </button>
      </FilterGroup>

      <div className="flex flex-col gap-4">
        <FilterGroup label="Asset class">
          <Segmented
            ariaLabel="Asset class"
            options={assetOptionsWithCounts}
            value={assetClass}
            onChange={setAssetClass}
          />
        </FilterGroup>

        <FilterGroup label="Funding model">
          <Segmented
            ariaLabel="Funding model"
            options={modelOptions}
            value={fundingModel}
            onChange={setFundingModel}
          />
        </FilterGroup>

        <FilterGroup label="Min leverage">
          <Segmented
            ariaLabel="Min leverage"
            options={leverageOptions}
            value={minLeverage}
            onChange={setMinLeverage}
          />
        </FilterGroup>

        <FilterGroup label="Drawdown type">
          <Segmented
            ariaLabel="Drawdown type"
            options={drawdownOptions}
            value={drawdownType}
            onChange={setDrawdownType}
          />
        </FilterGroup>

        <FilterGroup label="Payout speed">
          <Segmented
            ariaLabel="Payout speed"
            options={payoutSpeedOptions}
            value={payoutSpeed}
            onChange={setPayoutSpeed}
            columns={3}
          />
        </FilterGroup>

        <FilterGroup label="Profit split ≥">
          <Segmented
            ariaLabel="Profit split minimum"
            options={profitSplitOptions}
            value={minSplit}
            onChange={setMinSplit}
            columns={3}
          />
        </FilterGroup>

        <FilterGroup
          label="Max-DD buffer ≥"
          hint="Firms with $-based drawdown are hidden when this is set."
        >
          <Segmented
            ariaLabel="Maximum drawdown buffer minimum"
            options={maxDdBufferOptions}
            value={minMaxDdBuffer}
            onChange={setMinMaxDdBuffer}
          />
        </FilterGroup>

        <FilterGroup label="Bots / API">
          <Segmented
            ariaLabel="Bots and API fit"
            options={automationOptions}
            value={automation}
            onChange={setAutomation}
            columns={1}
          />
        </FilterGroup>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden">
        <button
          ref={mobileTriggerRef}
          type="button"
          onClick={openMobile}
          className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-panel px-3 py-2 text-[13px] font-medium text-text transition-colors hover:bg-panel2"
        >
          <SlidersHorizontal aria-hidden="true" size={16} strokeWidth={1.5} />
          Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
        </button>
      </div>

      <aside
        aria-labelledby="desktop-filter-title"
        className="hidden lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:w-72 lg:overflow-y-auto lg:rounded-md lg:border lg:border-border lg:bg-panel2 lg:p-4"
      >
        {renderSidebarContent("desktop-filter-title", "desktop-filter-search")}
      </aside>

      {mobileMounted && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={closeMobile}
            className={`absolute inset-0 bg-text/55 transition-opacity duration-150 ${
              mobileOpen ? "opacity-100" : "opacity-0"
            }`}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filter-title"
            className={`relative h-full w-[min(88vw,320px)] overflow-y-auto border-r border-border bg-bg p-4 shadow-2xl transition-transform duration-200 ease-out ${
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {renderSidebarContent("mobile-filter-title", "mobile-filter-search", closeMobile)}
          </aside>
        </div>
      )}
    </>
  );
}
