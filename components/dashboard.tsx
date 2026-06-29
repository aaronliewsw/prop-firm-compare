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
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 py-6 sm:px-6">
        <header className="flex flex-col gap-2 border-b-[1.5px] border-text pb-4">
          <p className="text-[13px] uppercase tracking-[0.06em] text-muted">Dashboard</p>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-medium text-text">Prop Firm Compare</h1>
            <p className="text-[13px] text-muted">
              {firms.length} firms · dataset last refreshed {generatedAt}
            </p>
          </div>
        </header>

        <div className="rounded-md border border-border bg-panel2 p-3 text-[13px] text-muted">
          <strong className="font-medium text-warn">Verify before buying.</strong>{" "}
          Prop firm terms change without notice. Daily DD, max DD, profit splits, and payout cadence
          differ across programs within a single firm and update routinely. This dashboard is a
          starting point — confirm every number on the firm's site before purchasing a challenge.
        </div>

        <section className="flex flex-col gap-4">
          <p className="text-[13px] uppercase tracking-[0.06em] text-muted">Filters</p>
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
        </section>

        <div className="flex items-center justify-end gap-3">
          {pinnedFirms.length >= 2 && (
            <button
              onClick={() => setShowCompare((v) => !v)}
              aria-pressed={showCompare}
              className="rounded-md border border-accent bg-accent px-3 py-2 text-[13px] font-medium text-bg transition-colors"
            >
              {showCompare ? "Hide comparison" : `Compare pinned (${pinnedFirms.length})`}
            </button>
          )}
        </div>

        {showCompare && pinnedFirms.length >= 2 && (
          <ComparePanel firms={pinnedFirms} onClose={() => setShowCompare(false)} />
        )}

        <section className="flex flex-col gap-4">
          <p className="text-[13px] uppercase tracking-[0.06em] text-muted">Firm Rules</p>
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
        </section>

        <footer className="border-t border-border pt-4 text-[13px] text-muted">
          Click any column header to sort. Click a row to expand full notes &
          source. Click a firm name to open its site. Pin firms with the star to
          shortlist them and compare side by side. Confidence dots indicate how
          recently terms were verified.
        </footer>
      </div>
    </main>
  );
}
