export const pad = (n: number, len = 2) => String(n).padStart(len, '0');

export function utcNow(): Date {
  return new Date();
}

export function formatUTC(d: Date): string {
  return d.toLocaleTimeString('fr-BE', {
    timeZone: 'Europe/Brussels',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatUTCDate(d: Date): string {
  return d.toLocaleDateString('fr-BE', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export const mToft = (m: number | null) => (m == null ? null : m * 3.28084);
export const msToKnots = (ms: number | null) => (ms == null ? null : ms * 1.94384);

export function fmtAlt(m: number | null): string {
  if (m == null) return '—';
  const ft = mToft(m);
  return `${ft ? Math.round(ft).toLocaleString() : '—'} ft / ${Math.round(m).toLocaleString()} m`;
}

export function fmtSpeed(ms: number | null): string {
  if (ms == null) return '—';
  return `${Math.round(msToKnots(ms) ?? 0)} kn / ${Math.round(ms)} m/s`;
}

export function fmtHeading(deg: number | null): string {
  if (deg == null) return '—';
  return `${Math.round(deg)}°`;
}

export function fmtClimb(vr: number | null): string {
  if (vr == null) return '—';
  const fpm = Math.round(vr * 196.85);
  return `${fpm > 0 ? '+' : ''}${fpm} fpm`;
}

export function distanceKm(
  a: [number, number],
  b: [number, number],
): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
