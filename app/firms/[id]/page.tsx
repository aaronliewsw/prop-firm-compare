import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import data from "@/data/firms.json";
import type { Firm } from "@/lib/firms";
import {
  formatDays,
  formatLeverage,
  formatMoney,
  formatPct,
  formatSizes,
} from "@/lib/firms";
import { Badge, Card } from "@/components/ui/primitives";

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

function statusTone(status: Firm["status"]): "positive" | "negative" {
  return status === "closed" ? "negative" : "positive";
}

function confidenceTone(
  c: Firm["confidence"],
): "positive" | "amber" | "negative" {
  return c === "high" ? "positive" : c === "medium" ? "amber" : "negative";
}

function confidenceLabel(c: Firm["confidence"]) {
  return c === "high"
    ? "High confidence (verified recently)"
    : c === "medium"
    ? "Medium confidence (verify before purchase)"
    : "Low confidence (verify thoroughly)";
}

function labelize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-b-[1.5px] border-text/20 pb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
      {children}
    </h2>
  );
}

type MetricTone = "reward" | "risk" | "neutral";

function metricValueClass(tone: MetricTone): string {
  if (tone === "reward") return "text-positive font-medium";
  if (tone === "risk") return "text-muted";
  return "text-text";
}

function KpiCell({
  label,
  value,
  caption,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  caption?: string;
  tone?: MetricTone;
}) {
  return (
    <div className="px-4 py-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
        {label}
      </div>
      <div className={`mt-2 font-mono tnum text-lg leading-none ${metricValueClass(tone)}`}>
        {value}
      </div>
      {caption && (
        <div className="mt-2 text-[12px] leading-snug text-muted">{caption}</div>
      )}
    </div>
  );
}

function RuleRow({
  label,
  value,
  detail,
  numeric,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  numeric?: boolean;
  tone?: MetricTone;
}) {
  return (
    <tr>
      <th
        scope="row"
        className="px-4 py-3 text-left align-top text-[13px] font-medium text-text"
      >
        {label}
      </th>
      <td
        className={`border-l border-border px-4 py-3 text-right align-top text-[13px] ${
          numeric ? "font-mono tnum" : ""
        } ${metricValueClass(tone)}`}
      >
        {value}
      </td>
      <td className="border-l border-border px-4 py-3 align-top text-[13px] leading-relaxed text-muted">
        {detail ?? "—"}
      </td>
    </tr>
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
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-12">
        <Link
          href="/"
          className="focus-ring inline-flex items-center gap-2 text-[13px] text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
          <span>All firms</span>
        </Link>

        <header className="mt-6 border-b-[1.5px] border-text/20 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-medium tracking-tight text-text md:text-3xl">
                  {f.name}
                </h1>
                <Badge tone={statusTone(f.status)}>{labelize(f.status)}</Badge>
                <span
                  title={confidenceLabel(f.confidence)}
                  aria-label={confidenceLabel(f.confidence)}
                >
                  <Badge tone={confidenceTone(f.confidence)}>
                    {labelize(f.confidence)} confidence
                  </Badge>
                </span>
                <Badge tone="neutral">{f.fundingModel}</Badge>
              </div>
              <p className="text-[13px] leading-relaxed text-muted">
                Last verified{" "}
                <span className="font-mono tnum text-text">{f.lastVerified}</span>
              </p>
            </div>
            <a
              href={f.website}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Visit site
              <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
            </a>
          </div>
        </header>

        <section className="py-8">
          <div className="overflow-hidden rounded-lg border border-border bg-panel">
            <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
              <KpiCell label="Daily Drawdown" value={formatPct(f.dailyDrawdownPct)} tone="risk" />
              <KpiCell label="Max Drawdown" value={formatPct(f.maxDrawdownPct)} tone="risk" />
              <KpiCell label="Profit Target" value={formatPct(f.profitTargetPct)} tone="risk" />
              <KpiCell label="Profit Split" value={`${f.profitSplitPct}%`} tone="reward" />
              <KpiCell label="Leverage" value={formatLeverage(f.cryptoLeverage)} tone="reward" />
              <KpiCell label="1st Payout" value={formatDays(f.payoutDays)} tone="neutral" />
            </div>
          </div>
        </section>

        <Card className="p-4">
          <div className="flex gap-3">
            <ShieldCheck
              size={16}
              strokeWidth={1.5}
              className="mt-0.5 shrink-0 text-accent"
              aria-hidden="true"
            />
            <p className="text-[13px] leading-relaxed text-muted">
              <strong className="font-medium text-text">Verify before buying.</strong>{" "}
              {data.disclaimer}
            </p>
          </div>
        </Card>

        <section className="py-8 md:py-12">
          <SectionHeader>Rules</SectionHeader>
          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-bg">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-[13px]">
                <thead className="border-b-[1.5px] border-text/20">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted"
                    >
                      Rule
                    </th>
                    <th
                      scope="col"
                      className="border-l border-border px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted"
                    >
                      Value
                    </th>
                    <th
                      scope="col"
                      className="border-l border-border px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted"
                    >
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <RuleRow
                    label="Daily Drawdown"
                    value={formatPct(f.dailyDrawdownPct)}
                    numeric
                    tone="risk"
                  />
                  <RuleRow
                    label="Max Drawdown"
                    value={formatPct(f.maxDrawdownPct)}
                    numeric
                    tone="risk"
                  />
                  <RuleRow label="Drawdown Type" value={f.drawdownType} tone="neutral" />
                  <RuleRow
                    label="Profit Target"
                    value={formatPct(f.profitTargetPct)}
                    numeric
                    tone="risk"
                  />
                  <RuleRow
                    label="Profit Split"
                    value={`${f.profitSplitPct}%`}
                    numeric
                    tone="reward"
                  />
                  <RuleRow
                    label="1st Payout"
                    value={formatDays(f.payoutDays)}
                    detail="min days on funded acct before first withdrawal"
                    numeric
                    tone="neutral"
                  />
                  <RuleRow
                    label="Payout Speed"
                    value={f.payoutSpeed ?? "—"}
                    detail="processing time after request"
                    tone="neutral"
                  />
                  <RuleRow
                    label="Account Sizes"
                    value={formatSizes(f.accountSizes)}
                    detail={
                      <span className="font-mono tnum">
                        {f.accountSizes.map(formatMoney).join(" · ")}
                      </span>
                    }
                    numeric
                    tone="neutral"
                  />
                  <RuleRow
                    label="Max Funded"
                    value={f.maxFundedTotal == null ? "—" : formatMoney(f.maxFundedTotal)}
                    numeric
                    tone="reward"
                  />
                  <RuleRow label="Funding Model" value={f.fundingModel} tone="neutral" />
                  <RuleRow
                    label="Leverage"
                    value={formatLeverage(f.cryptoLeverage)}
                    numeric
                    tone="reward"
                  />
                  <RuleRow label="Crypto Assets" value={f.cryptoAssets} tone="neutral" />
                  <RuleRow
                    label="Asset Classes"
                    value={f.assetClasses.join(", ")}
                    tone="neutral"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {f.automation && (
          <section className="pb-8 md:pb-12">
            <SectionHeader>Automation / API — bots &amp; copy-trading (TradeSurge fit)</SectionHeader>
            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-panel">
              <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                <KpiCell
                  label="Execution Platform"
                  value={<span className="text-[13px] font-sans">{f.automation.platform}</span>}
                />
                <KpiCell
                  label="EA / Bots / Algo"
                  value={<span className="text-[13px] font-sans">{f.automation.ea}</span>}
                  caption="Expert-Advisor / automated trading on funded accounts"
                />
                <KpiCell
                  label="API Keys"
                  value={<span className="text-[13px] font-sans">{f.automation.apiKeys}</span>}
                  caption="real trade-scope keys to your own account"
                />
                <KpiCell
                  label="TradeSurge Fit"
                  value={<span className="text-[13px] font-sans">{f.automation.feasibility}</span>}
                  caption="can a SaaS connect via your own key / EA?"
                />
              </div>
            </div>
            <Card className="mt-4 p-4">
              <p className="text-[13px] leading-relaxed text-text">{f.automation.note}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-muted">
                <span className="text-text">Copy / account-sharing / 3rd-party: </span>
                {f.automation.copy}
              </p>
            </Card>
          </section>
        )}

        <section className="pb-8 md:pb-12">
          <SectionHeader>
            Programs{f.programDetails?.length ? ` — per-program rules (${f.programDetails.length})` : ""}
          </SectionHeader>
          {f.programDetails && f.programDetails.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-bg">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-[13px]">
                  <thead className="border-b-[1.5px] border-text/20">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Program</th>
                      <th scope="col" className="border-l border-border px-3 py-3 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted whitespace-nowrap">Price / fee</th>
                      <th scope="col" className="border-l border-border px-3 py-3 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted whitespace-nowrap">Daily DD</th>
                      <th scope="col" className="border-l border-border px-3 py-3 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted whitespace-nowrap">Max DD</th>
                      <th scope="col" className="border-l border-border px-3 py-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted">DD Type</th>
                      <th scope="col" className="border-l border-border px-3 py-3 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Target</th>
                      <th scope="col" className="border-l border-border px-3 py-3 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Split</th>
                      <th scope="col" className="border-l border-border px-3 py-3 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted whitespace-nowrap">Sizes</th>
                      <th scope="col" className="border-l border-border px-3 py-3 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted whitespace-nowrap">1st Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {f.programDetails.map((p, i) => (
                      <tr key={i} className="align-top">
                        <td className="px-3 py-3">
                          <div className="font-medium text-text">{p.name}</div>
                          {(p.steps || p.note) && (
                            <div className="mt-1 max-w-[280px] text-[12px] leading-relaxed text-muted">
                              {p.steps}
                              {p.steps && p.note ? " · " : ""}
                              {p.note}
                            </div>
                          )}
                        </td>
                        <td className="border-l border-border px-3 py-3 text-right font-mono tnum text-[12px] leading-relaxed text-muted">
                          {p.pricing ?? "—"}
                        </td>
                        <td className="border-l border-border px-3 py-3 text-right font-mono tnum whitespace-nowrap text-muted">{formatPct(p.dailyDrawdownPct)}</td>
                        <td className="border-l border-border px-3 py-3 text-right font-mono tnum whitespace-nowrap text-muted">{formatPct(p.maxDrawdownPct)}</td>
                        <td className="border-l border-border px-3 py-3 text-muted">{p.drawdownType}</td>
                        <td className="border-l border-border px-3 py-3 text-right font-mono tnum whitespace-nowrap text-muted">{formatPct(p.profitTargetPct)}</td>
                        <td className="border-l border-border px-3 py-3 text-right font-mono tnum whitespace-nowrap text-positive font-medium">{formatPct(p.profitSplitPct)}</td>
                        <td className="border-l border-border px-3 py-3 text-right font-mono tnum text-[12px] whitespace-nowrap text-muted">
                          {formatSizes(p.accountSizes ?? f.accountSizes)}
                        </td>
                        <td className="border-l border-border px-3 py-3 text-right font-mono tnum whitespace-nowrap text-text">
                          {formatDays(p.payoutDays ?? f.payoutDays)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {f.programs.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-border bg-panel px-2 py-1 text-[13px] text-muted"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="pb-8 md:pb-12">
          <SectionHeader>Notes / caveats</SectionHeader>
          <Card className="mt-4 p-4">
            <p className="text-[13px] leading-relaxed text-text">{f.notes}</p>
          </Card>
        </section>

        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted">
            <a
              href={f.source}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex items-center gap-1 font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Source
              <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
            </a>
            <span>
              Verified <span className="font-mono tnum text-text">{f.lastVerified}</span>
            </span>
            <span>Confidence: {f.confidence}</span>
            <span>Status: {f.status}</span>
          </div>
        </Card>
      </div>
    </main>
  );
}
