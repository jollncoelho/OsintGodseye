import type { OrbitalElements } from '@/lib/orbital';
import type { Satellite, SatelliteGroup } from '@/types';
import { propagate } from '@/lib/orbital';

const EARTH_RADIUS_KM = 6371;
const MU = 398600.4418; // km^3/s^2
const DEG = Math.PI / 180;

type Constellation = {
  category: string;
  group: SatelliteGroup;
  operator: string;
  purpose: string;
  count: number;
  /** Inclination in degrees. */
  inc: number;
  /** Circular altitude in km (semi-major axis = 6371 + alt). */
  alt: number;
  ecc?: number;
  /** First right ascension of ascending node, degrees. */
  raan: number;
  /** Right-ascension spread across the constellation, degrees. */
  raanSpread?: number;
  /** Mean-anomaly spread across the constellation, degrees. */
  phaseSpread?: number;
};

/**
 * Curated constellation catalogue. Elements are representative circular
 * orbits (not live TLEs) — good enough for a real-time ground-track picture,
 * which is what the dashboard needs. Grouped exactly like the OSIRIS layer
 * taxonomy: comms / military / navigation / earth observation.
 */
const CONSTELLATIONS: Constellation[] = [
  /* ---------------- Navigation (GNSS) ---------------- */
  { category: 'GPS III', group: 'navigation', operator: 'US Space Force', purpose: 'GNSS positioning', count: 6, inc: 55, alt: 20200, raan: 10, raanSpread: 60, phaseSpread: 60 },
  { category: 'Galileo', group: 'navigation', operator: 'EU / EUSPA', purpose: 'GNSS positioning', count: 4, inc: 56, alt: 23222, raan: 45, raanSpread: 90, phaseSpread: 90 },
  { category: 'GLONASS-M', group: 'navigation', operator: 'Roscosmos', purpose: 'GNSS positioning', count: 4, inc: 64.8, alt: 19130, raan: 100, raanSpread: 90, phaseSpread: 90 },
  { category: 'BeiDou-3', group: 'navigation', operator: 'CNSA', purpose: 'GNSS positioning', count: 4, inc: 55, alt: 21528, raan: 160, raanSpread: 90, phaseSpread: 90 },

  /* ---------------- Communications ---------------- */
  { category: 'Starlink', group: 'comms', operator: 'SpaceX', purpose: 'Broadband internet', count: 10, inc: 53, alt: 550, raan: 200, raanSpread: 180, phaseSpread: 36 },
  { category: 'OneWeb', group: 'comms', operator: 'Eutelsat OneWeb', purpose: 'Broadband internet', count: 4, inc: 87.9, alt: 1200, raan: 20, raanSpread: 90, phaseSpread: 90 },
  { category: 'Iridium NEXT', group: 'comms', operator: 'Iridium', purpose: 'Voice / data relay', count: 4, inc: 86.4, alt: 780, raan: 70, raanSpread: 90, phaseSpread: 90 },
  { category: 'Inmarsat', group: 'comms', operator: 'Inmarsat', purpose: 'Maritime SATCOM', count: 2, inc: 0.05, alt: 35786, raan: 15, raanSpread: 40 },
  { category: 'Intelsat', group: 'comms', operator: 'Intelsat', purpose: 'Broadcast / trunking', count: 2, inc: 0.05, alt: 35786, raan: 120, raanSpread: 40 },
  { category: 'SES', group: 'comms', operator: 'SES', purpose: 'Broadcast / trunking', count: 2, inc: 0.05, alt: 35786, raan: 250, raanSpread: 40 },
  { category: 'TDRS', group: 'comms', operator: 'NASA', purpose: 'Space relay', count: 2, inc: 14, alt: 35786, raan: 300, raanSpread: 50 },

  /* ---------------- Military / ISR ---------------- */
  { category: 'KH-11 (USA-224)', group: 'military', operator: 'NRO', purpose: 'Optical recon', count: 2, inc: 97.9, alt: 270, raan: 300, raanSpread: 30 },
  { category: 'Lacrosse-5', group: 'military', operator: 'NRO', purpose: 'SAR imaging', count: 1, inc: 57, alt: 700, raan: 40 },
  { category: 'Topaz-5', group: 'military', operator: 'NRO', purpose: 'Radar recon', count: 1, inc: 123, alt: 1100, raan: 150 },
  { category: 'Yaogan-33', group: 'military', operator: 'PLA', purpose: 'Reconnaissance', count: 2, inc: 63.4, alt: 500, raan: 200, raanSpread: 40 },
  { category: 'Ofeq-16', group: 'military', operator: 'IDF / ISA', purpose: 'Reconnaissance', count: 1, inc: 142, alt: 600, raan: 260 },
  { category: 'Helios-2B', group: 'military', operator: 'DGA (France)', purpose: 'Optical recon', count: 1, inc: 98.1, alt: 700, raan: 330 },
  { category: 'SAR-Lupe-4', group: 'military', operator: 'Bundeswehr', purpose: 'SAR imaging', count: 1, inc: 98, alt: 500, raan: 80 },
  { category: 'Cosmos-2558', group: 'military', operator: 'VKS (Russia)', purpose: 'Inspector / ISR', count: 1, inc: 97.6, alt: 500, raan: 20 },
  { category: 'NROL-87', group: 'military', operator: 'NRO', purpose: 'Reconnaissance', count: 1, inc: 97, alt: 500, raan: 180 },

  /* ---------------- Earth observation / science ---------------- */
  { category: 'Sentinel-2A', group: 'earthobs', operator: 'ESA', purpose: 'Multispectral imaging', count: 1, inc: 98.62, alt: 786, raan: 60 },
  { category: 'Sentinel-2B', group: 'earthobs', operator: 'ESA', purpose: 'Multispectral imaging', count: 1, inc: 98.62, alt: 786, raan: 240 },
  { category: 'Sentinel-3A', group: 'earthobs', operator: 'ESA', purpose: 'Ocean / land colour', count: 1, inc: 98.63, alt: 814, raan: 130 },
  { category: 'Landsat-9', group: 'earthobs', operator: 'NASA / USGS', purpose: 'Land imaging', count: 1, inc: 98.2, alt: 705, raan: 190 },
  { category: 'NOAA-20', group: 'earthobs', operator: 'NOAA', purpose: 'Weather / climate', count: 1, inc: 98.7, alt: 824, raan: 300 },
  { category: 'NOAA-21', group: 'earthobs', operator: 'NOAA', purpose: 'Weather / climate', count: 1, inc: 98.7, alt: 824, raan: 310 },
  { category: 'Suomi NPP', group: 'earthobs', operator: 'NOAA / NASA', purpose: 'Weather / climate', count: 1, inc: 98.7, alt: 824, raan: 290 },
  { category: 'Terra', group: 'earthobs', operator: 'NASA', purpose: 'Climate research', count: 1, inc: 98.2, alt: 705, raan: 30 },
  { category: 'Aqua', group: 'earthobs', operator: 'NASA', purpose: 'Water cycle', count: 1, inc: 98.2, alt: 705, raan: 210 },
  { category: 'ISS (Zarya)', group: 'earthobs', operator: 'International', purpose: 'Human spaceflight', count: 1, inc: 51.64, alt: 420, raan: 210 },
  { category: 'Tiangong', group: 'earthobs', operator: 'CMSA', purpose: 'Human spaceflight', count: 1, inc: 41.47, alt: 390, raan: 40 },
  { category: 'Hubble', group: 'earthobs', operator: 'NASA / ESA', purpose: 'Space telescope', count: 1, inc: 28.47, alt: 535, raan: 85 },
];

export type SatCatalogEntry = {
  name: string;
  category: string;
  group: SatelliteGroup;
  operator: string;
  purpose: string;
  elements: OrbitalElements;
};

function periodMinutes(aKm: number): number {
  return (2 * Math.PI * Math.sqrt(aKm ** 3 / MU)) / 60;
}

/** Deterministic build — the same catalog every reload, so nothing flickers. */
function buildCatalog(): SatCatalogEntry[] {
  const out: SatCatalogEntry[] = [];
  let n = 0;

  for (const c of CONSTELLATIONS) {
    for (let i = 0; i < c.count; i++) {
      const a = EARTH_RADIUS_KM + c.alt;
      const raanDeg = c.raan + (c.raanSpread ?? 0) * (i / Math.max(1, c.count));
      const phaseDeg = (c.phaseSpread ?? 360) * (i / Math.max(1, c.count));
      out.push({
        name: c.count > 1 ? `${c.category}-${i + 1}` : c.category,
        category: c.category,
        group: c.group,
        operator: c.operator,
        purpose: c.purpose,
        elements: {
          name: c.category,
          category: c.group,
          inc: c.inc * DEG,
          raan: (raanDeg % 360) * DEG,
          ecc: c.ecc ?? (c.alt > 30000 ? 0.0002 : 0.0008),
          a,
          argp: ((i * 47) % 360) * DEG,
          M0: (phaseDeg % 360) * DEG,
          epoch: 0, // set at runtime
          period: periodMinutes(a),
        },
      });
      n++;
    }
  }
  void n;
  return out;
}

export const SAT_CATALOG: SatCatalogEntry[] = buildCatalog();

export const SAT_CATALOG_SIZE = SAT_CATALOG.length;

/** Satellites whose elements are anchored to the process start time. */
export function buildSatellites(now: number): Satellite[] {
  return SAT_CATALOG.map((entry, i) => {
    const el: OrbitalElements = { ...entry.elements, epoch: epochFor(i, now) };
    const pos = propagate(el, now);
    return {
      id: `sat-${i}`,
      kind: 'satellite' as const,
      name: entry.name,
      category: entry.category,
      group: entry.group,
      operator: entry.operator,
      purpose: entry.purpose,
      lat: pos.lat,
      lon: pos.lon,
      altitude: pos.alt,
      velocity: pos.velocity,
      heading: pos.heading,
      trail: [],
    };
  });
}

export function buildSatellitesWithTrails(now: number, trailSteps = 26, stepMs = 90_000): Satellite[] {
  return SAT_CATALOG.map((entry, i) => {
    const epoch = epochFor(i, now);
    const el: OrbitalElements = { ...entry.elements, epoch };
    const pos = propagate(el, now);
    const trail: [number, number][] = [];
    for (let s = trailSteps; s >= 0; s--) {
      const p = propagate(el, now - s * stepMs);
      trail.push([p.lat, p.lon]);
    }
    return {
      id: `sat-${i}`,
      kind: 'satellite' as const,
      name: entry.name,
      category: entry.category,
      group: entry.group,
      operator: entry.operator,
      purpose: entry.purpose,
      lat: pos.lat,
      lon: pos.lon,
      altitude: pos.alt,
      velocity: pos.velocity,
      heading: pos.heading,
      trail,
    };
  });
}

/**
 * Fixed per-satellite epoch offset so the catalog is spread along its orbits
 * but identical across renders (no random re-seeding, no jitter on refresh).
 */
function epochFor(index: number, now: number): number {
  // Anchor to the top of the current hour so positions advance smoothly.
  const hourAnchor = Math.floor(now / 3_600_000) * 3_600_000;
  const offsetMinutes = (index * 37) % 90;
  return hourAnchor - offsetMinutes * 60_000;
}
