import type { VercelRequest, VercelResponse } from '@vercel/node';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const TIMEOUT_MS = 8000;

type Camera = {
  id: string;
  lat: number;
  lon: number;
  name: string;
  url: string;
  source: string;
  country: string;
};

// ---------- UK: TfL JamCams ----------
async function fetchTfL(): Promise<Camera[]> {
  const res = await fetch('https://api.tfl.gov.uk/Place/Type/JamCam', {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`TfL ${res.status}`);
  const data = await res.json();
  return (data || [])
    .map((cam: Record<string, unknown>) => {
      const props = (cam.additionalProperties as Array<Record<string, string>>) ?? [];
      const imageUrl = props.find((p) => p.key === 'imageUrl')?.value ?? '';
      return {
        id: `tfl-${cam.id as string}`,
        lat: cam.lat as number,
        lon: cam.lon as number,
        name: (cam.commonName as string) || 'London JamCam',
        url: imageUrl,
        source: 'TfL',
        country: 'UK',
      };
    })
    .filter((c: Camera) => c.lat && c.lon && c.url);
}

// ---------- USA: Caltrans (California DOT) ----------
async function fetchCaltrans(district: number): Promise<Camera[]> {
  const res = await fetch(`https://cwwp2.dot.ca.gov/data/d${district}/cctv`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Caltrans D${district} ${res.status}`);
  const data = await res.json();
  const list = data?.data ?? [];
  return list
    .map((entry: Record<string, unknown>) => {
      const cctv = entry.cctv as Record<string, unknown> | undefined;
      if (!cctv) return null;
      const loc = cctv.location as Record<string, number> | undefined;
      return {
        id: `caltrans-d${district}-${cctv.id as string}`,
        lat: loc?.latitude ?? 0,
        lon: loc?.longitude ?? 0,
        name: (cctv.name as string) || `Caltrans D${district}`,
        url: (cctv.imageUrl as string) ?? '',
        source: 'Caltrans',
        country: 'USA',
      };
    })
    .filter((c: Camera | null): c is Camera => c !== null && c.lat && c.lon && c.url);
}

// ---------- Canada: 511 Ontario ----------
async function fetchOntario(): Promise<Camera[]> {
  const res = await fetch('https://511on.ca/api/v2/get/cameras', {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Ontario ${res.status}`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : data?.cameras ?? [];
  return list
    .map((cam: Record<string, unknown>) => {
      const url = (cam.url as string) ?? (cam.snapshotUrl as string) ?? '';
      return {
        id: `ont-${cam.id as string}`,
        lat: (cam.latitude as number) ?? 0,
        lon: (cam.longitude as number) ?? 0,
        name: (cam.name as string) || 'Ontario 511 Camera',
        url,
        source: '511 Ontario',
        country: 'Canada',
      };
    })
    .filter((c: Camera) => c.lat && c.lon && c.url);
}

// ---------- France: Bordeaux / Nice open data (Bordeaux Métropole) ----------
async function fetchBordeaux(): Promise<Camera[]> {
  const res = await fetch('https://data.bordeaux-metropole.fr/api/explore/v2.1/catalog/datasets/civ_webcams_villedebordeaux/records?limit=50', {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Bordeaux ${res.status}`);
  const data = await res.json();
  const list = data?.results ?? [];
  return list
    .map((rec: Record<string, unknown>) => {
      const fields = (rec.fields ?? rec) as Record<string, unknown>;
      const geo = fields.geo_point_2d as { lat: number; lon: number } | undefined;
      return {
        id: `bordeaux-${rec.id as string ?? fields.id as string}`,
        lat: geo?.lat ?? (fields.lat as number) ?? 0,
        lon: geo?.lon ?? (fields.lon as number) ?? 0,
        name: (fields.nom as string) || 'Bordeaux Webcam',
        url: (fields.url as string) ?? (fields.image as string) ?? '',
        source: 'Bordeaux OpenData',
        country: 'France',
      };
    })
    .filter((c: Camera) => c.lat && c.lon && c.url);
}

// ---------- Spain: Madrid traffic cameras (Portal de Datos Abiertos) ----------
async function fetchMadrid(): Promise<Camera[]> {
  const res = await fetch('https://datos.madrid.es/egob/catalogo/202085-0-trafico-camaras.kml', {
    headers: { Accept: 'application/xml' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Madrid ${res.status}`);
  const text = await res.text();
  // Parse KML for Placemarks with coordinates and camera URLs
  const placemarks = text.match(/<Placemark>[\s\S]*?<\/Placemark>/g) ?? [];
  return placemarks
    .map((pm: string) => {
      const coordMatch = pm.match(/<coordinates>([^,]+),([^,<]+)/);
      const nameMatch = pm.match(/<name><!\[CDATA\[([^\]]+)\]/) ?? pm.match(/<name>([^<]+)<\/name>/);
      const descMatch = pm.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/);
      const desc = descMatch?.[1] ?? '';
      const urlMatch = desc.match(/https?:\/\/[^\s"'<>]+\.jpg/i) ?? desc.match(/https?:\/\/[^\s"'<>]+/i);
      if (!coordMatch || !urlMatch) return null;
      return {
        id: `madrid-${coordMatch[1]}-${coordMatch[2]}`,
        lat: parseFloat(coordMatch[2]),
        lon: parseFloat(coordMatch[1]),
        name: nameMatch?.[1]?.trim() || 'Madrid Traffic Cam',
        url: urlMatch[0],
        source: 'Madrid OpenData',
        country: 'Spain',
      };
    })
    .filter((c: Camera | null): c is Camera => c !== null && c.lat && c.lon && c.url);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  const sources = [
    fetchTfL(),
    fetchCaltrans(3),
    fetchCaltrans(4),
    fetchCaltrans(7),
    fetchCaltrans(11),
    fetchOntario(),
    fetchBordeaux(),
    fetchMadrid(),
  ];

  const results = await Promise.allSettled(sources);

  const cameras: Camera[] = [];
  const errors: string[] = [];

  for (const r of results) {
    if (r.status === 'fulfilled') {
      cameras.push(...r.value);
    } else {
      errors.push(r.reason instanceof Error ? r.reason.message : 'unknown error');
    }
  }

  res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    total: cameras.length,
    cameras,
    errors: errors.length > 0 ? errors : undefined,
  }));
}
