"use client";

import { Search } from "lucide-react";
import type { AssetClass, DrawdownType } from "@/lib/firms";
import { SegButton } from "./ui/primitives";

interface Props {
  fundingModel: "all" | "challenge" | "instant" | "both";
  setFundingModel: (v: "all" | "challenge" | "instant" | "both") => void;
  assetClass: "all" | AssetClass;
  setAssetClass: (v: "all" | AssetClass) => void;
  minLeverage: number;
  setMinLeverage: (n: number) => void;
  drawdownType: "all" | DrawdownType;
  setDrawdownType: (v: "all" | DrawdownType) => void;
  payoutSpeed: "any" | "24" | "48";
  setPayoutSpeed: (v: "any" | "24" | "48") => void;
  pinnedOnly: boolean;
  setPinnedOnly: (v: boolean) => void;
  pinnedCount: number;
  search: string;
  setSearch: (s: string) => void;
}

const modelOptions: Array<{ value: Props["fundingModel"]; label: string }> = [
  { value: "all", label: "All" },
  { value: "challenge", label: "Challenge" },
  { value: "instant", label: "Instant" },
  { value: "both", label: "Both" },
];

const assetOptions: Array<{ value: Props["assetClass"]; label: string }> = [
  { value: "all", label: "All" },
  { value: "crypto", label: "Crypto" },
  { value: "forex", label: "Forex" },
  { value: "futures", label: "Futures" },
];

const leverageOptions = [
  { value: 0, label: "Any" },
  { value: 2, label: "≥ 1:2" },
  { value: 5, label: "≥ 1:5" },
  { value: 10, label: "≥ 1:10" },
];

const drawdownOptions: Array<{ value: Props["drawdownType"]; label: string }> = [
  { value: "all", label: "All" },
  { value: "static", label: "Static" },
  { value: "trailing", label: "Trailing" },
  { value: "mixed", label: "Mixed" },
];

const payoutSpeedOptions: Array<{ value: Props["payoutSpeed"]; label: string }> = [
  { value: "any", label: "Any" },
  { value: "24", label: "≤ 24h" },
  { value: "48", label: "≤ 48h" },
];

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex w-full gap-1 sm:w-auto">
      {options.map((opt) => (
        <SegButton
          key={String(opt.value)}
          active={value === opt.value}
          onClick={() => onChange(opt.value)}
          className="flex-1 sm:flex-none"
        >
          {opt.label}
        </SegButton>
      ))}
    </div>
  );
}

export default function FilterBar({
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
  pinnedOnly,
  setPinnedOnly,
  pinnedCount,
  search,
  setSearch,
}: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="flex w-full flex-col gap-1 sm:w-auto">
        <label className="text-[13px] uppercase tracking-[0.06em] text-muted">Asset class</label>
        <Segmented options={assetOptions} value={assetClass} onChange={setAssetClass} />
      </div>

      <div className="flex w-full flex-col gap-1 sm:w-auto">
        <label className="text-[13px] uppercase tracking-[0.06em] text-muted">Funding model</label>
        <Segmented options={modelOptions} value={fundingModel} onChange={setFundingModel} />
      </div>

      <div className="flex w-full flex-col gap-1 sm:w-auto">
        <label className="text-[13px] uppercase tracking-[0.06em] text-muted">Min leverage</label>
        <Segmented options={leverageOptions} value={minLeverage} onChange={setMinLeverage} />
      </div>

      <div className="flex w-full flex-col gap-1 sm:w-auto">
        <label className="text-[13px] uppercase tracking-[0.06em] text-muted">Drawdown type</label>
        <Segmented options={drawdownOptions} value={drawdownType} onChange={setDrawdownType} />
      </div>

      <div className="flex w-full flex-col gap-1 sm:w-auto">
        <label className="text-[13px] uppercase tracking-[0.06em] text-muted">Payout speed</label>
        <Segmented options={payoutSpeedOptions} value={payoutSpeed} onChange={setPayoutSpeed} />
      </div>

      <div className="flex w-full flex-col gap-1 sm:w-auto">
        <label className="text-[13px] uppercase tracking-[0.06em] text-muted">Shortlist</label>
        <div className="flex">
          {/* CHANGE 2: prominent active state driven by pinnedOnly (filter ON), not pinnedCount.
              Secondary cue (count) always visible; button fill/text only flips on pinnedOnly. */}
          <button
            onClick={() => setPinnedOnly(!pinnedOnly)}
            aria-pressed={pinnedOnly}
            className={`focus-ring rounded-md border px-3 py-1.5 text-[13px] transition-colors ${
              pinnedOnly
                ? "border-accent bg-accent-soft text-accent hover:border-accent-hover"
                : pinnedCount > 0
                ? "border-border bg-bg text-text hover:text-text"
                : "border-border bg-bg text-muted hover:text-text"
            }`}
          >
            Pinned
            {pinnedCount > 0 && (
              <span
                className={`ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[11px] font-medium tabular-nums ${
                  pinnedOnly
                    ? "bg-accent text-bg"
                    : "bg-panel text-muted"
                }`}
              >
                {pinnedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <label htmlFor="search" className="text-[13px] uppercase tracking-[0.06em] text-muted">Search</label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            size={14}
            strokeWidth={1.5}
          />
          {/* CHANGE 3: added focus-ring className to search input */}
          <input
            id="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Firm name or asset (e.g. SOL)"
            className="focus-ring w-full rounded-md border border-border bg-bg py-1.5 pl-8 pr-3 text-[13px] text-text placeholder:text-muted"
          />
        </div>
      </div>
    </div>
  );
}
