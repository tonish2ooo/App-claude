"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Merchant } from "@/lib/types";

/** Marqueur HTML (pas d'image externe) — pastille colorée avec initiale. */
function pinIcon(label: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50% 50% 50% 0;background:#007aff;color:#fff;font:600 12px/1 -apple-system,sans-serif;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;"><span style="transform:rotate(45deg)">${label}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
  });
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0]!, 14);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, points]);
  return null;
}

export function MerchantsMap({ merchants }: { merchants: Merchant[] }) {
  const router = useRouter();
  const located = merchants.filter(
    (m) => m.latitude !== undefined && m.longitude !== undefined,
  );
  const points = located.map((m) => [m.latitude!, m.longitude!] as [number, number]);

  if (located.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl shadow-card" style={{ height: 220 }}>
      <MapContainer
        center={points[0]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {located.map((m) => (
          <Marker
            key={m.id}
            position={[m.latitude!, m.longitude!]}
            icon={pinIcon((m.name[0] ?? "?").toUpperCase())}
            eventHandlers={{ click: () => router.push(`/merchants/${m.id}`) }}
          >
            <Tooltip direction="top" offset={[0, -26]}>
              {m.name}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
