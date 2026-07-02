"use client";

import { useMemo, useState } from "react";
import type { AssetClass, DrawdownType, Firm } from "@/lib/firms";
import { leverageOrNull, numOrNull } from "@/lib/firms";
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
  const [minSplit, setMinSplit] = useState<0 | 80 | 90>(0);
  const [minMaxDdBuffer, setMinMaxDdBuffer] = useState<0 | 6 | 8 | 10>(0);
  const [automation, setAutomation] = useState<"any" | "high" | "ea" | "none">("any");
  const [pinnedOnly, setPinnedOnly] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [showCompare, setShowCompare] = useState<boolean>(false);

  const { pinned, togglePin } = usePinned();

  // Firms to compare, in the dataset's original order, restricted to pins.
  const pinnedFirms = useMemo(
    () => firms.filter((f) => pinned.has(f.id)),
    [firms, pinned]
  );

  const matchCount = useMemo(() => {
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
    }).length;
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

        <section className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <FilterBar
            firms={firms}
            matchCount={matchCount}
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
            minSplit={minSplit}
            setMinSplit={setMinSplit}
            minMaxDdBuffer={minMaxDdBuffer}
            setMinMaxDdBuffer={setMinMaxDdBuffer}
            automation={automation}
            setAutomation={setAutomation}
            pinnedOnly={pinnedOnly}
            setPinnedOnly={setPinnedOnly}
            pinnedCount={pinned.size}
            search={search}
            setSearch={setSearch}
          />

          <div className="flex min-w-0 flex-col gap-4">
            {/* CHANGE 1: discoverable compare CTA.
                - 0 pinned: nothing rendered (unchanged).
                - 1 pinned: muted hint chip to teach the feature (non-interactive).
                - >=2 pinned: existing live Compare button with focus-ring (CHANGE 3). */}
            <div className="flex items-center justify-end gap-3">
              {pinnedFirms.length === 1 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel px-3 py-1.5 text-[13px] text-muted select-none">
                  1 pinned — pin 1 more to compare
                </span>
              )}
              {pinnedFirms.length >= 2 && (
                <button
                  onClick={() => setShowCompare((v) => !v)}
                  aria-pressed={showCompare}
                  className="focus-ring rounded-md border border-accent-hover bg-accent-hover px-3 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent"
                >
                  {showCompare ? "Hide comparison" : `Compare pinned (${pinnedFirms.length})`}
                </button>
              )}
            </div>

            {showCompare && pinnedFirms.length >= 2 && (
              <ComparePanel firms={pinnedFirms} onClose={() => setShowCompare(false)} />
            )}

            <section className="flex min-w-0 flex-col gap-4">
              <p className="text-[13px] uppercase tracking-[0.06em] text-muted">Firm Rules</p>
              <FirmTable
                firms={firms}
                fundingModel={fundingModel}
                assetClass={assetClass}
                minLeverage={minLeverage}
                drawdownType={drawdownType}
                payoutSpeed={payoutSpeed}
                minSplit={minSplit}
                minMaxDdBuffer={minMaxDdBuffer}
                automation={automation}
                pinnedOnly={pinnedOnly}
                search={search}
                pinned={pinned}
                togglePin={togglePin}
              />
            </section>
          </div>
        </section>

        <footer className="border-t border-border pt-4 text-[13px] text-muted">
          Click any column header to sort. Click a row to expand full notes &
          source. Click a firm name to open its site. Pin firms with the pin icon
          to shortlist them and compare side by side. Confidence dots indicate how
          recently terms were verified.
        </footer>
      </div>
    </main>
  );
}
