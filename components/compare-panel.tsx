"use client";

import Link from "next/link";
import type { Firm } from "@/lib/firms";
import {
  formatDays,
  formatLeverage,
  formatMoney,
  formatPct,
} from "@/lib/firms";

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

export default function ComparePanel({ firms, onClose }: Props) {
  if (firms.length < 2) return null;

  return (
    <div className="mb-6 border border-accent/40 rounded-lg overflow-hidden bg-panel">
      <div className="px-4 py-2 border-b border-border flex justify-between items-center">
        <span className="text-xs uppercase tracking-wide text-accent">
          Comparing {firms.length} pinned firms
        </span>
        <button
          onClick={onClose}
          className="text-xs text-muted hover:text-text px-2 py-1"
          aria-label="Close comparison"
        >
          Close ✕
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-bg/40 border-b border-border text-xs uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted whitespace-nowrap sticky left-0 bg-bg/40">
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
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-b border-border last:border-0 hover:bg-bg/30"
              >
                <td className="px-3 py-2 text-muted whitespace-nowrap sticky left-0 bg-panel">
                  {row.label}
                </td>
                {firms.map((f) => (
                  <td
                    key={f.id}
                    className={`px-3 py-2 ${row.truncate ? "" : "whitespace-nowrap"} ${
                      monoLabels.has(row.label) ? "font-mono" : "text-text/90"
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
            <tr className="border-b border-border last:border-0">
              <td className="px-3 py-2 text-muted whitespace-nowrap sticky left-0 bg-panel">
                Details
              </td>
              {firms.map((f) => (
                <td key={f.id} className="px-3 py-2 whitespace-nowrap">
                  <Link
                    href={`/firms/${f.id}`}
                    className="text-accent hover:underline"
                  >
                    Full rules →
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
