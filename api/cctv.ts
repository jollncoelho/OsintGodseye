import type { VercelRequest, VercelResponse } from '@vercel/node';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  try {
    const upstream = await fetch('https://api.tfl.gov.uk/Place/Type/JamCam', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      res.writeHead(upstream.status, CORS_HEADERS);
      res.end(JSON.stringify({ error: `Upstream ${upstream.status}`, cameras: [] }));
      return;
    }

    const data = await upstream.json();

    const cameras = (data || [])
      .map((cam: Record<string, unknown>) => {
        const props = (cam.additionalProperties as Array<Record<string, string>>) ?? [];
        const imageUrl = props.find((p) => p.key === 'imageUrl')?.value ?? '';
        return {
          id: `tfl-${cam.id as string}`,
          lat: cam.lat as number,
          lon: cam.lon as number,
          name: (cam.commonName as string) || 'London JamCam',
          url: imageUrl,
        };
      })
      .filter((c: { lat: number; lon: number; url: string }) => c.lat && c.lon && c.url);

    res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ total: cameras.length, cameras }));
  } catch (err) {
    res.writeHead(502, CORS_HEADERS);
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'proxy failed', cameras: [] }));
  }
}
