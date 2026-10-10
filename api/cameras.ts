/**
 * GET /api/cameras
 *
 * Aggregated, keyless public camera catalog. See api/_lib/cameras.ts for the
 * provider list. Cached in-process for 60 s to stay polite to the upstreams.
 */

import { collectCameras, type CollectResult } from '../shared/cameras.js';

type Req = { method?: string };
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

const TTL_MS = 60_000;
let cache: { ts: number; payload: CollectResult } | null = null;

export default async function handler(req: Req, res: Res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
    res.end();
    return;
  }

  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

  if (cache && Date.now() - cache.ts < TTL_MS) {
    res.statusCode = 200;
    res.end(JSON.stringify(cache.payload));
    return;
  }

  try {
    const payload = await collectCameras();
    cache = { ts: Date.now(), payload };
    res.statusCode = 200;
    res.end(JSON.stringify(payload));
  } catch (err) {
    res.statusCode = 502;
    res.end(
      JSON.stringify({
        total: 0,
        cameras: [],
        errors: [err instanceof Error ? err.message : 'camera aggregation failed'],
        sources: [],
      }),
    );
  }
}
