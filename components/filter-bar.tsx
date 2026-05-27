"use client";

import type { AssetClass, DrawdownType } from "@/lib/firms";

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
    <div className="flex w-full sm:w-auto border border-border rounded-md bg-panel overflow-hidden">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={`flex-1 sm:flex-none px-3 py-1.5 text-sm transition-colors ${
            value === opt.value
              ? "bg-accent/20 text-accent"
              : "text-muted hover:text-text"
          }`}
        >
          {opt.label}
        </button>
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
    <div className="flex flex-wrap gap-3 items-end mb-4">
      <div className="flex flex-col gap-1 w-full sm:w-auto">
        <label className="text-xs text-muted uppercase tracking-wide">Asset class</label>
        <Segmented options={assetOptions} value={assetClass} onChange={setAssetClass} />
      </div>

      <div className="flex flex-col gap-1 w-full sm:w-auto">
        <label className="text-xs text-muted uppercase tracking-wide">Funding model</label>
        <Segmented options={modelOptions} value={fundingModel} onChange={setFundingModel} />
      </div>

      <div className="flex flex-col gap-1 w-full sm:w-auto">
        <label className="text-xs text-muted uppercase tracking-wide">Min leverage</label>
        <Segmented options={leverageOptions} value={minLeverage} onChange={setMinLeverage} />
      </div>

      <div className="flex flex-col gap-1 w-full sm:w-auto">
        <label className="text-xs text-muted uppercase tracking-wide">Drawdown type</label>
        <Segmented options={drawdownOptions} value={drawdownType} onChange={setDrawdownType} />
      </div>

      <div className="flex flex-col gap-1 w-full sm:w-auto">
        <label className="text-xs text-muted uppercase tracking-wide">Payout speed</label>
        <Segmented options={payoutSpeedOptions} value={payoutSpeed} onChange={setPayoutSpeed} />
      </div>

      <div className="flex flex-col gap-1 w-full sm:w-auto">
        <label className="text-xs text-muted uppercase tracking-wide">Shortlist</label>
        <div className="flex border border-border rounded-md bg-panel overflow-hidden">
          <button
            onClick={() => setPinnedOnly(!pinnedOnly)}
            aria-pressed={pinnedOnly}
            className={`px-3 py-1.5 text-sm transition-colors ${
              pinnedOnly
                ? "bg-accent/20 text-accent"
                : "text-muted hover:text-text"
            }`}
          >
            Pinned ({pinnedCount})
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
        <label htmlFor="search" className="text-xs text-muted uppercase tracking-wide">Search</label>
        <input
          id="search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Firm name or asset (e.g. SOL)"
          className="px-3 py-1.5 bg-panel border border-border rounded-md text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
