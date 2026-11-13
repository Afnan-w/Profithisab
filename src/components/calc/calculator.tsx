"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { CalcFund, CalculatorMode, DividendMode, PeriodId } from "@/lib/types";
import { lumpSum, sipRun } from "@/lib/calc";
import { PERIODS, periodYears } from "@/lib/config";
import { MultiLineChart } from "@/components/charts/line-chart";
import { taka, takaExact, pct, maybeBn, fullDate } from "@/lib/format";
import { TypeBadge, QualityBadge } from "@/components/ui/badge";

/**
 * Client calculator. It receives a compact, serialisable payload from the
 * server and recomputes every number in the browser with the same pure
 * functions the pages use. No filesystem imports here.
 */

export interface CalcBenchmark {
  id: string;
  name: string;
  shortName: string;
  annualRate: number | null;
  status: "verified" | "approximate" | "unavailable";
  color: string;
}

interface Props {
  funds: CalcFund[];
  benchmarks: CalcBenchmark[];
  latestNavDate: string | null;
  isDemo: boolean;
}

const PRESETS = [1000, 5000, 10000, 25000];
const HORIZONS: Array<{ id: PeriodId; label: string }> = [
  { id: "1y", label: "1 yr" },
  { id: "3y", label: "3 yr" },
  { id: "5y", label: "5 yr" },
  { id: "max", label: "Since launch" },
];

interface CalcRow {
  fund: CalcFund;
  final: number;
  invested: number;
  labels: string[];
  values: number[];
  irr: number | null;
  months: number;
}

export default function Calculator({ funds, benchmarks, latestNavDate, isDemo }: Props) {
  // The input keeps its own text so the field can be cleared and retyped;
  // the numeric amount falls back to the last valid value while editing.
  const [amountText, setAmountText] = useState("5000");
  const lastValidAmount = useRef(5000);
  const [mode, setMode] = useState<CalculatorMode>("sip");
  const [horizon, setHorizon] = useState<PeriodId>("3y");
  const [shariahOnly, setShariahOnly] = useState(false);
  const [dividends, setDividends] = useState<DividendMode>("reinvest");
  const [bangla, setBangla] = useState(false);
  const [copied, setCopied] = useState(false);
  const initialised = useRef(false);

  // Read shareable state from the URL without requiring a Suspense boundary.
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    const sp = new URLSearchParams(window.location.search);
    const a = Number(sp.get("amount"));
    if (Number.isFinite(a) && a >= 100) setAmountText(String(Math.min(10_000_000, a)));
    const m = sp.get("mode");
    if (m === "lump" || m === "sip") setMode(m);
    const h = sp.get("h");
    if (h && PERIODS.some((p) => p.id === h)) setHorizon(h as PeriodId);
    if (sp.get("div") === "cash") setDividends("cash");
    if (sp.get("shariah") === "1") setShariahOnly(true);
    if (sp.get("bn") === "1") setBangla(true);
  }, []);

  // Keep the address bar shareable without adding history entries.
  const parsedAmount = Number(amountText);
  const amountValid =
    Number.isFinite(parsedAmount) && parsedAmount >= 100 && parsedAmount <= 10_000_000;
  const amount = amountValid ? parsedAmount : lastValidAmount.current;

  useEffect(() => {
    if (!initialised.current) return;
    if (amountValid) lastValidAmount.current = amount;
    const sp = new URLSearchParams();
    sp.set("amount", String(amount));
    sp.set("mode", mode);
    sp.set("h", horizon);
    sp.set("div", dividends);
    if (shariahOnly) sp.set("shariah", "1");
    if (bangla) sp.set("bn", "1");
    const url = `${window.location.pathname}?${sp.toString()}${window.location.hash}`;
    window.history.replaceState(null, "", url);
  }, [amount, mode, horizon, dividends, shariahOnly, bangla]);

  const shariahCount = funds.filter((f) => f.shariah).length;

  const result = useMemo(() => {
    const pool = funds.filter((f) => (shariahOnly ? f.shariah : true));
    const years = periodYears(horizon);
    const rows: CalcRow[] = [];

    for (const fund of pool) {
      const series = { nav: fund.months, dividends: fund.dividends };
      const run =
        mode === "sip"
          ? sipRun(series, amount, years, dividends)
          : lumpSum(series, amount, years, dividends);
      if (!run) continue;
      const r = run.result;
      rows.push({
        fund,
        final: "final" in r ? r.final : r.growth * amount,
        invested: "invested" in r ? r.invested : amount,
        irr: "xirr" in r ? r.xirr : r.cagr,
        months: "months" in r ? r.months : Math.round(r.days / 30.4375),
        labels: run.path.map((p) => p.date.slice(0, 7)),
        values: run.path.map((p) => p.value),
      });
    }

    if (!rows.length) return null;
    const sorted = [...rows].sort((a, b) => a.final - b.final);
    const medianRow = sorted[Math.floor((sorted.length - 1) / 2)];
    const bestRow = sorted[sorted.length - 1];
    const worstRow = sorted[0];
    return { rows: sorted, medianRow, bestRow, worstRow };
  }, [funds, amount, mode, horizon, shariahOnly, dividends]);

  if (!funds.length) {
    return (
      <p className="text-sm text-muted">
        No fund history is loaded yet. The data files in <code>/data</code> are valid but empty — see{" "}
        <Link href="/data-status" className="underline decoration-dotted hover:text-fg">data status</Link>.
      </p>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-line bg-raised p-4 text-sm text-muted">
        <p className="font-medium text-fg">Not enough history for that selection.</p>
        <p className="mt-1">
          This build has {funds.length} fund{funds.length === 1 ? "" : "s"}, but none has enough published NAV history
          for a {horizon === "max" ? "since-launch" : horizon} replay at this amount. Try the 1-year window, or a
          smaller monthly amount.
        </p>
      </div>
    );
  }

  const { rows, medianRow, bestRow, worstRow } = result;
  const chartMonths = medianRow.labels.length;
  const investedLine = investedSeries(mode, amount, chartMonths);
  const bench = benchmarks.find((b) => b.status !== "unavailable" && b.annualRate !== null) ?? null;
  const benchLine = bench
    ? fixedRateSeries(mode, amount, chartMonths, bench.annualRate ?? 0)
    : [];
  const medianIrr = medianOf(rows.map((r) => r.irr).filter((v): v is number => v !== null));
  const beatsBench =
    bench && bench.annualRate !== null
      ? rows.filter((r) => r.irr !== null && r.irr * 100 > bench.annualRate!).length
      : null;

  const chartSeries = [
    { name: `${medianRow.fund.name} (median outcome)`, values: medianRow.values, color: "#059669", area: true },
    ...(benchLine.length
      ? [{ name: `${bench!.shortName} at ${bench!.annualRate!.toFixed(2)}%/yr`, values: benchLine, color: bench!.color, dashed: true }]
      : []),
    { name: "Money you put in", values: investedLine, color: "#94a3b8", dashed: true },
  ];

  const show = (value: string) => maybeBn(value, bangla);

  const share = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard permission denied: the URL is still in the address bar.
      setCopied(false);
    }
  };

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
                placeholder="5000"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                className="w-28 bg-transparent px-2 py-2.5 text-lg font-semibold tnum outline-none"
                inputMode="numeric"
                aria-describedby="calc-amount-hint"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmountText(String(p))}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    amount === p
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "border-line text-muted hover:border-line-strong hover:text-fg"
                  }`}
                >
                  {show(`৳${p >= 1000 ? `${p / 1000}k` : p}`)}
                </button>
              ))}
            </div>
            {!amountValid ? (
              <p id="calc-amount-hint" className="w-full text-[11px] text-faint">
                Showing results for the last valid amount. Enter a figure between ৳100 and ৳1 crore.
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-xl border border-line bg-raised p-1" role="group" aria-label="How you would invest">
            <BtnChip active={mode === "sip"} onClick={() => setMode("sip")}>Every month</BtnChip>
            <BtnChip active={mode === "lump"} onClick={() => setMode("lump")}>One time</BtnChip>
          </div>
          <div className="inline-flex flex-wrap rounded-xl border border-line bg-raised p-1" role="group" aria-label="How long you stayed invested">
            {HORIZONS.map((h) => (
              <BtnChip key={h.id} active={horizon === h.id} onClick={() => setHorizon(h.id)}>
                {h.label}
              </BtnChip>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer select-none items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={shariahOnly}
            onChange={(e) => setShariahOnly(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          Shariah-compliant only
          <span className="text-faint">{show(String(shariahCount))} funds</span>
        </label>
        <div className="inline-flex rounded-xl border border-line bg-raised p-1" role="group" aria-label="What happens to dividends">
          <BtnChip active={dividends === "reinvest"} onClick={() => setDividends("reinvest")}>Reinvest dividends</BtnChip>
          <BtnChip active={dividends === "cash"} onClick={() => setDividends("cash")}>Keep cash</BtnChip>
        </div>
        <label className="inline-flex cursor-pointer select-none items-center gap-1.5 rounded-xl border border-line bg-raised px-3 py-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={bangla}
            onChange={(e) => setBangla(e.target.checked)}
            className="h-3.5 w-3.5 accent-brand-600"
          />
          বাংলা numerals
        </label>
      </div>

      {/* ── Results ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <MultiLineChart
            title={
              mode === "sip"
                ? `${takaExact(amount)}/month — what it became`
                : `${takaExact(amount)} once — what it became`
            }
            series={chartSeries}
            labels={medianRow.labels}
            formatTick={(v) => show(taka(v, { tight: true }))}
            note={`Dividends ${dividends === "reinvest" ? "reinvested" : "kept as cash"} · latest NAV ${fullDate(latestNavDate)}`}
          />

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-live="polite">
            <Stat label={mode === "sip" ? "You put in" : "You started with"} value={show(takaExact(medianRow.invested))} />
            <Stat label="It would be worth" value={show(takaExact(medianRow.final))} strong />
            <Stat
              label="Profit / loss"
              value={show(takaExact(medianRow.final - medianRow.invested))}
              tone={medianRow.final >= medianRow.invested ? "ok" : "bad"}
            />
            <Stat
              label={mode === "sip" ? "SIP return / year" : "Return / year"}
              value={show(pct(medianIrr, { digits: 1 }))}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="card !p-3">
              <p className="text-[11px] font-medium text-muted">Best outcome in this filter</p>
              <Link href={`/funds/${bestRow.fund.slug}`} className="mt-0.5 block truncate text-sm font-semibold hover:text-brand-700 dark:hover:text-brand-300">
                {bestRow.fund.name}
              </Link>
              <p className="text-xs text-muted">
                {show(taka(bestRow.final))} · {show(pct(bestRow.irr))} a year
              </p>
            </div>
            <div className="card !p-3">
              <p className="text-[11px] font-medium text-muted">Weakest outcome in this filter</p>
              <Link href={`/funds/${worstRow.fund.slug}`} className="mt-0.5 block truncate text-sm font-semibold hover:text-brand-700 dark:hover:text-brand-300">
                {worstRow.fund.name}
              </Link>
              <p className="text-xs text-muted">
                {show(taka(worstRow.final))} · {show(pct(worstRow.irr))} a year
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-faint">
            The chart shows the <strong>median</strong> of {show(String(rows.length))} funds that passed the filter —
            the middle outcome, not a cherry-picked leader. The grey dashed line is the money you paid in.{" "}
            {beatsBench !== null ? (
              <>
                {show(String(beatsBench))} of {show(String(rows.length))} beat {bench?.shortName} at{" "}
                {show(`${bench?.annualRate?.toFixed(2)}%/yr`)} over the same window.{" "}
              </>
            ) : null}
            {dividends === "cash"
              ? "Cash dividends are not reinvested, so this is a lower total-return figure."
              : "Dividends are reinvested at the first published NAV on or after the record date."}{" "}
            {isDemo ? "Demo data — not published fund history. " : ""}
            Past NAVs do not predict future NAVs.
          </p>

          {bench && bench.status === "approximate" ? (
            <p className="mt-1 text-[11px] text-faint">
              {bench.name} is an approximate flat rate: {bench.annualRate?.toFixed(2)}%/yr. Not an official quoted product rate.
            </p>
          ) : null}
        </div>

        <aside className="card card-pad h-fit">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Median &amp; best of the filter</p>
          <RowSheet fund={medianRow.fund} final={medianRow.final} tag="Median" bangla={bangla} />
          <RowSheet fund={bestRow.fund} final={bestRow.final} tag="Best" bangla={bangla} />
          <div className="mt-3 grid gap-2">
            <Link
              href={`/compare?funds=${bestRow.fund.slug},${medianRow.fund.slug}`}
              className="btn-quiet w-full text-xs"
            >
              Compare these two →
            </Link>
            <button type="button" onClick={share} className="btn-quiet w-full text-xs" aria-live="polite">
              {copied ? "Link copied ✓" : "Copy this calculation"}
            </button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            Share the address bar or this button — the link carries your amount, mode, window and dividend choice.
          </p>
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
      aria-pressed={active}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-surface shadow-sm text-fg" : "text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function RowSheet({ fund, final, tag, bangla }: { fund: CalcFund; final: number; tag: string; bangla: boolean }) {
  return (
    <Link href={`/funds/${fund.slug}`} className="mt-3 block rounded-xl border border-line p-3 transition hover:border-brand-500">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="chip">{tag}</span>
        <TypeBadge type={fund.type} shariah={fund.shariah} />
        <QualityBadge completeness={fund.completeness} stale={fund.isStale} />
      </div>
      <p className="mt-1.5 truncate text-sm font-semibold">{fund.name}</p>
      <p className="text-xs text-muted">
        {fund.amc} · final <span className="tnum font-semibold text-fg">{maybeBn(taka(final), bangla)}</span>
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

function medianOf(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)];
}

/** The money paid in, indexed to the same months as the fund path. */
function investedSeries(mode: CalculatorMode, amount: number, months: number): number[] {
  if (mode === "lump") return Array.from({ length: months }, () => amount);
  return Array.from({ length: months }, (_, i) => amount * (i + 1));
}

/** Flat-rate equivalent, indexed to the same months as the fund path. */
function fixedRateSeries(mode: CalculatorMode, amount: number, months: number, annualPct: number): number[] {
  const rM = Math.pow(1 + annualPct / 100, 1 / 12) - 1;
  const out: number[] = [];
  if (mode === "lump") {
    for (let i = 1; i <= months; i++) out.push(amount * Math.pow(1 + rM, i));
  } else {
    let bal = 0;
    for (let i = 1; i <= months; i++) {
      bal = bal * (1 + rM) + amount;
      out.push(bal);
    }
  }
  return out;
}
