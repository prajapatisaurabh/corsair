import { ImageResponse } from "next/og";

export const alt = "Tempo — email that thinks in time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded social card, generated at build time. Mirrors the landing aesthetic:
// violet-night background, a gradient "T" tile, wordmark, and tagline.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0a12",
          backgroundImage:
            "radial-gradient(900px 520px at 12% -10%, rgba(139,92,246,0.30), transparent 60%), radial-gradient(820px 480px at 100% 0%, rgba(217,70,239,0.20), transparent 55%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            borderRadius: 30,
            background: "linear-gradient(135deg, #8B5CF6, #D946EF)",
            boxShadow: "0 24px 70px rgba(139,92,246,0.45)",
            fontSize: 84,
            fontWeight: 700,
          }}
        >
          T
        </div>
        <div style={{ marginTop: 34, fontSize: 100, fontWeight: 700, letterSpacing: -3 }}>
          Tempo
        </div>
        <div style={{ marginTop: 6, fontSize: 38, color: "#a1a1aa" }}>
          Your inbox, on your time.
        </div>
        <div style={{ marginTop: 44, fontSize: 24, color: "#71717a" }}>
          Gmail + Google Calendar · built on Corsair
        </div>
      </div>
    ),
    { ...size },
  );
}
