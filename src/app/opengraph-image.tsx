import { ImageResponse } from "next/og";
import { ALL_FUNDS, TOTAL_AUM_CR } from "@/lib/returns";
import { site } from "@/lib/site";

export const alt = "Profithisab — real returns of Bangladeshi mutual funds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const leaders = ALL_FUNDS.filter((f) => f.verified).slice(0, 3);
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
            {`${ALL_FUNDS.length} open-end funds replayed from published NAV history · one fixed 3-year window · dividends reinvested`}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {leaders.map((f) => (
              <div key={f.slug} style={{ display: "flex", flexDirection: "column", fontSize: 16, color: "#c4d2cc", border: "1px solid #29433a", borderRadius: 12, padding: "10px 16px" }}>
                <span style={{ color: "#eaf3ef" }}>{f.acronym}</span>
                <span style={{ color: "#6ee7b7" }}>{`${f.fee.toFixed(2)}% fee · verified`}</span>
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", fontSize: 16, color: "#c4d2cc", border: "1px solid #29433a", borderRadius: 12, padding: "10px 16px" }}>
              <span>Tracked assets</span>
              <span style={{ color: "#6ee7b7" }}>{`৳${Math.round(TOTAL_AUM_CR)} cr`}</span>
            </div>
          </div>
          <div style={{ fontSize: 18, color: "#6b7d75" }}>{`Profithisab.com · figures as of ${site.asOfLong}`}</div>
        </div>
      </div>
    ),
    size
  );
}
