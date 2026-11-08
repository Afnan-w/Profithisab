"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Fund } from "@/lib/types";
import { ALL_FUNDS, benchTrail, sipRun, lumpPath } from "@/lib/returns";
import { BENCHES } from "@/lib/benchmarks";
import { MultiLineChart } from "@/components/charts/line-chart";
import { taka, takaExact, pct } from "@/lib/format";
import { site } from "@/lib/site";
import { TypeBadge, VerifiedBadge } from "@/components/ui/badge";

type Mode = "sip" | "lump";
type Horizon = "1y" | "3y" | "5y" | "max";

const PRESETS = [1000, 5000, 10000, 25000];

interface CalcRow {
  fund: Fund;
  final: number;
  invested: number;
  labels: string[];
  values: number[];
  irr: number | null;
  months: number;
}

export default function Calculator() {
  const [amount, setAmount] = useState(5000);
  const [mode, setMode] = useState<Mode>("sip");
  const [horizon, setHorizon] = useState<Horizon>("3y");
  const [shariahOnly, setShariahOnly] = useState(false);

  const months = horizonMonths(horizon);
  const shariahCount = ALL_FUNDS.filter((f) => f.shariah).length;

  const result = useMemo(() => {
    const pool = ALL_FUNDS.filter((f) => (shariahOnly ? f.shariah : true));
    const rows: CalcRow[] = [];
    for (const fund of pool) {
      const effMonths = horizon === "max" ? fund.series.length - 1 : Math.min(months, fund.series.length - 1);
      if (effMonths < 12) continue;
      if (mode === "sip") {
        const r = sipRun(fund, amount, effMonths);
        if (!r) continue;
        rows.push({
          fund,
          final: r.final,
          invested: r.invested,
          irr: r.irr,
          months: effMonths,
          labels: r.values.map((v) => v.m),
          values: r.values.map((v) => v.v),
        });
      } else {
        const path = lumpPath(fund.slug, amount, effMonths);
        if (path.length < 2) continue;
        rows.push({
          fund,
          final: path[path.length - 1].v,
          invested: amount,
          irr: cagrOf(amount, path[path.length - 1].v, effMonths),
          months: effMonths,
          labels: path.map((p) => p.m),
          values: path.map((p) => p.v),
        });
      }
    }
    if (rows.length < 3) return null;
    const sorted = [...rows].sort((a, b) => a.final - b.final);
    const medianRow = sorted[Math.floor(sorted.length / 2)];
    const bestRow = sorted[sorted.length - 1];
    return { rows, medianRow, bestRow };
  }, [amount, mode, horizon, shariahOnly, months]);

  if (!result) {
    return (
      <p className="text-sm text-muted">
        Not enough history for this selection yet — try ৳1,000 and the 3-year window.
      </p>
    );
  }

  const { medianRow, bestRow, rows } = result;
  const sanchTrail = benchTrail(BENCHES[0].slug, medianRow.fund);
  const chartSeries = [
    {
      name: `${medianRow.fund.name} (median fund)`,
      values: medianRow.values,
      color: "#059669",
      area: true,
    },
    {
      name: mode === "sip" ? "Sanchayapatra-style fixed rate" : "Sanchayapatra (3-yr)",
      values: sanchBench(medianRow.fund, amount, mode, medianRow.months),
      color: "#6366f1",
      dashed: true,
    },
  ];
  const medianIrr = medianOf(rows.map((r) => r.irr).filter((v): v is number => v !== null));

  return (
    <div>
      {/* ── Controls ── */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="calc-amount" className="text-xs font-medium text-muted">
            {mode === "sip" ? "Your monthly amount" : "Your one-time amount"}
          </label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <div className="flex items-center overflow-hidden rounded-xl border border-line-strong bg-surface focus-within:border-brand-500">
              <span className="pl-3 text-sm font-semibold text-muted">৳</span>
              <input
                id="calc-amount"
                type="number"
                min={100}
                step={500}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Math.min(10_000_000, Number(e.target.value) || 0)))}
                className="w-28 bg-transparent px-2 py-2.5 text-lg font-semibold tnum outline-none"
                inputMode="numeric"
              />
            </div>
            <div className="flex gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    amount === p
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "border-line text-muted hover:border-line-strong hover:text-fg"
                  }`}
                >
                  {p >= 1000 ? `৳${p / 1000}k` : `৳${p}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-xl border border-line bg-raised p-1" role="group" aria-label="How you would invest">
            <BtnChip active={mode === "sip"} onClick={() => setMode("sip")}>Every month</BtnChip>
            <BtnChip active={mode === "lump"} onClick={() => setMode("lump")}>One time</BtnChip>
          </div>
          <div className="inline-flex rounded-xl border border-line bg-raised p-1" role="group" aria-label="How long you stayed invested">
            {(["1y", "3y", "5y", "max"] as Horizon[]).map((h) => (
              <BtnChip key={h} active={horizon === h} onClick={() => setHorizon(h)}>
                {h === "max" ? "Max" : h}
              </BtnChip>
            ))}
          </div>
        </div>
      </div>

      <label className="mt-4 inline-flex cursor-pointer select-none items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={shariahOnly}
          onChange={(e) => setShariahOnly(e.target.checked)}
          className="h-4 w-4 accent-brand-600"
        />
        Shariah-compliant only
        <span className="text-faint">{shariahCount} funds</span>
      </label>

      {/* ── Results ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <MultiLineChart
            title={
              mode === "sip"
                ? `${takaExact(amount)}/month — what it became`
                : `${takaExact(amount)} once — what it became`
            }
            series={chartSeries}
            labels={medianRow.labels}
            formatTick={(v) => taka(v, { tight: true })}
            note={`Dividends reinvested · NAV window ending ${site.asOfLong}`}
          />

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={mode === "sip" ? "You put in" : "You started with"} value={takaExact(medianRow.invested)} />
            <Stat label="It would be worth" value={takaExact(medianRow.final)} strong />
            <Stat
              label="Profit so far"
              value={takaExact(Math.max(0, medianRow.final - medianRow.invested))}
              tone={medianRow.final >= medianRow.invested ? "ok" : "bad"}
            />
            <Stat
              label={mode === "sip" ? "SIP return / year" : "Return / year"}
              value={pct(medianIrr, { digits: 1 })}
            />
          </div>

          <p className="mt-3 text-xs leading-relaxed text-faint">
            Chart shows the <strong>median</strong> matched fund — the middle outcome of the {rows.length} funds in
            this filter, so nothing is cherry-picked. Fixed-rate line is a fair monthly-growth equivalent of the
            government certificate (it actually pays at maturity). Past NAVs don&apos;t predict future NAVs.
          </p>
        </div>

        <aside className="card card-pad h-fit">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Median &amp; best of the filter</p>
          <RowSheet fund={medianRow.fund} final={medianRow.final} tag="Median" />
          <RowSheet fund={bestRow.fund} final={bestRow.final} tag="Best" />
          <Link
            href={`/compare?funds=${bestRow.fund.slug},${medianRow.fund.slug}&amount=${amount}&mode=${mode}&h=${horizon}`}
            className="btn-quiet mt-3 w-full text-xs"
          >
            Compare these two →
          </Link>
        </aside>
      </div>
    </div>
  );
}

function BtnChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-surface shadow-sm text-fg" : "text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function RowSheet({ fund, final, tag }: { fund: Fund; final: number; tag: string }) {
  return (
    <Link href={`/funds/${fund.slug}`} className="mt-3 block rounded-xl border border-line p-3 transition hover:border-brand-500">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="chip">{tag}</span>
        <TypeBadge type={fund.type} />
        {fund.verified ? <VerifiedBadge /> : null}
      </div>
      <p className="mt-1.5 truncate text-sm font-semibold">{fund.name}</p>
      <p className="text-xs text-muted">
        {fund.amc} · final <span className="tnum font-semibold text-fg">{taka(final)}</span>
      </p>
    </Link>
  );
}

function Stat({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "ok" | "bad" }) {
  return (
    <div className="card !p-3">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p
        className={`mt-0.5 text-lg font-bold tnum ${
          tone === "ok" || strong ? "text-brand-600 dark:text-brand-400" : tone === "bad" ? "text-red-600 dark:text-red-400" : "text-fg"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* ── helpers ── */

function horizonMonths(h: Horizon): number {
  return h === "1y" ? 12 : h === "3y" ? 36 : h === "5y" ? 60 : 999;
}

function cagrOf(start: number, end: number, months: number): number {
  if (months <= 0 || end <= 0) return 0;
  const r = Math.pow(end / start, 12 / months) - 1;
  return isFinite(r) ? r : 0;
}

function medianOf(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** Flat certificate-equivalent curve: same pace contributions, flat monthly rate. */
function sanchBench(fund: Fund, amount: number, mode: Mode, months: number): number[] {
  void fund;
  const rM = Math.pow(1 + BENCHES[0].ann.g3 / 100, 1 / 12) - 1;
  const out: number[] = [];
  let bal = 0;
  for (let i = 1; i <= months; i++) {
    bal = mode === "sip" ? bal * (1 + rM) + amount : amount * Math.pow(1 + rM, i);
    out.push(bal);
  }
  return out;
}
