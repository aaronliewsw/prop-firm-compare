import React from "react";

// Tiny cx helper — filters falsy, joins with space. No clsx dep.
function cx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
type BadgeTone = "neutral" | "positive" | "negative" | "accent" | "amber";

const toneClasses: Record<BadgeTone, string> = {
  neutral:  "bg-panel text-muted",
  positive: "bg-positive-soft text-positive",
  negative: "bg-accent-soft text-danger ring-1 ring-danger/40",
  accent:   "bg-accent-soft text-accent",
  amber:    "bg-[#FBF0D8] text-warn",
};

export function Badge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        "rounded-full text-[11px] font-medium px-2 py-0.5 inline-flex items-center gap-1",
        toneClasses[tone],
      )}
    >
      {tone === "negative" && <span aria-hidden="true">•</span>}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("rounded-lg border border-border bg-panel", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SegButton
// ---------------------------------------------------------------------------
export function SegButton({
  active,
  children,
  className,
  ...props
}: { active?: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        "rounded px-3 py-1.5 text-[13px] transition-colors focus-ring",
        active
          ? "bg-bg text-text font-medium shadow-sm"
          : "bg-transparent text-muted hover:text-text",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
