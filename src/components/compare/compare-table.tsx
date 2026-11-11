"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TypeBadge, QualityBadge } from "@/components/ui/badge";
import { cr, fullDate, pct, takaExact, NOT_AVAILABLE } from "@/lib/format";

export interface CompareFund {
  slug: string;
  name: string;
  acronym: string;
  amc: string;
  type: "growth" | "balanced" | "income";
  shariah: boolean;
  completeness: "complete" | "partial" | "missing";
  isStale: boolean;
  latestNav: number | null;
  latestNavDate: string | null;
  fundSize: number | null;
  fee: number | null;
  g1: number | null;
  g3: number | null;
  g5: number | null;
  gMax: number | null;
  sipIrr3: number | null;
  sipFinal3: number | null;
  sipInvested3: number | null;
  worstFall: number;
  vol: number | null;
  positiveMonths3y: number | null;
  divPaid3y: number;
  became3y: number | null;
}

type SortKey = "name" | "g3" | "sip" | "worst" | "fee" | "size";

const SORT_LABEL: Record<SortKey, string> = {
  name: "Fund",
  g3: "3-year return",
  sip: "SIP return",
  worst: "Worst fall",
  fee: "Fee",
  size: "Size",
};

export function CompareTable({
  funds,
  benchmark,
}: {
  funds: CompareFund[];
  benchmark: { short: string; annualRate: number | null; status: string } | null;
}) {
  const [sort, setSort] = useState<SortKey>("g3");
  const [desc, setDesc] = useState(true);

  const sorted = useMemo(() => {
    const value = (f: CompareFund): number | string => {
      switch (sort) {
        case "name": return f.name.toLowerCase();
        case "g3": return f.g3 ?? -Infinity;
        case "sip": return f.sipIrr3 ?? -Infinity;
        case "worst": return f.worstFall; // closer to zero is better; ascending
        case "fee": return f.fee ?? Infinity;
        case "size": return f.fundSize ?? -Infinity;
      }
    };
    return [...funds].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (typeof va === "string" || typeof vb === "string") {
        const cmp = String(va).localeCompare(String(vb));
        return desc ? -cmp : cmp;
      }
      return desc ? vb - va : va - vb;
    });
  }, [funds, sort, desc]);

  const best = (key: "g3" | "sip" | "worst") => {
    const values = funds.map((f) => (key === "g3" ? f.g3 : key === "sip" ? f.sipIrr3 : f.worstFall)).filter((v): v is number => v !== null);
    if (!values.length) return null;
    return key === "worst" ? Math.max(...values) : Math.max(...values);
  };
  const bestG3 = best("g3");
  const bestSip = best("sip");
  const bestWorst = best("worst");

  const sortButton = (key: SortKey, label = SORT_LABEL[key]) => (
    <button
      type="button"
      onClick={() => {
        if (sort === key) setDesc((d) => !d);
        else {
          setSort(key);
          setDesc(key !== "worst" && key !== "fee");
        }
      }}
      className="inline-flex items-center gap-1 text-left font-semibold hover:text-brand-700 dark:hover:text-brand-300"
      aria-label={`Sort by ${label}`}
    >
      {label}
      <span aria-hidden="true" className="text-[10px] text-faint">{sort === key ? (desc ? "▼" : "▲") : "↕"}</span>
    </button>
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted">Sort funds by:</span>
        {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              if (sort === k) setDesc((d) => !d);
              else {
                setSort(k);
                setDesc(k !== "worst" && k !== "fee");
              }
            }}
            className={`rounded-full border px-2.5 py-1 font-medium transition ${
              sort === k ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-line text-muted hover:text-fg"
            }`}
            aria-pressed={sort === k}
          >
            {SORT_LABEL[k]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="rounded-tl-xl border border-line bg-raised px-3 py-2.5 text-left font-semibold">Metric</th>
              {sorted.map((f, i) => (
                <th
                  key={f.slug}
                  className={`border border-line px-3 py-3 text-left align-top ${
                    f.g3 !== null && bestG3 !== null && f.g3 === bestG3 ? "bg-brand-50 dark:bg-brand-950/40" : "bg-raised"
                  } ${i === sorted.length - 1 ? "rounded-tr-xl" : ""}`}
                >
                  <Link href={`/funds/${f.slug}`} className="block font-semibold hover:text-brand-700 dark:hover:text-brand-300">
                    {f.name}
                  </Link>
                  <span className="mt-0.5 block text-[11px] font-normal text-muted">{f.amc}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    <TypeBadge type={f.type} shariah={f.shariah} />
                    <QualityBadge completeness={f.completeness} stale={f.isStale} />
                  </span>
                  <span className="mt-1 block text-[10px] font-normal text-faint">
                    Latest NAV {fullDate(f.latestNavDate)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tnum">
            <BigRow
              label="৳1,00,000 became (3 yr)"
              cells={sorted.map((f) => (f.became3y === null ? NOT_AVAILABLE : takaExact(f.became3y)))}
              highlight={sorted.map((f) => f.g3 !== null && bestG3 !== null && f.g3 === bestG3)}
            />
            <Row
              label={sortButton("g3", "Per year (3-yr CAGR)")}
              cells={sorted.map((f) => pct(f.g3))}
              highlight={sorted.map((f) => f.g3 !== null && bestG3 !== null && f.g3 === bestG3)}
            />
            <Row
              label={`Gap vs ${benchmark?.short ?? "benchmark"}`}
              sub={benchmark?.annualRate !== null && benchmark?.annualRate !== undefined ? `${benchmark.annualRate.toFixed(2)}%/yr ${benchmark.status}` : undefined}
              cells={sorted.map((f) => {
                if (f.g3 === null || benchmark?.annualRate === null || benchmark?.annualRate === undefined) return NOT_AVAILABLE;
                const gap = f.g3 * 100 - benchmark.annualRate;
                return `${gap >= 0 ? "+" : ""}${gap.toFixed(1)} pp/yr`;
              })}
            />
            <Row
              label={sortButton("sip", "৳5,000/mo × 3 yr → value")}
              sub="from ৳1,80,000 paid in"
              cells={sorted.map((f) => (f.sipFinal3 === null ? NOT_AVAILABLE : takaExact(f.sipFinal3)))}
            />
            <Row
              label="SIP return / year"
              cells={sorted.map((f) => pct(f.sipIrr3))}
              highlight={sorted.map((f) => f.sipIrr3 !== null && bestSip !== null && f.sipIrr3 === bestSip)}
            />
            <Row
              label={sortButton("worst", "Worst NAV fall")}
              tone="bad"
              cells={sorted.map((f) => (f.worstFall === 0 ? NOT_AVAILABLE : pct(f.worstFall, { signed: false })))}
              highlight={sorted.map((f) => f.worstFall !== 0 && f.worstFall === bestWorst)}
            />
            <Row
              label={sortButton("fee", "Fee / year")}
              cells={sorted.map((f) => (f.fee === null ? NOT_AVAILABLE : `${f.fee.toFixed(2)}%`))}
            />
            <Row
              label={sortButton("size", "Reported size")}
              cells={sorted.map((f) => (f.fundSize === null ? NOT_AVAILABLE : cr(f.fundSize)))}
            />
            <Row label="Volatility / yr" cells={sorted.map((f) => (f.vol === null ? NOT_AVAILABLE : `${(f.vol * 100).toFixed(1)}%`))} />
            <Row
              label="Positive months (3 yr)"
              cells={sorted.map((f) => (f.positiveMonths3y === null ? NOT_AVAILABLE : `${Math.round(f.positiveMonths3y * 100)}%`))}
            />
            <Row
              label="Latest NAV"
              cells={sorted.map((f) =>
                f.latestNav === null || f.latestNavDate === null
                  ? NOT_AVAILABLE
                  : `৳${f.latestNav.toFixed(2)} · ${fullDate(f.latestNavDate)}`
              )}
            />
            <Row label="Completeness" plain cells={sorted.map((f) => `${f.completeness}${f.isStale ? " · stale" : ""}`)} />
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-faint">
        Sorting changes the column order only; the arithmetic is identical for every fund. Best values in the current
        selection are tinted.
      </p>
    </div>
  );
}

function Row({
  label,
  cells,
  tone,
  sub,
  highlight,
  plain,
}: {
  label: React.ReactNode;
  cells: string[];
  tone?: "bad";
  sub?: string;
  highlight?: boolean[];
  plain?: boolean;
}) {
  return (
    <tr>
      <th scope="row" className="border border-line px-3 py-2.5 text-left font-medium text-muted">
        {label}
        {sub ? <span className="mt-0.5 block text-[10px] font-normal text-faint">{sub}</span> : null}
      </th>
      {cells.map((c, i) => (
        <td
          key={i}
          className={`border border-line px-3 py-2.5 font-semibold ${tone === "bad" ? "text-red-600 dark:text-red-400" : ""} ${
            highlight?.[i] ? "text-brand-700 dark:text-brand-300" : ""
          } ${plain ? "font-normal" : ""}`}
        >
          {c}
        </td>
      ))}
    </tr>
  );
}

function BigRow({ label, cells, highlight }: { label: string; cells: string[]; highlight?: boolean[] }) {
  return (
    <tr>
      <th scope="row" className="border border-line px-3 py-3 text-left text-muted">{label}</th>
      {cells.map((c, i) => (
        <td key={i} className="border border-line px-3 py-3 font-bold tnum">
          <span className={highlight?.[i] ? "text-base text-brand-600 dark:text-brand-400" : "text-base"}>{c}</span>
        </td>
      ))}
    </tr>
  );
}
