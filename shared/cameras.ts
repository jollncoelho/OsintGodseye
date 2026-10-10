/**
 * Keyless public camera aggregator.
 *
 * Merges several *public, keyless* traffic / city camera feeds into one
 * normalized list. Every source is fetched live at request time and is
 * isolated with Promise.allSettled so a single provider outage never
 * darkens the rest of the layer.
 *
 * Sources verified working (2026-10):
 *   - TfL JamCam        (London, UK)          ~890 cameras
 *   - Caltrans          (California, US)      districts 3/4/7/11
 *   - Austin Open Data  (Austin, Texas, US)
 *   - Digitraffic       (Finland)             812 stations x presets
 *   - Statens vegvesen  (Norway)              OGC API Features
 *   - Live Traffic NSW  (Sydney, Australia)
 *   - Open Calgary      (Calgary, Canada)
 *
 * No API keys, no scraping of private streams: only official open-data
 * catalogs whose frames are published for public consumption.
 */

export type CameraRecord = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  url: string;
  source: string;
  country: string;
  city?: string;
  /** Optional HLS live stream, when the provider publishes one. */
  streamUrl?: string;
};

const UA = 'OsintGodsEye/2.0 (open-source OSINT dashboard)';
const TIMEOUT_MS = 9000;

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'User-Agent': UA,
      ...headers,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

function isOk(c: Partial<CameraRecord>): c is CameraRecord {
  return (
    typeof c.lat === 'number' &&
    typeof c.lon === 'number' &&
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lon) &&
    Math.abs(c.lat) <= 90 &&
    Math.abs(c.lon) <= 180 &&
    typeof c.url === 'string' &&
    c.url.length > 0 &&
    (c.url.startsWith('https://') || c.url.startsWith('http://'))
  );
}

function dedupe(list: CameraRecord[]): CameraRecord[] {
  const seen = new Set<string>();
  const out: CameraRecord[] = [];
  for (const c of list) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* United Kingdom — TfL JamCams                                        */
/* ------------------------------------------------------------------ */
async function fetchTfL(): Promise<CameraRecord[]> {
  type Prop = { key: string; value: string };
  type Place = {
    id: string;
    commonName?: string;
    lat: number;
    lon: number;
    additionalProperties?: Prop[];
  };
  const data = await getJson<Place[]>('https://api.tfl.gov.uk/Place/Type/JamCam');
  return (data ?? [])
    .map((p) => {
      const url = (p.additionalProperties ?? []).find((x) => x.key === 'imageUrl')?.value ?? '';
      return {
        id: `tfl-${p.id}`,
        name: p.commonName || 'London JamCam',
        lat: Number(p.lat),
        lon: Number(p.lon),
        url,
        source: 'TfL JamCam',
        country: 'United Kingdom',
        city: 'London',
      };
    })
    .filter(isOk);
}

/* ------------------------------------------------------------------ */
/* United States — Caltrans (California DOT)                           */
/* ------------------------------------------------------------------ */
const CALTRANS_DISTRICTS = [3, 4, 7, 11];

async function fetchCaltrans(district: number): Promise<CameraRecord[]> {
  type Entry = {
    cctv?: {
      inService?: boolean | string;
      location?: {
        latitude?: string;
        longitude?: string;
        locationName?: string;
        nearbyPlace?: string;
        county?: string;
      };
      imageData?: {
        streamingVideoURL?: string;
        static?: { currentImageURL?: string };
      };
    };
  };
  const url = `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2, '0')}.json`;
  const data = await getJson<{ data?: Entry[] }>(url);
  return (data.data ?? [])
    .map((entry): CameraRecord | null => {
      const c = entry.cctv;
      if (!c) return null;
      const inService = c.inService === true || String(c.inService).toLowerCase() === 'true';
      if (!inService) return null;
      const loc = c.location ?? {};
      const lat = Number(loc.latitude);
      const lon = Number(loc.longitude);
      const imageUrl = c.imageData?.static?.currentImageURL ?? '';
      const streamUrl = c.imageData?.streamingVideoURL ?? undefined;
      const rec: CameraRecord = {
        id: `caltrans-d${district}-${loc.locationName ?? `${lat},${lon}`}`,
        name: loc.locationName || 'Caltrans Camera',
        lat,
        lon,
        url: imageUrl,
        source: 'Caltrans',
        country: 'United States',
        city: loc.nearbyPlace,
        streamUrl: streamUrl && streamUrl.endsWith('.m3u8') ? streamUrl : undefined,
      };
      return isOk(rec) ? rec : null;
    })
    .filter((c): c is CameraRecord => c !== null);
}

/* ------------------------------------------------------------------ */
/* United States — City of Austin Open Data                            */
/* ------------------------------------------------------------------ */
async function fetchAustin(): Promise<CameraRecord[]> {
  type Rows = {
    meta?: { view?: { columns?: { name: string }[] } };
    data?: unknown[][];
  };
  const d = await getJson<Rows>(
    'https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD',
  );
  const cols = (d.meta?.view?.columns ?? []).map((c) => c.name);
  const idx = (name: string) => cols.indexOf(name);
  const iId = idx('Camera ID');
  const iName = idx('Location Name');
  const iStatus = idx('Camera Status');
  const iShot = idx('Screenshot Address');
  const iLoc = idx('Location');
  if (iId < 0 || iLoc < 0) return [];

  const out: CameraRecord[] = [];
  for (const row of d.data ?? []) {
    if (!Array.isArray(row)) continue;
    const status = String(row[iStatus] ?? '').trim().toUpperCase();
    if (status && status !== 'TURNED_ON') continue;
    const loc = String(row[iLoc] ?? '');
    const m = loc.match(/POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/);
    if (!m) continue;
    const lon = Number(m[1]);
    const lat = Number(m[2]);
    const camId = String(row[iId] ?? '');
    const url =
      String(row[iShot] ?? '').trim() || `https://cctv.austinmobility.io/image/${camId}.jpg`;
    const rec: CameraRecord = {
      id: `austin-${camId}`,
      name: String(row[iName] ?? '').trim() || `Austin Camera ${camId}`,
      lat,
      lon,
      url,
      source: 'Austin Mobility',
      country: 'United States',
      city: 'Austin',
    };
    if (isOk(rec)) out.push(rec);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Finland — Fintraffic / Digitraffic weather cameras                  */
/* ------------------------------------------------------------------ */
async function fetchFinland(): Promise<CameraRecord[]> {
  type Feature = {
    id: string;
    geometry?: { coordinates?: [number, number, number] };
    properties?: { name?: string; presets?: { id: string; inCollection?: boolean }[] };
  };
  const d = await getJson<{ features?: Feature[] }>(
    'https://tie.digitraffic.fi/api/weathercam/v1/stations',
    { 'Digitraffic-User': UA },
  );
  const out: CameraRecord[] = [];
  for (const f of d.features ?? []) {
    const coords = f.geometry?.coordinates;
    if (!coords) continue;
    const lon = Number(coords[0]);
    const lat = Number(coords[1]);
    const presets = (f.properties?.presets ?? []).filter((p) => p.inCollection !== false);
    for (const p of presets) {
      const rec: CameraRecord = {
        id: `fin-${p.id}`,
        name: `${f.properties?.name ?? f.id} · ${p.id.slice(-2)}`,
        lat,
        lon,
        url: `https://weathercam.digitraffic.fi/${p.id}.jpg`,
        source: 'Fintraffic',
        country: 'Finland',
      };
      if (isOk(rec)) out.push(rec);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Norway — Statens vegvesen (OGC API Features, DATEX 3.1)             */
/* ------------------------------------------------------------------ */
async function fetchNorway(): Promise<CameraRecord[]> {
  type Feature = {
    geometry?: { coordinates?: [number, number] };
    properties?: {
      cameraId?: string;
      stillImageUrl?: string;
      roadNumber?: string;
      orientationDescription?: string;
      'status.stillImageAvailability'?: string;
    };
  };
  const d = await getJson<{ features?: Feature[] }>(
    'https://ogckart-sn1.atlas.vegvesen.no/ogc/features/v1/collections/datex_3_1:CctvSimple/items?limit=800',
    { Accept: 'application/geo+json' },
  );
  return (d.features ?? [])
    .map((f): CameraRecord | null => {
      const coords = f.geometry?.coordinates;
      const p = f.properties ?? {};
      if (!coords || !p.stillImageUrl) return null;
      if (p['status.stillImageAvailability'] === 'noImage') return null;
      const rec: CameraRecord = {
        id: `no-${p.cameraId ?? `${coords[0]},${coords[1]}`}`,
        name: `${p.roadNumber ?? 'E'} · ${p.orientationDescription ?? 'Norway'}`,
        lat: Number(coords[1]),
        lon: Number(coords[0]),
        url: p.stillImageUrl,
        source: 'Statens vegvesen',
        country: 'Norway',
      };
      return isOk(rec) ? rec : null;
    })
    .filter((c): c is CameraRecord => c !== null);
}

/* ------------------------------------------------------------------ */
/* Australia — Live Traffic NSW                                        */
/* ------------------------------------------------------------------ */
async function fetchNsw(): Promise<CameraRecord[]> {
  type Feature = {
    geometry?: { coordinates?: [number, number] };
    properties?: { title?: string; href?: string; region?: string };
  };
  const d = await getJson<{ features?: Feature[] }>(
    'https://data.livetraffic.com/cameras/traffic-cam.json',
  );
  return (d.features ?? [])
    .map((f): CameraRecord | null => {
      const coords = f.geometry?.coordinates;
      const p = f.properties ?? {};
      if (!coords || !p.href) return null;
      const rec: CameraRecord = {
        id: `nsw-${p.href.split('/').pop() ?? `${coords[0]},${coords[1]}`}`,
        name: p.title || 'NSW Traffic Camera',
        lat: Number(coords[1]),
        lon: Number(coords[0]),
        url: p.href,
        source: 'Live Traffic NSW',
        country: 'Australia',
        city: 'Sydney',
      };
      return isOk(rec) ? rec : null;
    })
    .filter((c): c is CameraRecord => c !== null);
}

/* ------------------------------------------------------------------ */
/* Canada — Open Calgary                                               */
/* ------------------------------------------------------------------ */
async function fetchCalgary(): Promise<CameraRecord[]> {
  type Row = {
    camera_url?: { url?: string };
    camera_location?: string;
    point?: { coordinates?: [number, number] };
  };
  const d = await getJson<Row[]>('https://data.calgary.ca/resource/k7p9-kppz.json?$limit=200');
  return (d ?? [])
    .map((r): CameraRecord | null => {
      const coords = r.point?.coordinates;
      const raw = r.camera_url?.url ?? '';
      if (!coords || !raw) return null;
      // The dataset publishes http:// URLs; the host serves https too.
      const url = raw.replace(/^http:\/\//i, 'https://');
      const rec: CameraRecord = {
        id: `calgary-${url.split('/').pop() ?? `${coords[0]},${coords[1]}`}`,
        name: r.camera_location || 'Calgary Traffic Camera',
        lat: Number(coords[1]),
        lon: Number(coords[0]),
        url,
        source: 'Open Calgary',
        country: 'Canada',
        city: 'Calgary',
      };
      return isOk(rec) ? rec : null;
    })
    .filter((c): c is CameraRecord => c !== null);
}

/* ------------------------------------------------------------------ */
/* Aggregation                                                         */
/* ------------------------------------------------------------------ */

type SourceDef = { key: string; cap: number; load: () => Promise<CameraRecord[]> };

const caltransAll = async () =>
  (await Promise.all(CALTRANS_DISTRICTS.map(fetchCaltrans))).flat();

/** Full catalog — server-side only (NSW + Norway need a proxy for CORS). */
const SERVER_SOURCES: SourceDef[] = [
  { key: 'TfL JamCam', cap: 260, load: fetchTfL },
  { key: 'Caltrans', cap: 320, load: caltransAll },
  { key: 'Austin Mobility', cap: 180, load: fetchAustin },
  { key: 'Fintraffic', cap: 300, load: fetchFinland },
  { key: 'Statens vegvesen', cap: 300, load: fetchNorway },
  { key: 'Live Traffic NSW', cap: 250, load: fetchNsw },
  { key: 'Open Calgary', cap: 120, load: fetchCalgary },
];

/**
 * Browser-safe subset. Only sources that send permissive CORS headers, so the
 * camera layer still works when the app is served as a plain static bundle
 * with no `/api` runtime (Netlify, GitHub Pages, opening `dist/` directly).
 * NSW and Norway are intentionally excluded — they only reach the client
 * through the server aggregator.
 */
export const CLIENT_SOURCES: SourceDef[] = [
  { key: 'TfL JamCam', cap: 200, load: fetchTfL },
  { key: 'Caltrans', cap: 220, load: caltransAll },
  { key: 'Austin Mobility', cap: 150, load: fetchAustin },
  { key: 'Fintraffic', cap: 200, load: fetchFinland },
  { key: 'Open Calgary', cap: 100, load: fetchCalgary },
];

export type CollectResult = {
  cameras: CameraRecord[];
  total: number;
  errors: string[];
  sources: { key: string; count: number }[];
};

async function collect(defs: SourceDef[], globalCap: number): Promise<CollectResult> {
  const settled = await Promise.allSettled(defs.map((s) => s.load()));
  const errors: string[] = [];
  const sourceCounts: { key: string; count: number }[] = [];
  const all: CameraRecord[] = [];

  settled.forEach((res, i) => {
    const def = defs[i];
    if (res.status === 'fulfilled') {
      const capped = res.value.slice(0, def.cap);
      sourceCounts.push({ key: def.key, count: capped.length });
      all.push(...capped);
    } else {
      errors.push(`${def.key}: ${res.reason instanceof Error ? res.reason.message : 'failed'}`);
      sourceCounts.push({ key: def.key, count: 0 });
    }
  });

  const cameras = dedupe(all).slice(0, globalCap);
  return { cameras, total: cameras.length, errors, sources: sourceCounts };
}

/** Server-side aggregation — full provider coverage. */
export function collectCameras(): Promise<CollectResult> {
  return collect(SERVER_SOURCES, 1500);
}

/** Client-side aggregation — CORS-friendly providers only. */
export function collectClientCameras(): Promise<CollectResult> {
  return collect(CLIENT_SOURCES, 1000);
}
