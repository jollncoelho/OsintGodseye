/**
 * GET /api/vessels
 *
 * Keyless live AIS positions (Digitraffic / Finnish Transport Infrastructure
 * Agency). Cached in-process for 45 s — AIS positions update roughly once a
 * minute, so there is no value in hammering the upstream harder.
 */

import { collectVessels, type VesselResult } from '../shared/vessels.js';

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

const TTL_MS = 45_000;
let cache: { ts: number; payload: VesselResult } | null = null;

export default async function handler(req: Req, res: Res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
    res.end();
    return;
  }

  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=45, stale-while-revalidate=180');

  if (cache && Date.now() - cache.ts < TTL_MS) {
    res.statusCode = 200;
    res.end(JSON.stringify({ ...cache.payload, total: cache.payload.vessels.length }));
    return;
  }

  try {
    const payload = await collectVessels();
    cache = { ts: Date.now(), payload };
    res.statusCode = 200;
    res.end(JSON.stringify({ ...payload, total: payload.vessels.length }));
  } catch (err) {
    res.statusCode = 502;
    res.end(
      JSON.stringify({
        total: 0,
        vessels: [],
        errors: [err instanceof Error ? err.message : 'vessel aggregation failed'],
      }),
    );
  }
}
