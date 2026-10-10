/**
 * Keyless live AIS (vessel) aggregator.
 *
 * Uses the Finnish Transport Infrastructure Agency's open Digitraffic marine
 * API. It is genuinely keyless, CC BY 4.0 licensed, and — verified 2026-10 —
 * sends `Access-Control-Allow-Origin: *`, so the same module works both from
 * the server aggregator and directly in the browser.
 *
 * Coverage note: this feed carries vessels transmitting within the Baltic /
 * Gulf of Finland AIS receiver network (~800-900 vessels at any moment), not
 * global traffic. There is no equivalent keyless *global* AIS source, so the
 * worldwide naval reference set stays curated — see `src/lib/mockData.ts`.
 *
 * Endpoints:
 *   /api/ais/v1/locations  — GeoJSON point positions (sog, cog, heading)
 *   /api/ais/v1/vessels    — static metadata (name, imo, callsign, shipType)
 */

export type VesselRecord = {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  /** Course over ground, degrees. */
  heading: number;
  /** Speed over ground, knots. */
  speed: number;
  /** Human-readable AIS ship-type label. */
  type: string;
  destination: string;
  callsign: string;
  imo: string;
  /** AIS type 35 = "military ops" — routed to the naval layer. */
  naval: boolean;
};

const UA = 'OsintGodsEye/2.0 (open-source OSINT dashboard)';
const TIMEOUT_MS = 12000;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      // Digitraffic asks callers to identify themselves; harmless and optional.
      'Digitraffic-User': UA,
      'User-Agent': UA,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

/**
 * AIS ship-type codes (ITU-R M.1371). Only the ranges that actually appear in
 * the Baltic feed are enumerated; anything else degrades to "Other vessel".
 */
export function aisTypeLabel(code: number | undefined): string {
  if (code === undefined || code === null) return 'Vessel';
  if (code >= 70 && code <= 79) return 'Cargo Ship';
  if (code >= 80 && code <= 89) return 'Tanker';
  if (code >= 60 && code <= 69) return 'Passenger';
  switch (code) {
    case 30:
      return 'Fishing';
    case 31:
    case 32:
      return 'Towing';
    case 33:
      return 'Dredging';
    case 34:
      return 'Diving Ops';
    case 35:
      return 'Military Ops';
    case 36:
      return 'Sailing';
    case 37:
      return 'Pleasure Craft';
    case 50:
      return 'Pilot Vessel';
    case 51:
      return 'Search & Rescue';
    case 52:
      return 'Tug';
    case 53:
      return 'Port Tender';
    case 54:
      return 'Anti-Pollution';
    case 55:
      return 'Law Enforcement';
    case 58:
      return 'Medical Transport';
    default:
      if (code >= 40 && code <= 49) return 'High-Speed Craft';
      if (code >= 90 && code <= 99) return 'Other Vessel';
      return 'Vessel';
  }
}

type LocationFeature = {
  mmsi?: number;
  geometry?: { type?: string; coordinates?: [number, number] };
  properties?: {
    mmsi?: number;
    sog?: number;
    cog?: number;
    heading?: number;
    navStat?: number;
  };
};

type LocationResponse = { features?: LocationFeature[] };

type VesselMeta = {
  mmsi?: number;
  name?: string;
  callsign?: string;
  imo?: number;
  destination?: string;
  shipType?: number;
};

export type VesselResult = { vessels: VesselRecord[]; errors: string[] };

/**
 * Fetch live positions + metadata and join them on MMSI.
 *
 * The two endpoints are independent, so metadata failure still yields usable
 * positions (vessels just show their MMSI instead of a name).
 */
export async function collectVessels(limit = 1500): Promise<VesselResult> {
  const errors: string[] = [];

  const [locRes, metaRes] = await Promise.allSettled([
    getJson<LocationResponse>('https://meri.digitraffic.fi/api/ais/v1/locations'),
    getJson<VesselMeta[]>('https://meri.digitraffic.fi/api/ais/v1/vessels'),
  ]);

  if (locRes.status === 'rejected') {
    return { vessels: [], errors: [`Digitraffic AIS locations: ${String(locRes.reason)}`] };
  }

  const meta = new Map<number, VesselMeta>();
  if (metaRes.status === 'fulfilled' && Array.isArray(metaRes.value)) {
    for (const v of metaRes.value) {
      if (typeof v?.mmsi === 'number') meta.set(v.mmsi, v);
    }
  } else if (metaRes.status === 'rejected') {
    errors.push(`Digitraffic AIS metadata: ${String(metaRes.reason)}`);
  }

  const features = locRes.value?.features ?? [];
  const out: VesselRecord[] = [];

  for (const f of features) {
    const coords = f?.geometry?.coordinates;
    const mmsi = f?.mmsi ?? f?.properties?.mmsi;
    if (!coords || !Array.isArray(coords) || coords.length < 2 || typeof mmsi !== 'number') continue;

    const lon = coords[0];
    const lat = coords[1];
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;

    const m = meta.get(mmsi);
    const heading = f.properties?.heading ?? f.properties?.cog ?? 0;
    const typeCode = m?.shipType;

    out.push({
      mmsi: String(mmsi),
      name: (m?.name || `MMSI ${mmsi}`).trim(),
      lat,
      lon,
      heading: Number.isFinite(heading) && heading >= 0 ? heading : 0,
      speed: Number.isFinite(f.properties?.sog) ? (f.properties!.sog as number) : 0,
      type: aisTypeLabel(typeCode),
      destination: (m?.destination || '').trim(),
      callsign: (m?.callsign || '').trim(),
      imo: m?.imo ? String(m.imo) : '',
      naval: typeCode === 35,
    });

    if (out.length >= limit) break;
  }

  return { vessels: out, errors };
}

/** Browser-side entry point — same feed, CORS is open, so no proxy needed. */
export async function collectClientVessels(limit = 1500): Promise<VesselResult> {
  return collectVessels(limit);
}
