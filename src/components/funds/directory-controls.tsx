"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

export interface FilterMeta {
  amcs: Array<{ slug: string; name: string; count: number }>;
  total: number;
}

/**
 * Directory filters that progressively enhance a fully server-rendered list:
 * they toggle [hidden] on cards by data attributes, so the page still shows
 * everything meaningful without JavaScript.
 */
export function DirectoryControls({ amcs, total }: FilterMeta) {
  const [q, setQ] = useState("");
  const [amc, setAmc] = useState("");
  const [type, setType] = useState<"" | "growth" | "balanced" | "income">("");
  const [shariah, setShariah] = useState(false);
  const [completeOnly, setCompleteOnly] = useState(false);
  const [count, setCount] = useState(total);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const init = sp.get("q");
    if (init) setQ(init);
  }, []);

  useEffect(() => {
    const scope = document.querySelector("#fund-directory");
    if (!scope) return;
    const cards = scope.querySelectorAll<HTMLElement>("[data-fund-id]");
    let visible = 0;
    const needle = q.trim().toLowerCase();
    cards.forEach((el) => {
      const hay = `${el.dataset.fundName?.toLowerCase()} ${el.dataset.fundAmc?.toLowerCase()} ${el.dataset.fundAcronym?.toLowerCase()}`;
      const okQ = !needle || hay.includes(needle);
      const okAmc = !amc || el.dataset.fundAmcSlug === amc;
      const okType = !type || el.dataset.fundType === type;
      const okSh = !shariah || el.dataset.fundShariah === "1";
      const okComplete = !completeOnly || (el.dataset.fundQuality === "complete" && el.dataset.fundStale !== "1");
      const show = okQ && okAmc && okType && okSh && okComplete;
      el.toggleAttribute("hidden", !show);
      if (show) visible += 1;
    });
    setCount(visible);
  }, [q, amc, type, shariah, completeOnly]);

  const sectionFor = useMemo(() => type || "all", [type]);

  return (
    <div ref={rootRef} className="card card-pad elev">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand">
          <Search size={15} className="text-faint" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search funds, AMCs, acronyms…"
            aria-label="Search funds"
            className="w-full bg-transparent text-sm outline-none placeholder:text-faint"
          />
        </div>
        <select
          value={amc}
          onChange={(e) => setAmc(e.target.value)}
          aria-label="Filter by asset manager"
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm"
        >
          <option value="">All AMCs ({total})</option>
          {amcs.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name} ({a.count})
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Seg set={setType} value={type} options={[
          { v: "", label: "All types" },
          { v: "growth", label: `Growth` },
          { v: "balanced", label: `Balanced` },
          { v: "income", label: `Income` },
        ]} />
        <label className="inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium">
          <input type="checkbox" checked={shariah} onChange={(e) => setShariah(e.target.checked)} className="h-3.5 w-3.5 accent-brand-600" />
          Shariah only
        </label>
        <label className="inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium">
          <input type="checkbox" checked={completeOnly} onChange={(e) => setCompleteOnly(e.target.checked)} className="h-3.5 w-3.5 accent-brand-600" />
          Complete &amp; current only
        </label>
        <span className="ml-auto text-xs text-muted" aria-live="polite">
          Showing <strong className="text-fg">{count}</strong> of {total} funds
        </span>
      </div>
    </div>
  );
}

function Seg<T extends string>({
  set,
  value,
  options,
}: {
  set: (v: T) => void;
  value: T;
  options: Array<{ v: T; label: string }>;
}) {
  return (
    <div className="inline-flex rounded-full border border-line bg-surface p-0.5" role="group">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => set(o.v)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${value === o.v ? "bg-brand-600 text-white" : "text-muted hover:text-fg"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
