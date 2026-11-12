"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

type ShariahFilter = "all" | "confirmed" | "not-confirmed";

/**
 * Filters for the hub mutual-fund table. Rows are server-rendered with data
 * attributes; this toggles [hidden], so the full table still shows without
 * JavaScript.
 *
 * The Shariah filter reads only the `data-shariah` attribute the server set
 * from data/shariah-status.json (source-documented status). It never derives
 * status from a fund's name — a fund with no registry entry is
 * "not-confirmed" and is never counted as compliant.
 */
export function HubFundControls({ total }: { total: number }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | "growth" | "balanced" | "income">("");
  const [shariah, setShariah] = useState<ShariahFilter>("all");
  const [count, setCount] = useState(total);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const init = sp.get("q");
    if (init) setQ(init);
  }, []);

  useEffect(() => {
    const scope = document.getElementById("hub-fund-table");
    if (!scope) return;
    const rows = scope.querySelectorAll<HTMLElement>("tbody tr[data-fund-name]");
    const needle = q.trim().toLowerCase();
    let visible = 0;
    rows.forEach((el) => {
      const hay = `${el.dataset.fundName?.toLowerCase() ?? ""} ${el.dataset.fundAmc?.toLowerCase() ?? ""} ${el.dataset.fundAcronym?.toLowerCase() ?? ""}`;
      const okQ = !needle || hay.includes(needle);
      const okType = !type || el.dataset.fundType === type;
      const okSh =
        shariah === "all" ||
        (shariah === "confirmed" && el.dataset.fundShariah === "confirmed") ||
        (shariah === "not-confirmed" && el.dataset.fundShariah !== "confirmed");
      const show = okQ && okType && okSh;
      el.toggleAttribute("hidden", !show);
      if (show) visible += 1;
    });
    setCount(visible);
  }, [q, type, shariah]);

  return (
    <div className="card card-pad">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 focus-within:border-brand-500">
          <Search size={15} className="text-faint" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search funds, managers, acronyms…"
            aria-label="Search funds"
            className="w-full bg-transparent text-sm outline-none placeholder:text-faint"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          aria-label="Filter by fund type"
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="growth">Growth</option>
          <option value="balanced">Balanced</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-line bg-surface p-0.5" role="group" aria-label="Shariah status filter">
          {(
            [
              { v: "all", label: "All funds" },
              { v: "confirmed", label: "Shariah confirmed" },
              { v: "not-confirmed", label: "Not confirmed" },
            ] as Array<{ v: ShariahFilter; label: string }>
          ).map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setShariah(o.v)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${shariah === o.v ? "bg-brand-600 text-white" : "text-muted hover:text-fg"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted" aria-live="polite">
          Showing <strong className="text-fg">{count}</strong> of {total} funds
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        “Shariah confirmed” means an official source from the fund&apos;s own manager states the status — it is never
        inferred from the fund&apos;s name. Everything else is shown as “not confirmed”, which is not the same as
        non-compliant.
      </p>
    </div>
  );
}
