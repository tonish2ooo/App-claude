import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Icône d'écran d'accueil iOS : même motif que l'icône PWA.
export default function AppleIcon() {
  const s = 180;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: s * 0.08,
          padding: s * 0.21,
          background: "linear-gradient(135deg, #13C8A0 0%, #0FA98A 100%)",
        }}
      >
        <div style={{ width: s * 0.137, height: s * 0.29, background: "#fff", borderRadius: s * 0.05 }} />
        <div style={{ width: s * 0.137, height: s * 0.55, background: "#fff", borderRadius: s * 0.05 }} />
        <div style={{ width: s * 0.137, height: s * 0.41, background: "#fff", borderRadius: s * 0.05 }} />
      </div>
    ),
    { ...size },
  );
}
