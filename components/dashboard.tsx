"use client";

import { useMemo, useState } from "react";
import type { AssetClass, DrawdownType, Firm } from "@/lib/firms";
import { usePinned } from "@/lib/use-pinned";
import FirmTable from "./firm-table";
import FilterBar from "./filter-bar";
import ComparePanel from "./compare-panel";

export default function Dashboard({ firms, generatedAt }: { firms: Firm[]; generatedAt: string }) {
  const [fundingModel, setFundingModel] = useState<"all" | "challenge" | "instant" | "both">("all");
  const [assetClass, setAssetClass] = useState<"all" | AssetClass>("all");
  const [minLeverage, setMinLeverage] = useState<number>(0);
  const [drawdownType, setDrawdownType] = useState<"all" | DrawdownType>("all");
  const [payoutSpeed, setPayoutSpeed] = useState<"any" | "24" | "48">("any");
  const [pinnedOnly, setPinnedOnly] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [showCompare, setShowCompare] = useState<boolean>(false);

  const { pinned, togglePin } = usePinned();

  // Firms to compare, in the dataset's original order, restricted to pins.
  const pinnedFirms = useMemo(
    () => firms.filter((f) => pinned.has(f.id)),
    [firms, pinned]
  );

  return (
    <main className="max-w-[1400px] mx-auto px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-text mb-1">Prop Firm Compare</h1>
        <p className="text-sm text-muted">
          {firms.length} firms · dataset last refreshed {generatedAt}
        </p>
      </header>

      <div className="mb-6 p-3 border border-warn/40 bg-warn/5 rounded-md text-xs text-muted">
        <strong className="text-warn">Verify before buying.</strong>{" "}
        Prop firm terms change without notice. Daily DD, max DD, profit splits, and payout cadence
        differ across programs within a single firm and update routinely. This dashboard is a
        starting point — confirm every number on the firm's site before purchasing a challenge.
      </div>

      <FilterBar
        fundingModel={fundingModel}
        setFundingModel={setFundingModel}
        assetClass={assetClass}
        setAssetClass={setAssetClass}
        minLeverage={minLeverage}
        setMinLeverage={setMinLeverage}
        drawdownType={drawdownType}
        setDrawdownType={setDrawdownType}
        payoutSpeed={payoutSpeed}
        setPayoutSpeed={setPayoutSpeed}
        pinnedOnly={pinnedOnly}
        setPinnedOnly={setPinnedOnly}
        pinnedCount={pinned.size}
        search={search}
        setSearch={setSearch}
      />

      <div className="flex items-center justify-end gap-3 mb-4">
        {pinnedFirms.length >= 2 && (
          <button
            onClick={() => setShowCompare((v) => !v)}
            aria-pressed={showCompare}
            className="px-3 py-1.5 text-sm rounded-md border border-accent/40 text-accent hover:bg-accent/10 transition-colors"
          >
            {showCompare ? "Hide comparison" : `Compare pinned (${pinnedFirms.length})`}
          </button>
        )}
      </div>

      {showCompare && pinnedFirms.length >= 2 && (
        <ComparePanel firms={pinnedFirms} onClose={() => setShowCompare(false)} />
      )}

      <FirmTable
        firms={firms}
        fundingModel={fundingModel}
        assetClass={assetClass}
        minLeverage={minLeverage}
        drawdownType={drawdownType}
        payoutSpeed={payoutSpeed}
        pinnedOnly={pinnedOnly}
        search={search}
        pinned={pinned}
        togglePin={togglePin}
      />

      <footer className="mt-6 text-xs text-muted">
        Click any column header to sort. Click a row to expand full notes &
        source. Click a firm name to open its site. Pin firms with the star to
        shortlist them and compare side by side. Confidence dots indicate how
        recently terms were verified.
      </footer>
    </main>
  );
}
