import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { FundType } from "@/lib/types";

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "amber" | "violet" | "slate" | "red";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-line bg-raised text-muted",
    brand: "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300",
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    violet: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
    slate: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

const TYPE_LABEL: Record<FundType, string> = {
  growth: "Growth",
  balanced: "Balanced",
  income: "Income",
};

export function TypeBadge({ type, shariah }: { type: FundType; shariah?: boolean }) {
  return (
    <Badge tone={type === "growth" ? "brand" : type === "balanced" ? "violet" : "slate"}>
      {TYPE_LABEL[type]}
      {shariah ? " · Shariah" : ""}
    </Badge>
  );
}

export function VerifiedBadge({ href }: { href?: string }) {
  const cls = (
    <Badge tone="amber" className="whitespace-nowrap">
      <CheckCircle2 size={11} aria-hidden="true" /> AMC-Verified
    </Badge>
  );
  return href ? <Link href={href}>{cls}</Link> : cls;
}
