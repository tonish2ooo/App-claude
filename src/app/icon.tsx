import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Icône PWA : panier sur fond bleu de la marque.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 300,
          background: "linear-gradient(135deg, #007aff 0%, #0060d0 100%)",
        }}
      >
        🛒
      </div>
    ),
    { ...size },
  );
}
