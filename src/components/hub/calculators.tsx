"use client";

import { useMemo, useState } from "react";
import {
  PAYOUTS_PER_YEAR,
  fdrMaturity,
  lumpFuture,
  sipFuture,
  sonchayapatraCompounding,
  sonchayapatraPayout,
  type PayoutFrequency,
} from "@/lib/hub/calc";
import { taka, takaExact, pctPlain } from "@/lib/format";
import { PastPerformanceNote } from "@/components/hub/provenance";

/**
 * Hub calculators: SIP, lump sum, FDR and Sonchayapatra. Pure math lives in
 * @/lib/hub/calc; this component only collects inputs and formats results.
 * Every result is an estimate — never a recommendation.
 */

export interface CalcTaxConfig {
  asOf: string;
  note: string;
  mutualFund: { dividendTaxPct: number; capitalGainsTaxPct: number; note: string };
  sonchayapatra: { interestTaxPct: number; note: string };
  fdr: { interestTaxPct: number; note: string };
  savingsCertificate: { interestTaxPct: number; note: string };
}

type Tab = "sip" | "lump" | "fdr" | "sonchaya";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "sip", label: "SIP (monthly)" },
  { id: "lump", label: "Lump sum" },
  { id: "fdr", label: "FDR" },
  { id: "sonchaya", label: "Sonchayapatra" },
];

function numField(
  label: string,
  value: number,
  set: (v: number) => void,
  opts: { min?: number; max?: number; step?: number; suffix?: string; hint?: string } = {}
) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      <span className="mt-1 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 focus-within:border-brand-500">
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ""}
          min={opts.min}
          max={opts.max}
          step={opts.step ?? "any"}
          onChange={(e) => set(e.target.value === "" ? NaN : Number(e.target.value))}
          className="w-full bg-transparent text-sm outline-none tnum"
        />
        {opts.suffix ? <span className="text-xs text-faint">{opts.suffix}</span> : null}
      </span>
      {opts.hint ? <span className="mt-1 block text-[11px] text-faint">{opts.hint}</span> : null}
    </label>
  );
}

function ResultRow({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-0">
      <dt className="text-sm text-muted">{k}</dt>
      <dd className={`tnum ${strong ? "text-base font-bold" : "text-sm font-medium"}`}>{v}</dd>
    </div>
  );
}

function safe(n: number): boolean {
  return Number.isFinite(n) && n >= 0;
}

export function HubCalculators({ tax }: { tax: CalcTaxConfig }) {
  const [tab, setTab] = useState<Tab>("sip");

  // SIP inputs
  const [sipMonthly, setSipMonthly] = useState(10000);
  const [sipRate, setSipRate] = useState(8);
  const [sipYears, setSipYears] = useState(10);
  const [sipStep, setSipStep] = useState(0);

  // Lump sum inputs
  const [lumpAmount, setLumpAmount] = useState(100000);
  const [lumpRate, setLumpRate] = useState(8);
  const [lumpYears, setLumpYears] = useState(10);

  // FDR inputs
  const [fdrPrincipal, setFdrPrincipal] = useState(100000);
  const [fdrRate, setFdrRate] = useState(6.5);
  const [fdrYears, setFdrYears] = useState(1);
  const [fdrCompounds, setFdrCompounds] = useState<1 | 2 | 4 | 12>(12);

  // Sonchayapatra inputs
  const [scPrincipal, setScPrincipal] = useState(100000);
  const [scRate, setScRate] = useState(11.28);
  const [scYears, setScYears] = useState(5);
  const [scFreq, setScFreq] = useState<PayoutFrequency>("quarterly");
  const [scReinvest, setScReinvest] = useState(false);

  const sip = useMemo(() => {
    if (!safe(sipMonthly) || !safe(sipYears) || !Number.isFinite(sipRate)) return null;
    try {
      return sipFuture(sipMonthly, sipRate, sipYears, safe(sipStep) ? sipStep : 0);
    } catch {
      return null;
    }
  }, [sipMonthly, sipRate, sipYears, sipStep]);

  const lump = useMemo(() => {
    if (!safe(lumpAmount) || !safe(lumpYears) || !Number.isFinite(lumpRate)) return null;
    try {
      return lumpFuture(lumpAmount, lumpRate, lumpYears);
    } catch {
      return null;
    }
  }, [lumpAmount, lumpRate, lumpYears]);

  const fdr = useMemo(() => {
    if (!safe(fdrPrincipal) || !safe(fdrYears) || !Number.isFinite(fdrRate)) return null;
    try {
      return fdrMaturity(fdrPrincipal, fdrRate, fdrYears, fdrCompounds, tax.fdr.interestTaxPct);
    } catch {
      return null;
    }
  }, [fdrPrincipal, fdrRate, fdrYears, fdrCompounds, tax.fdr.interestTaxPct]);

  const sc = useMemo(() => {
    if (!safe(scPrincipal) || !safe(scYears) || !Number.isFinite(scRate)) return null;
    try {
      const fn = scReinvest ? sonchayapatraCompounding : sonchayapatraPayout;
      return fn(scPrincipal, scRate, scYears, scFreq, tax.sonchayapatra.interestTaxPct);
    } catch {
      return null;
    }
  }, [scPrincipal, scRate, scYears, scFreq, scReinvest, tax.sonchayapatra.interestTaxPct]);

  return (
    <div className="card card-pad">
      <div className="flex flex-wrap gap-1 rounded-full border border-line bg-surface p-1" role="tablist" aria-label="Calculator type">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === t.id ? "bg-brand-600 text-white" : "text-muted hover:text-fg"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sip" ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {numField("Monthly contribution", sipMonthly, setSipMonthly, { min: 0, suffix: "৳" })}
            {numField("Expected annual return", sipRate, setSipRate, { min: 0, max: 30, step: 0.1, suffix: "%", hint: "An assumption, not a promise." })}
            {numField("Years", sipYears, setSipYears, { min: 0, max: 50, step: 1 })}
            {numField("Annual step-up", sipStep, setSipStep, { min: 0, max: 50, step: 1, suffix: "%", hint: "Increase the contribution each year (0 = none)." })}
          </div>
          <div>
            {sip ? (
              <>
                <dl>
                  <ResultRow k="Total contributed" v={takaExact(sip.invested)} />
                  <ResultRow k="Estimated future value" v={takaExact(sip.future)} strong />
                  <ResultRow k="Estimated gain" v={takaExact(sip.gain)} />
                </dl>
                <p className="mt-3 text-xs text-faint">
                  Contributions are made at the start of each month and compounded monthly at a constant assumed rate.
                  Real fund returns vary and can be negative.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">Enter valid non-negative numbers to see the estimate.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === "lump" ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {numField("Investment", lumpAmount, setLumpAmount, { min: 0, suffix: "৳" })}
            {numField("Expected annual return", lumpRate, setLumpRate, { min: 0, max: 30, step: 0.1, suffix: "%", hint: "An assumption, not a promise." })}
            {numField("Years", lumpYears, setLumpYears, { min: 0, max: 50, step: 1 })}
          </div>
          <div>
            {lump ? (
              <>
                <dl>
                  <ResultRow k="Invested" v={takaExact(lump.invested)} />
                  <ResultRow k="Estimated future value" v={takaExact(lump.future)} strong />
                  <ResultRow k="Estimated gain" v={takaExact(lump.gain)} />
                </dl>
                <p className="mt-3 text-xs text-faint">
                  Compounded monthly at a constant assumed rate for illustration. Mutual-fund returns are not fixed and
                  this ignores fees, taxes and dividend distributions.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">Enter valid non-negative numbers to see the estimate.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === "fdr" ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {numField("Principal", fdrPrincipal, setFdrPrincipal, { min: 0, suffix: "৳" })}
            {numField("Annual interest rate", fdrRate, setFdrRate, { min: 0, max: 30, step: 0.1, suffix: "%" })}
            {numField("Years", fdrYears, setFdrYears, { min: 0, max: 25, step: 1 })}
            <label className="block">
              <span className="text-xs font-medium text-muted">Compounding</span>
              <select
                value={fdrCompounds}
                onChange={(e) => setFdrCompounds(Number(e.target.value) as 1 | 2 | 4 | 12)}
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm"
              >
                <option value={1}>Yearly</option>
                <option value={2}>Half-yearly</option>
                <option value={4}>Quarterly</option>
                <option value={12}>Monthly</option>
              </select>
            </label>
          </div>
          <div>
            {fdr ? (
              <>
                <dl>
                  <ResultRow k="Principal" v={takaExact(fdr.principal)} />
                  <ResultRow k="Gross interest (before tax)" v={takaExact(fdr.grossInterest)} />
                  <ResultRow k={`Estimated tax (TDS, ${pctPlain(tax.fdr.interestTaxPct)})`} v={`− ${takaExact(fdr.tax)}`} />
                  <ResultRow k="Estimated maturity value" v={takaExact(fdr.netMaturity)} strong />
                </dl>
                <p className="mt-3 text-xs text-faint">
                  Tax is applied to the interest at the configured rate ({pctPlain(tax.fdr.interestTaxPct)}, as of{" "}
                  {tax.asOf}) as an estimate; actual TDS depends on filer status and the issuer&apos;s rules. Rates are
                  assumptions — check the bank&apos;s own published rate sheet.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">Enter valid non-negative numbers to see the estimate.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === "sonchaya" ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {numField("Investment", scPrincipal, setScPrincipal, { min: 0, suffix: "৳" })}
            {numField("Annual interest rate", scRate, setScRate, { min: 0, max: 30, step: 0.01, suffix: "%" })}
            {numField("Years", scYears, setScYears, { min: 0, max: 25, step: 1 })}
            <label className="block">
              <span className="text-xs font-medium text-muted">Payout frequency</span>
              <select
                value={scFreq}
                onChange={(e) => setScFreq(e.target.value as PayoutFrequency)}
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half-yearly">Half-yearly</option>
                <option value="annual">Annual</option>
              </select>
            </label>
            <label className="col-span-full inline-flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-muted">
              <input type="checkbox" checked={scReinvest} onChange={(e) => setScReinvest(e.target.checked)} className="h-3.5 w-3.5 accent-brand-600" />
              Reinvest the interest (compound to maturity) instead of taking payouts
            </label>
          </div>
          <div>
            {sc ? (
              <>
                <dl>
                  <ResultRow k="Investment" v={takaExact(sc.principal)} />
                  {scReinvest ? (
                    <ResultRow k="Estimated maturity value (after tax)" v={takaExact(sc.maturityValue)} strong />
                  ) : (
                    <>
                      <ResultRow k={`Payout per period (${scFreq}, ${PAYOUTS_PER_YEAR[scFreq]}×/yr)`} v={takaExact(sc.payoutPerPeriod)} />
                      <ResultRow k={`Total payouts over ${scYears} yr`} v={`${sc.payoutCount}`} />
                      <ResultRow k="Gross interest" v={takaExact(sc.grossInterest)} />
                      <ResultRow k={`Estimated tax (TDS, ${pctPlain(tax.sonchayapatra.interestTaxPct)})`} v={`− ${takaExact(sc.tax)}`} />
                      <ResultRow k="Total cash back (principal + net interest)" v={takaExact(sc.totalValue)} strong />
                    </>
                  )}
                  {scReinvest ? (
                    <ResultRow k="Estimated net interest after tax" v={takaExact(sc.netInterest)} />
                  ) : null}
                </dl>
                <p className="mt-3 text-xs text-faint">
                  {scReinvest
                    ? "Compounding model: interest stays invested and is taxed once at maturity."
                    : "Payout model: interest is paid out at the selected frequency and the principal is returned at maturity — savings schemes do not compound unless you reinvest."}{" "}
                  Tax at {pctPlain(tax.sonchayapatra.interestTaxPct)} (as of {tax.asOf}) is an estimate; actual rules
                  depend on the instrument and your tax status. Confirm the rate with the official source before
                  investing.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">Enter valid non-negative numbers to see the estimate.</p>
            )}
          </div>
        </div>
      ) : null}

      <PastPerformanceNote className="mt-4" />
    </div>
  );
}
