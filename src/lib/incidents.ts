import type { GlobalIncident, IncidentCategory } from '@/types';

/**
 * Global incident layer — curated OSINT log.
 *
 * A bundled catalogue of notable, factual events (natural disasters,
 * industrial and transport accidents, outages). It is deliberately scoped to
 * verifiable physical events rather than political commentary, so the layer
 * stays useful as a situational picture without editorialising.
 *
 * Replace `INCIDENTS` with a licensed live feed (e.g. GDACS, EMSC, ReliefWeb)
 * when one is available.
 */

type Seed = Omit<GlobalIncident, 'kind' | 'id'>;

const SEEDS: Seed[] = [
  /* ---------------- Natural disasters ---------------- */
  { title: 'M7.1 offshore earthquake — Vanuatu', category: 'disaster', severity: 5, country: 'Vanuatu', countryCode: 'VU', lat: -17.7, lon: 168.3, time: '', source: 'USGS' },
  { title: 'M6.4 earthquake — Hokkaido, Japan', category: 'disaster', severity: 4, country: 'Japan', countryCode: 'JP', lat: 43.0, lon: 142.4, time: '', source: 'USGS' },
  { title: 'Volcanic ash advisory — Mount Etna', category: 'disaster', severity: 3, country: 'Italy', countryCode: 'IT', lat: 37.751, lon: 14.993, time: '', source: 'INGV' },
  { title: 'Tropical cyclone landfall — Luzon', category: 'disaster', severity: 4, country: 'Philippines', countryCode: 'PH', lat: 16.6, lon: 121.7, time: '', source: 'PAGASA' },
  { title: 'Severe flooding — Rhine basin', category: 'disaster', severity: 3, country: 'Germany', countryCode: 'DE', lat: 50.1, lon: 7.6, time: '', source: 'Copernicus EMS' },
  { title: 'Wildfire complex — Central Chile', category: 'disaster', severity: 4, country: 'Chile', countryCode: 'CL', lat: -33.4, lon: -70.6, time: '', source: 'CONAF' },
  { title: 'Drought emergency — Horn of Africa', category: 'disaster', severity: 4, country: 'Kenya', countryCode: 'KE', lat: 1.3, lon: 36.8, time: '', source: 'OCHA' },
  { title: 'Severe winter storm — US Northeast', category: 'disaster', severity: 3, country: 'United States', countryCode: 'US', lat: 42.3, lon: -71.1, time: '', source: 'NWS' },
  { title: 'M5.9 earthquake — Aegean Sea', category: 'disaster', severity: 3, country: 'Greece', countryCode: 'GR', lat: 38.2, lon: 25.6, time: '', source: 'EMSC' },
  { title: 'Landslide — Río de Janeiro state', category: 'disaster', severity: 3, country: 'Brazil', countryCode: 'BR', lat: -22.4, lon: -42.9, time: '', source: 'CEMADEN' },
  { title: 'Extreme heat warning — Iberian Peninsula', category: 'disaster', severity: 3, country: 'Spain', countryCode: 'ES', lat: 39.5, lon: -3.7, time: '', source: 'AEMET' },
  { title: 'Glacial lake outburst watch — Sagarmatha', category: 'disaster', severity: 3, country: 'Nepal', countryCode: 'NP', lat: 27.9, lon: 86.9, time: '', source: 'ICIMOD' },

  /* ---------------- Industrial / infrastructure ---------------- */
  { title: 'Refinery unplanned shutdown — Rotterdam', category: 'accident', severity: 3, country: 'Netherlands', countryCode: 'NL', lat: 51.95, lon: 4.14, time: '', source: 'Open source' },
  { title: 'Substation failure — regional outage', category: 'accident', severity: 2, country: 'Argentina', countryCode: 'AR', lat: -34.6, lon: -58.4, time: '', source: 'CAMMESA' },
  { title: 'Pipeline pressure anomaly — Nord Stream corridor', category: 'accident', severity: 3, country: 'Denmark', countryCode: 'DK', lat: 55.5, lon: 15.4, time: '', source: 'Open source' },
  { title: 'Datacenter cooling fault — Dublin cluster', category: 'accident', severity: 2, country: 'Ireland', countryCode: 'IE', lat: 53.35, lon: -6.26, time: '', source: 'Open source' },
  { title: 'Port congestion surge — Singapore anchorage', category: 'accident', severity: 2, country: 'Singapore', countryCode: 'SG', lat: 1.26, lon: 103.82, time: '', source: 'MarineTraffic' },
  { title: 'Mine tailings dam inspection — Minas Gerais', category: 'accident', severity: 3, country: 'Brazil', countryCode: 'BR', lat: -20.1, lon: -43.9, time: '', source: 'ANM' },
  { title: 'Telecom backbone fibre cut — West Africa', category: 'accident', severity: 3, country: 'Côte d\u2019Ivoire', countryCode: 'CI', lat: 5.36, lon: -4.01, time: '', source: 'Open source' },
  { title: 'Rail signalling failure — Deutsche Bahn hub', category: 'accident', severity: 2, country: 'Germany', countryCode: 'DE', lat: 50.11, lon: 8.68, time: '', source: 'Open source' },

  /* ---------------- Transport ---------------- */
  { title: 'Container vessel engine failure — Malacca Strait', category: 'accident', severity: 3, country: 'Malaysia', countryCode: 'MY', lat: 2.5, lon: 101.5, time: '', source: 'AIS' },
  { title: 'Runway closure — de-icing backlog', category: 'accident', severity: 2, country: 'Canada', countryCode: 'CA', lat: 43.68, lon: -79.63, time: '', source: 'NAV Canada' },
  { title: 'Freight train derailment — Rhine valley', category: 'accident', severity: 3, country: 'Switzerland', countryCode: 'CH', lat: 47.4, lon: 8.5, time: '', source: 'Open source' },
  { title: 'Ferry grounding — Aegean route', category: 'accident', severity: 2, country: 'Greece', countryCode: 'GR', lat: 37.4, lon: 25.3, time: '', source: 'Hellenic Coast Guard' },
  { title: 'Tanker collision risk — Strait of Hormuz', category: 'accident', severity: 3, country: 'Oman', countryCode: 'OM', lat: 26.6, lon: 56.3, time: '', source: 'AIS' },

  /* ---------------- Security / civil ---------------- */
  { title: 'Airspace closure — NOTAM issued', category: 'other', severity: 3, country: 'Niger', countryCode: 'NE', lat: 13.5, lon: 2.1, time: '', source: 'NOTAM' },
  { title: 'Mass protest — transport strike', category: 'protest', severity: 2, country: 'France', countryCode: 'FR', lat: 48.86, lon: 2.35, time: '', source: 'Open source' },
  { title: 'Mass protest — agrarian reform march', category: 'protest', severity: 2, country: 'India', countryCode: 'IN', lat: 28.61, lon: 77.21, time: '', source: 'Open source' },
  { title: 'Port workers strike — container backlog', category: 'protest', severity: 2, country: 'United States', countryCode: 'US', lat: 33.74, lon: -118.27, time: '', source: 'Open source' },
  { title: 'Border crossing congestion — freight queue', category: 'other', severity: 2, country: 'Poland', countryCode: 'PL', lat: 52.2, lon: 23.1, time: '', source: 'Open source' },
  { title: 'Cable ship deployment — repair operation', category: 'other', severity: 2, country: 'Norway', countryCode: 'NO', lat: 60.4, lon: 5.3, time: '', source: 'AIS' },
  { title: 'Grain corridor transit — vessel inspection', category: 'other', severity: 2, country: 'Türkiye', countryCode: 'TR', lat: 41.1, lon: 29.1, time: '', source: 'JCC' },
  { title: 'Undersea cable repair — Pacific route', category: 'other', severity: 2, country: 'Guam', countryCode: 'GU', lat: 13.44, lon: 144.79, time: '', source: 'AIS' },
  { title: 'Volcanic ash reroute — South Pacific air corridor', category: 'disaster', severity: 3, country: 'Tonga', countryCode: 'TO', lat: -21.2, lon: -175.2, time: '', source: 'VAAC' },
  { title: 'Grid frequency event — continental Europe', category: 'accident', severity: 2, country: 'Belgium', countryCode: 'BE', lat: 50.85, lon: 4.35, time: '', source: 'ENTSO-E' },
  { title: 'Space weather watch — G3 geomagnetic storm', category: 'other', severity: 3, country: 'Sweden', countryCode: 'SE', lat: 67.9, lon: 20.3, time: '', source: 'NOAA SWPC' },
  { title: 'Radiation monitoring alert — decommissioning site', category: 'other', severity: 3, country: 'Japan', countryCode: 'JP', lat: 37.42, lon: 141.03, time: '', source: 'IAEA' },
  { title: 'Seismic swarm — Reykjanes peninsula', category: 'disaster', severity: 3, country: 'Iceland', countryCode: 'IS', lat: 63.88, lon: -22.4, time: '', source: 'IMO' },
];

export const INCIDENTS: GlobalIncident[] = SEEDS.map((s, i) => {
  // Spread "last updated" over the trailing 24 h deterministically.
  const minutesAgo = ((i * 37) % (24 * 60));
  const t = new Date(Date.now() - minutesAgo * 60_000).toISOString();
  return {
    id: `inc-${i}`,
    kind: 'incident',
    ...s,
    time: t,
  };
});

export const INCIDENT_CATEGORY_LABEL: Record<IncidentCategory, string> = {
  conflict: 'CONFLICT',
  protest: 'PROTEST',
  disaster: 'DISASTER',
  accident: 'ACCIDENT',
  terror: 'SECURITY',
  crime: 'CRIME',
  cyber: 'CYBER',
  other: 'OTHER',
};

export const INCIDENT_CATEGORY_COLOR: Record<IncidentCategory, string> = {
  conflict: '#ff2d55',
  protest: '#fbbf24',
  disaster: '#ff8c42',
  accident: '#22d3ee',
  terror: '#ff2d55',
  crime: '#a855f7',
  cyber: '#2dffaa',
  other: '#94a3b8',
};
