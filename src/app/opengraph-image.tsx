import { ImageResponse } from "next/og";

// Branded social share card — used for both Open Graph and Twitter previews.
export const alt = "Tempo — email that thinks in time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background:
          "radial-gradient(1000px 500px at 15% 0%, #2a1a4a, transparent), radial-gradient(900px 500px at 100% 100%, #3a1340, transparent), #0b0a12",
        color: "#e4e4ee",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #8b5cf6, #d946ef)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "44px",
            fontWeight: 700,
            color: "white",
          }}
        >
          T
        </div>
        <div style={{ fontSize: "40px", fontWeight: 700 }}>Tempo</div>
      </div>

      <div
        style={{
          fontSize: "76px",
          fontWeight: 800,
          lineHeight: 1.05,
          marginTop: "48px",
          maxWidth: "900px",
        }}
      >
        Email that thinks in time.
      </div>

      <div
        style={{
          fontSize: "34px",
          color: "#a8a3c0",
          marginTop: "32px",
          maxWidth: "880px",
        }}
      >
        Gmail + Google Calendar, fused into one keyboard-first timeline. Powered
        by Corsair.
      </div>
    </div>,
    size,
  );
}
