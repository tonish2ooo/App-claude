import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Icône d'écran d'accueil iOS : même motif que l'icône PWA.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 110,
          background: "linear-gradient(135deg, #007aff 0%, #0060d0 100%)",
        }}
      >
        🛒
      </div>
    ),
    { ...size },
  );
}
