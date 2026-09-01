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

  const { endpoint, lat, lon, dist } = req.query;

  let targetUrl: string;
  if (endpoint === 'mil') {
    targetUrl = 'https://api.adsb.lol/v2/mil';
  } else {
    const d = dist || '250';
    targetUrl = `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${d}`;
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!upstream.ok) {
      res.writeHead(upstream.status, CORS_HEADERS);
      res.end(JSON.stringify({ error: `Upstream ${upstream.status}`, ac: null }));
      return;
    }

    const data = await upstream.json();
    res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(502, CORS_HEADERS);
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'proxy failed', ac: null }));
  }
}
