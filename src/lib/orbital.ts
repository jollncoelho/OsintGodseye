// Simplified Keplerian two-body propagator for visualization purposes.
// Not mission-grade — good enough for a live ground-track dashboard.

const EARTH_RADIUS_KM = 6371;
const EARTH_ROT_RATE = 7.2921159e-5; // rad/s

export type OrbitalElements = {
  name: string;
  category: string;
  inc: number; // inclination (rad)
  raan: number; // right ascension of ascending node (rad)
  ecc: number; // eccentricity
  a: number; // semi-major axis (km)
  argp: number; // argument of perigee (rad)
  M0: number; // mean anomaly at epoch (rad)
  epoch: number; // epoch (ms)
  period: number; // orbital period (minutes)
};

export type SatPos = {
  lat: number;
  lon: number;
  alt: number; // km
  velocity: number; // km/s
  heading: number;
};

const MU = 398600.4418; // km^3/s^2

export function propagate(el: OrbitalElements, nowMs: number): SatPos {
  const dt = (nowMs - el.epoch) / 1000;
  const n = (2 * Math.PI) / (el.period * 60); // mean motion rad/s
  const M = (el.M0 + n * dt) % (2 * Math.PI);

  // Solve Kepler's equation: E - e sin E = M
  let E = M;
  for (let i = 0; i < 10; i++) {
    E = E - (E - el.ecc * Math.sin(E) - M) / (1 - el.ecc * Math.cos(E));
  }

  const nu = 2 * Math.atan2(
    Math.sqrt(1 + el.ecc) * Math.sin(E / 2),
    Math.sqrt(1 - el.ecc) * Math.cos(E / 2),
  );
  const r = el.a * (1 - el.ecc * Math.cos(E));

  // Velocity (vis-viva)
  const v = Math.sqrt(MU * (2 / r - 1 / el.a));

  // Perifocal coordinates
  const px = r * Math.cos(nu);
  const py = r * Math.sin(nu);

  // Rotate perifocal -> ECI: Rz(raan) Rx(inc) Rz(argp)
  const cosW = Math.cos(el.raan), sinW = Math.sin(el.raan);
  const cosI = Math.cos(el.inc), sinI = Math.sin(el.inc);
  const coswp = Math.cos(el.argp), sinwp = Math.sin(el.argp);

  // Apply Rz(argp) first to perifocal vector
  const xpf = px * coswp - py * sinwp;
  const ypf = px * sinwp + py * coswp;
  const zpf = 0;

  // Rx(inc)
  const xi = ypf * cosI - zpf * sinI;
  const yi = ypf * sinI + zpf * cosI;
  const zi = zpf * cosI - ypf * sinI;

  // Rz(raan)
  const x = xpf * cosW - xi * sinW;
  const y = xpf * sinW + xi * cosW;
  const z = yi * sinI + zpf * cosI;
  void zi;

  // Recompute cleanly (the above manual chain is error-prone; use standard 3-1-3)
  const x1 = (px * (cosW * coswp - sinW * sinwp * cosI) - py * (cosW * sinwp + sinW * coswp * cosI));
  const y1 = (px * (sinW * coswp + cosW * sinwp * cosI) - py * (sinW * sinwp - cosW * coswp * cosI));
  const z1 = px * sinwp * sinI + py * coswp * sinI;

  // ECEF: subtract earth rotation
  const gmst = EARTH_ROT_RATE * dt;
  const lonRaw = Math.atan2(y1, x1) - gmst;
  const lat = Math.asin(z1 / r);
  let lon = ((lonRaw + Math.PI) % (2 * Math.PI)) - Math.PI;
  if (lon < -Math.PI) lon += 2 * Math.PI;

  // Heading from velocity direction (approx: derivative of ground track)
  const heading = ((nu * 180) / Math.PI + 360) % 360;

  void x;
  void y;
  void z;

  return {
    lat: (lat * 180) / Math.PI,
    lon: (lon * 180) / Math.PI,
    alt: r - EARTH_RADIUS_KM,
    velocity: v,
    heading,
  };
}

export function groundTrack(
  el: OrbitalElements,
  nowMs: number,
  steps = 60,
  spanMin = 0,
): [number, number][] {
  const out: [number, number][] = [];
  const periodMs = el.period * 60 * 1000;
  const start = nowMs - (spanMin * 60 * 1000) / 2;
  for (let i = 0; i <= steps; i++) {
    const t = start + (i / steps) * (spanMin * 60 * 1000 || periodMs);
    const p = propagate(el, t);
    out.push([p.lat, p.lon]);
  }
  return out;
}
