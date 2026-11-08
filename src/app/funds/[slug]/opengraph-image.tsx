import { ImageResponse } from "next/og";
import { getFund, fundSeed, metricsFor } from "@/lib/returns";
import { site } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Bangladeshi mutual fund return card — Profithisab";

export default function OgImage({ params }: { params: { slug: string } }) {
  const fund = getFund(params.slug);
  const seed = fundSeed(params.slug);
  const m = fund ? metricsFor(params.slug) : null;
  const name = fund?.name ?? "Profithisab";
  const amc = fund?.amc ?? "";
  const g3 = m ? m.g3 ?? m.gMax ?? 0 : 0;
  const became = fund ? Math.round(100000 * Math.pow(1 + (m?.g3 ?? m?.gMax ?? 0), m?.g3 !== null ? 3 : (fund.series.length - 1) / 12)) : 0;
  const sub =
    seed && seed.g3 !== null
      ? `৳${became.toLocaleString("en-IN")} — 3 years, dividends reinvested · ${seed.worstFall ?? 0}% worst fall · ${fund?.fee.toFixed(2)}% fee`
      : `Since-launch total return ${g3 >= 0 ? "+" : ""}${(g3 * 100).toFixed(2)}%/yr · ${fund?.fee.toFixed(2)}% fee`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0a0f0d 0%, #06281f 100%)",
          padding: 64,
          color: "#eaf3ef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: "#94a59d" }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff" }}>৳</div>
          Profithisab
          <span style={{ color: "#40564d" }}>{`· ${amc}`}</span>
          {fund?.shariah ? <span style={{ color: "#6ee7b7", border: "1px solid #2a5c47", borderRadius: 999, padding: "2px 12px", fontSize: 16 }}>Shariah</span> : null}
          {fund?.verified ? <span style={{ color: "#fbbf24", border: "1px solid #5c4a1a", borderRadius: 999, padding: "2px 12px", fontSize: 16 }}>AMC-Verified</span> : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.15, maxWidth: 980 }}>{name}</div>
          <div style={{ fontSize: 30, color: "#94a59d", marginTop: 14 }}>৳1,00,000 replayed from published NAV history</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 20, color: "#6b7d75" }}>
              {m && m.g3 !== null ? "3-year, per year" : "since our data window opens"}
            </div>
            <div style={{ fontSize: 96, fontWeight: 800, color: g3 >= 0 ? "#34d399" : "#f87171", lineHeight: 1 }}>
              {`${g3 >= 0 ? "+" : ""}${(g3 * 100).toFixed(2)}%`}
            </div>
            <div style={{ fontSize: 22, color: "#c4d2cc", marginTop: 10 }}>{sub}</div>
          </div>
          <div style={{ fontSize: 18, color: "#6b7d75" }}>{`Profithisab.com/funds/${params.slug} · ${site.asOfLong}`}</div>
        </div>
      </div>
    ),
    size
  );
}
