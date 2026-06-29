import Link from "next/link";
import { notFound } from "next/navigation";
import data from "@/data/firms.json";
import type { Firm } from "@/lib/firms";
import {
  formatDays,
  formatLeverage,
  formatMoney,
  formatPct,
  formatSizes,
} from "@/lib/firms";

const firms = data.firms as Firm[];

export function generateStaticParams() {
  return firms.map((f) => ({ id: f.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const firm = firms.find((f) => f.id === id);
  return {
    title: firm ? `${firm.name} — rules & payout` : "Firm not found",
  };
}

function confidenceClasses(c: Firm["confidence"]) {
  return c === "high" ? "bg-accent" : c === "medium" ? "bg-warn" : "bg-danger";
}

function confidenceLabel(c: Firm["confidence"]) {
  return c === "high"
    ? "High confidence (verified recently)"
    : c === "medium"
    ? "Medium confidence (verify before purchase)"
    : "Low confidence (verify thoroughly)";
}

function Tile({
  label,
  value,
  caption,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  caption?: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg bg-panel p-4">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-lg font-mono text-text">{value}</div>
      {sub && <div className="mt-1 text-xs font-mono text-muted">{sub}</div>}
      {caption && <div className="mt-1 text-[11px] text-muted/70 leading-snug">{caption}</div>}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs uppercase tracking-wide text-muted mt-8 mb-3">{children}</h2>
  );
}

export default async function FirmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const f = firms.find((firm) => firm.id === id);
  if (!f) notFound();

  return (
    <main className="max-w-[1100px] mx-auto px-6 py-8">
      <Link href="/" className="text-xs text-muted hover:text-accent">
        ← All firms
      </Link>

      <header className="mt-4 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${confidenceClasses(f.confidence)}`}
            title={confidenceLabel(f.confidence)}
            aria-label={confidenceLabel(f.confidence)}
          />
          <h1
            className={`text-2xl font-semibold ${
              f.status === "closed" ? "text-muted line-through" : "text-text"
            }`}
          >
            {f.name}
          </h1>
          <span
            className={`text-xs px-2 py-0.5 rounded border ${
              f.fundingModel === "instant"
                ? "border-accent/40 text-accent"
                : f.fundingModel === "both"
                ? "border-warn/40 text-warn"
                : "border-muted/40 text-muted"
            }`}
          >
            {f.fundingModel}
          </span>
          {f.status === "closed" && (
            <span
              className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-danger/50 text-danger font-semibold"
              title="This firm has shut down — retained for reference only"
            >
              Closed
            </span>
          )}
          <a
            href={f.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline"
          >
            Visit site ↗
          </a>
        </div>
        <p className="mt-2 text-sm text-muted">
          Last verified <span className="font-mono">{f.lastVerified}</span> ·{" "}
          {f.confidence} confidence
        </p>
      </header>

      <div className="mb-2 p-3 border border-warn/40 bg-warn/5 rounded-md text-xs text-muted">
        <strong className="text-warn">Verify before buying.</strong> {data.disclaimer}
      </div>

      <SectionHeader>Rules</SectionHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Daily Drawdown" value={formatPct(f.dailyDrawdownPct)} />
        <Tile label="Max Drawdown" value={formatPct(f.maxDrawdownPct)} />
        <Tile label="Drawdown Type" value={f.drawdownType} />
        <Tile label="Profit Target" value={formatPct(f.profitTargetPct)} />
        <Tile label="Profit Split" value={`${f.profitSplitPct}%`} />
      </div>

      <SectionHeader>Payout & capital</SectionHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile
          label="1st Payout"
          value={formatDays(f.payoutDays)}
          caption="min days on funded acct before first withdrawal"
        />
        <Tile
          label="Payout Speed"
          value={f.payoutSpeed ?? "—"}
          caption="processing time after request"
        />
        <Tile
          label="Account Sizes"
          value={formatSizes(f.accountSizes)}
          sub={f.accountSizes.map(formatMoney).join(" · ")}
        />
        <Tile
          label="Max Funded"
          value={f.maxFundedTotal == null ? "—" : formatMoney(f.maxFundedTotal)}
        />
        <Tile label="Funding Model" value={f.fundingModel} />
      </div>

      <SectionHeader>Crypto</SectionHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Leverage" value={formatLeverage(f.cryptoLeverage)} />
        <Tile label="Crypto Assets" value={<span className="text-sm">{f.cryptoAssets}</span>} />
        <Tile label="Asset Classes" value={f.assetClasses.join(", ")} />
      </div>

      {f.automation && (
        <>
          <SectionHeader>Automation / API — bots &amp; copy-trading (TradeSurge fit)</SectionHeader>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Tile label="Execution Platform" value={<span className="text-sm">{f.automation.platform}</span>} />
            <Tile label="EA / Bots / Algo" value={f.automation.ea} caption="Expert-Advisor / automated trading on funded accounts" />
            <Tile label="API Keys" value={f.automation.apiKeys} caption="real trade-scope keys to your own account" />
            <Tile
              label="TradeSurge Fit"
              value={f.automation.feasibility}
              caption="can a SaaS connect via your own key / EA?"
            />
          </div>
          <div className="mt-4 border border-border rounded-lg bg-panel p-4 space-y-2">
            <p className="text-text/90 text-sm leading-relaxed">{f.automation.note}</p>
            <p className="text-muted text-xs leading-relaxed">
              <span className="text-muted/60">Copy / account-sharing / 3rd-party: </span>
              {f.automation.copy}
            </p>
          </div>
        </>
      )}

      <SectionHeader>
        Programs{f.programDetails?.length ? ` — per-program rules (${f.programDetails.length})` : ""}
      </SectionHeader>
      {f.programDetails && f.programDetails.length > 0 ? (
        <div className="border border-border rounded-lg overflow-hidden bg-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg/40 border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Program</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium whitespace-nowrap">Price / fee</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap">Daily DD</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap">Max DD</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">DD Type</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Target</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Split</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium whitespace-nowrap">Sizes</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap">1st Payout</th>
                </tr>
              </thead>
              <tbody>
                {f.programDetails.map((p, i) => (
                  <tr key={i} className="border-b border-border last:border-0 align-top">
                    <td className="px-3 py-2">
                      <div className="text-text">{p.name}</div>
                      {(p.steps || p.note) && (
                        <div className="text-[11px] text-muted/70 leading-snug max-w-[280px]">
                          {p.steps}
                          {p.steps && p.note ? " · " : ""}
                          {p.note}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted text-xs leading-snug max-w-[260px]">
                      {p.pricing ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{formatPct(p.dailyDrawdownPct)}</td>
                    <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{formatPct(p.maxDrawdownPct)}</td>
                    <td className="px-3 py-2 text-muted">{p.drawdownType}</td>
                    <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{formatPct(p.profitTargetPct)}</td>
                    <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{formatPct(p.profitSplitPct)}</td>
                    <td className="px-3 py-2 text-muted font-mono text-xs whitespace-nowrap">
                      {formatSizes(p.accountSizes ?? f.accountSizes)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono whitespace-nowrap">
                      {formatDays(p.payoutDays ?? f.payoutDays)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {f.programs.map((p) => (
            <span
              key={p}
              className="text-xs px-2 py-1 rounded border border-border text-muted"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      <SectionHeader>Notes / caveats</SectionHeader>
      <div className="border border-border rounded-lg bg-panel p-4">
        <p className="text-text/90 text-sm leading-relaxed">{f.notes}</p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted border-t border-border pt-4">
        <a
          href={f.source}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          ↗ Source
        </a>
        <span>
          Verified <span className="font-mono">{f.lastVerified}</span>
        </span>
        <span>Confidence: {f.confidence}</span>
        <span>Status: {f.status}</span>
      </div>
    </main>
  );
}
