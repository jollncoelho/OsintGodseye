/**
 * GET /api/adsb?endpoint=mil            -> military aircraft
 * GET /api/adsb?lat=&lon=&dist=         -> aircraft around a point
 *
 * Server-side proxy for the keyless ADS-B network. Adds CORS, a browser
 * User-Agent (the upstreams reject default fetch agents), provider failover
 * and a 30 s cache.
 *
 * When every provider fails the last good body is served instead, so a
 * transient 429 degrades freshness rather than blanking the layer.
 */

import { adsbPath, fetchAdsb, type AdsbEndpoint } from '../shared/adsb.js';

type Req = {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
};
type Res = {
  setHeader: (name: string, value: string | number) => void;
  statusCode: number;
  end: (body?: string) => void;
};

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const TTL_MS = 30_000;
/** How long a stale body may still be served while upstreams are failing. */
const STALE_MS = 10 * 60_000;

const cache = new Map<string, { ts: number; body: string }>();

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function send(res: Res, status: number, body: string, cacheControl: string) {
  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', cacheControl);
  res.statusCode = status;
  res.end(body);
}

export default async function handler(req: Req, res: Res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
    res.end();
    return;
  }

  const endpoint = (first(req.query?.endpoint) === 'mil' ? 'mil' : 'area') as AdsbEndpoint;
  const lat = first(req.query?.lat) ?? '50';
  const lon = first(req.query?.lon) ?? '10';
  const dist = first(req.query?.dist) ?? '250';

  const path = adsbPath(endpoint, lat, lon, dist);
  const cached = cache.get(path);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    send(res, 200, cached.body, 'public, max-age=30, stale-while-revalidate=120');
    return;
  }

  const result = await fetchAdsb(path);
  if (result.ok) {
    cache.set(path, { ts: Date.now(), body: result.body });
    send(res, 200, result.body, 'public, max-age=30, stale-while-revalidate=120');
    return;
  }

  // Every provider failed — prefer a stale-but-real body over an empty one.
  if (cached && Date.now() - cached.ts < STALE_MS) {
    send(res, 200, cached.body, 'public, max-age=10');
    return;
  }

  res.setHeader('X-Adsb-Errors', result.errors.join(' | ').slice(0, 300));
  send(res, 502, result.body, 'no-store');
}
