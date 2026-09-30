import type { VercelRequest, VercelResponse } from '@vercel/node';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { ts: number; body: string; status: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  const { endpoint, lat, lon, dist } = req.query;

  let targetUrl: string;
  if (endpoint === 'mil') {
    targetUrl = 'https://api.adsb.lol/v2/mil';
  } else {
    const d = dist || '250';
    targetUrl = `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${d}`;
  }

  const cacheKey = targetUrl;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    res.writeHead(cached.status, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(cached.body);
    return;
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OsintGodseye/1.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    const body = await upstream.text();

    if (upstream.ok) {
      cache.set(cacheKey, { ts: Date.now(), body, status: 200 });
    }

    res.writeHead(upstream.status, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(body);
  } catch (err) {
    res.writeHead(502, CORS_HEADERS);
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'proxy failed', ac: null }));
  }
}
