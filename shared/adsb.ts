/**
 * Keyless ADS-B aircraft feed with provider failover.
 *
 * The public readsb-based ADS-B APIs all expose the same v2 schema
 * (`{ ac: [...], now, total, ... }`) and the same path layout, so a target
 * path can be replayed against any of them. Both providers below are keyless
 * and verified working (2026-10); neither sends CORS headers, so this must be
 * reached through the server proxy.
 *
 * Failover exists because these feeds rate-limit aggressively (HTTP 429) and
 * occasionally 502. Without a second provider a single upstream hiccup empties
 * the entire aircraft layer.
 */

export type AdsbEndpoint = 'mil' | 'area';

export type AdsbResult = {
  ok: boolean;
  status: number;
  body: string;
  /** Which provider actually answered, when one did. */
  provider?: string;
  errors: string[];
};

const PROVIDERS = [
  { name: 'adsb.lol', base: 'https://api.adsb.lol/v2' },
  { name: 'adsb.fi', base: 'https://opendata.adsb.fi/api/v2' },
] as const;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OsintGodsEye/2.0';
const TIMEOUT_MS = 9000;

/** Build the provider-relative path for a request. */
export function adsbPath(endpoint: AdsbEndpoint, lat: string, lon: string, dist: string): string {
  return endpoint === 'mil' ? '/mil' : `/lat/${lat}/lon/${lon}/dist/${dist}`;
}

/** True when the body looks like a usable readsb response. */
function isUsable(body: string): boolean {
  return normalizeAdsb(body) !== null;
}

/**
 * Normalise provider payloads to the canonical readsb `{ ac: [...] }` shape.
 *
 * The providers are *not* schema-identical. Verified 2026-10:
 *   - adsb.lol  `/v2/mil` and `/v2/lat/...`  -> `{ ac: [...] }`
 *   - adsb.fi   `/v2/mil`                    -> `{ ac: [...] }`
 *   - adsb.fi   `/v2/lat/.../dist/...`       -> `{ aircraft: [...] }`  <-- differs
 *
 * Normalising here means the browser client only ever sees one shape, and a
 * provider that answers 200 with an unexpected body is treated as a failure
 * rather than silently yielding zero aircraft.
 */
function normalizeAdsb(body: string): string | null {
  let parsed: { ac?: unknown; aircraft?: unknown; now?: unknown; total?: unknown };
  try {
    parsed = JSON.parse(body) as typeof parsed;
  } catch {
    return null;
  }
  const list = Array.isArray(parsed?.ac)
    ? parsed.ac
    : Array.isArray(parsed?.aircraft)
      ? parsed.aircraft
      : null;
  if (!list) return null;

  const now = typeof parsed.now === 'number' ? parsed.now : Math.floor(Date.now() / 1000);
  return JSON.stringify({ ac: list, total: list.length, now });
}

/**
 * Try each provider in order and return the first usable response.
 *
 * A provider that answers 200 with a non-readsb body is treated as a failure
 * and the next one is tried, so a captive portal or error page can never
 * masquerade as aircraft data.
 */
export async function fetchAdsb(path: string): Promise<AdsbResult> {
  const errors: string[] = [];

  for (const provider of PROVIDERS) {
    try {
      const res = await fetch(`${provider.base}${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const raw = await res.text();

      if (!res.ok) {
        errors.push(`${provider.name}: HTTP ${res.status}`);
        continue;
      }
      const normalized = normalizeAdsb(raw);
      if (!normalized) {
        errors.push(`${provider.name}: unexpected payload`);
        continue;
      }
      return { ok: true, status: 200, body: normalized, provider: provider.name, errors };
    } catch (err) {
      errors.push(`${provider.name}: ${err instanceof Error ? err.message : 'request failed'}`);
    }
  }

  return { ok: false, status: 502, body: JSON.stringify({ ac: [], error: 'all ADS-B providers failed' }), errors };
}
