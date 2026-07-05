import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ChainRoute AI — Decentralized Logistics Intelligence Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0b0f1a 0%, #16122b 55%, #0a1f1c 100%)",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(135deg,#6d4bff,#a855f7,#26cbb0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            🧭
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "white", fontSize: 34, fontWeight: 700 }}>ChainRoute AI</span>
            <span style={{ color: "#8b93a7", fontSize: 18, letterSpacing: 4 }}>
              LOGISTICS INTELLIGENCE
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span
            style={{
              color: "white",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            The decentralized brain for modern logistics
          </span>
          <span style={{ color: "#a7b0c2", fontSize: 28, maxWidth: 880 }}>
            Immutable shipment ledger · AI insights · fleet, warehouse & route intelligence
          </span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["Blockchain Simulation Mode", "AI Analytics", "Enterprise-ready"].map((t) => (
            <div
              key={t}
              style={{
                color: "#c9d1e0",
                fontSize: 22,
                padding: "10px 22px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
