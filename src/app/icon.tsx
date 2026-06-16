import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Icône PWA : barres blanches (motif budget) sur fond bleu de la marque.
export default function Icon() {
  const s = 512;
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
          background: "linear-gradient(135deg, #007aff 0%, #0060d0 100%)",
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
