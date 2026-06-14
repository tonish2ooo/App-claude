/**
 * Géocodage d'adresse via Nominatim (OpenStreetMap) — gratuit, sans clé API.
 *
 * Conforme à un usage léger/personnel (faible volume). Aucune clé ni secret :
 * l'appel part du navigateur. Renvoie null si l'adresse est introuvable ou si
 * le réseau échoue.
 */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  const q = address.trim();
  if (!q) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const first = Array.isArray(data) ? (data[0] as { lat?: string; lon?: string }) : null;
    if (!first?.lat || !first?.lon) return null;
    return {
      latitude: Number(Number(first.lat).toFixed(6)),
      longitude: Number(Number(first.lon).toFixed(6)),
    };
  } catch {
    return null;
  }
}
