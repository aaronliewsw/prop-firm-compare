"use client";

import Link from "next/link";
import type { Firm } from "@/lib/firms";
import {
  formatDays,
  formatLeverage,
  formatMoney,
  formatPct,
} from "@/lib/firms";
import { Card } from "./ui/primitives";

interface Props {
  firms: Firm[];
  onClose: () => void;
}

type Row = {
  label: string;
  render: (f: Firm) => React.ReactNode;
  truncate?: boolean; // clamp width + ellipsis (long free-text cells); full value on hover
};

const rows: Row[] = [
  { label: "Model", render: (f) => f.fundingModel },
  { label: "Daily DD", render: (f) => formatPct(f.dailyDrawdownPct) },
  { label: "Max DD", render: (f) => formatPct(f.maxDrawdownPct) },
  { label: "DD Type", render: (f) => f.drawdownType },
  { label: "Profit Target", render: (f) => formatPct(f.profitTargetPct) },
  { label: "Profit Split", render: (f) => `${f.profitSplitPct}%` },
  {
    label: "Max Funded",
    render: (f) => (f.maxFundedTotal == null ? "—" : formatMoney(f.maxFundedTotal)),
  },
  { label: "1st Payout", render: (f) => formatDays(f.payoutDays) },
  { label: "Payout Speed", render: (f) => f.payoutSpeed ?? "—" },
  { label: "Leverage", render: (f) => formatLeverage(f.cryptoLeverage) },
  { label: "Crypto Assets", render: (f) => f.cryptoAssets, truncate: true },
  { label: "Platform", render: (f) => f.automation?.platform ?? "—", truncate: true },
  { label: "EA / bots", render: (f) => f.automation?.ea ?? "—" },
  { label: "API keys", render: (f) => f.automation?.apiKeys ?? "—" },
  { label: "TradeSurge fit", render: (f) => f.automation?.feasibility ?? "—" },
  { label: "Confidence", render: (f) => f.confidence },
];

// Cells that should render in mono (numeric / code-like values).
const monoLabels = new Set([
  "Daily DD",
  "Max DD",
  "Profit Target",
  "Profit Split",
  "Max Funded",
  "1st Payout",
  "Payout Speed",
  "Leverage",
]);

// TODO(restyle): Add ▲/▼ signed-delta treatment if compare rows expose directional figures; these rows are absolute rule values.

export default function ComparePanel({ firms, onClose }: Props) {
  if (firms.length < 2) return null;

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="flex items-center justify-between border-b-[1.5px] border-text px-4 py-3">
        <span className="text-[13px] uppercase tracking-[0.06em] text-muted">
          Comparing {firms.length} pinned firms
        </span>
        <button
          onClick={onClose}
          className="min-h-[44px] px-3 py-2 text-[13px] text-muted transition-colors hover:text-text"
          aria-label="Close comparison"
        >
          Close
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="border-b border-border bg-bg text-[11px] uppercase tracking-[0.06em] text-muted">
            <tr className="divide-x divide-border">
              <th className="sticky left-0 z-10 border-r-[1.5px] border-text bg-panel px-3 py-2 text-left font-medium whitespace-nowrap">
                Attribute
              </th>
              {firms.map((f) => (
                <th
                  key={f.id}
                  className="px-3 py-2 text-left font-medium whitespace-nowrap"
                >
                  <Link
                    href={`/firms/${f.id}`}
                    className={`hover:text-accent ${
                      f.status === "closed" ? "text-muted line-through" : "text-text"
                    }`}
                  >
                    {f.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr
                key={row.label}
                className="divide-x divide-border hover:bg-panel2"
              >
                <td className="sticky left-0 z-10 border-r-[1.5px] border-text bg-panel px-3 py-2 text-muted whitespace-nowrap">
                  {row.label}
                </td>
                {firms.map((f) => (
                  <td
                    key={f.id}
                    className={`px-3 py-2 tnum font-mono ${row.truncate ? "" : "whitespace-nowrap"} ${
                      monoLabels.has(row.label) ? "text-text" : "text-text/90"
                    }`}
                  >
                    {row.truncate ? (
                      <span
                        className="block max-w-[180px] truncate"
                        title={String(row.render(f))}
                      >
                        {row.render(f)}
                      </span>
                    ) : (
                      row.render(f)
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="divide-x divide-border">
              <td className="sticky left-0 z-10 border-r-[1.5px] border-text bg-panel px-3 py-2 text-muted whitespace-nowrap">
                Details
              </td>
              {firms.map((f) => (
                <td key={f.id} className="px-3 py-2 whitespace-nowrap">
                  <Link
                    href={`/firms/${f.id}`}
                    className="text-accent hover:underline"
                  >
                    Full rules
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
