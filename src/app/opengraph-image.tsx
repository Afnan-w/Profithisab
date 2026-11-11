import { ImageResponse } from "next/og";
import { IS_DEMO, META, STATS, metricsFor, rankedFunds } from "@/lib/returns";
import { site } from "@/lib/site";
import { fullDate, pct } from "@/lib/format";

export const alt = "Profithisab — real returns of Bangladeshi mutual funds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const leaders = rankedFunds("3y").slice(0, 3);
  const host = new URL(site.url).host;

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
          padding: 56,
          color: "#eaf3ef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "#fff" }}>৳</div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>Profithisab</div>
          <div style={{ fontSize: 18, color: "#6ee7b7", marginLeft: 8 }}>Real returns of Bangladeshi mutual funds</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>
            If you had invested ৳10,000 — how much?
          </div>
          <div style={{ fontSize: 26, color: "#94a59d", marginTop: 18, maxWidth: 900 }}>
            {`${STATS.funds} funds in this build · NAV data through ${fullDate(META.latestNavDate)} · every gap shown`}
          </div>
          {IS_DEMO ? (
            <div style={{ marginTop: 14, display: "flex", fontSize: 20, color: "#fbbf24" }}>
              Demo data — not published fund history
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {leaders.map((f) => (
              <div key={f.slug} style={{ display: "flex", flexDirection: "column", fontSize: 16, color: "#c4d2cc", border: "1px solid #29433a", borderRadius: 12, padding: "10px 16px" }}>
                <span style={{ color: "#eaf3ef" }}>{f.acronym}</span>
                <span style={{ color: "#6ee7b7" }}>{pct(metricsFor(f.slug).g3)} · 3-yr / yr</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 18, color: "#6b7d75" }}>{`${host} · latest NAV ${fullDate(META.latestNavDate)}`}</div>
        </div>
      </div>
    ),
    size
  );
}
