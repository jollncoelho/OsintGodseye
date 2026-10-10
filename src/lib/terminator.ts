/**
 * Solar geometry for the day/night terminator overlay (2D Leaflet view).
 *
 * Low-precision but plenty accurate for a visual terminator: the standard
 * NOAA-style solar position reduced to the subsolar point, then the
 * terminator latitude solved per meridian from the hour angle.
 */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

export type SubSolar = { lat: number; lon: number; declination: number };

/** Sub-solar point (the location where the Sun is directly overhead). */
export function subSolarPoint(date: Date): SubSolar {
  const jd = date.getTime() / 86_400_000 + 2_440_587.5;
  const n = jd - 2_451_545.0;

  const meanLon = ((280.460 + 0.9856474 * n) % 360 + 360) % 360;
  const meanAnom = ((357.528 + 0.9856003 * n) % 360 + 360) % 360;

  const lambda = (meanLon + 1.915 * Math.sin(meanAnom * RAD) + 0.020 * Math.sin(2 * meanAnom * RAD)) * RAD;
  const obliquity = (23.439 - 0.0000004 * n) * RAD;

  const ra = Math.atan2(Math.cos(obliquity) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(obliquity) * Math.sin(lambda));

  // Greenwich mean sidereal time, in radians.
  const gmstHours = ((18.697374558 + 24.06570982441908 * n) % 24 + 24) % 24;
  const gmst = gmstHours * 15 * RAD;

  let lon = (ra - gmst) * DEG;
  lon = ((lon + 540) % 360) - 180;

  return { lat: dec * DEG, lon, declination: dec * DEG };
}

/**
 * Night-side polygon as a Leaflet-friendly lat/lon ring.
 *
 * For each meridian the terminator latitude follows from the hour angle:
 *   tan(phi) = -cos(H) / tan(dec),  H = lon - sunLon
 * The dark hemisphere is the side away from the sub-solar latitude, so the
 * ring closes through the pole that is currently in darkness.
 */
export function nightPolygon(date: Date, stepDeg = 2): [number, number][] {
  const sun = subSolarPoint(date);
  const decRad = sun.declination * RAD;
  const tanDec = Math.tan(decRad);

  const ring: [number, number][] = [];
  const EPS = 1e-6;

  for (let lon = -180; lon <= 180; lon += stepDeg) {
    const H = (lon - sun.lon) * RAD;
    let phi: number;
    if (Math.abs(tanDec) < EPS) {
      // Sun on the equator: terminator is the meridians at ±90° hour angle.
      phi = Math.cos(H) > 0 ? -90 : 90;
    } else {
      phi = Math.atan(-Math.cos(H) / tanDec) * DEG;
    }
    ring.push([phi, lon]);
  }

  // Close through the pole that lies in darkness.
  const darkPole = sun.declination > 0 ? -90 : 90;
  ring.push([darkPole, 180]);
  ring.push([darkPole, -180]);

  return ring;
}

/** Civil twilight ring (~-6° solar elevation), for a softer overlay. */
export function twilightPolygon(date: Date, stepDeg = 2): [number, number][] {
  const sun = subSolarPoint(date);
  const decRad = sun.declination * RAD;
  const tanDec = Math.tan(decRad);

  const ring: [number, number][] = [];
  const EPS = 1e-6;
  // 6° of arc ≈ 0.10472 rad; shifting the terminator latitude by this amount
  // (signed by hemisphere) gives a good civil-twilight approximation.
  const shift = 6 * RAD;

  for (let lon = -180; lon <= 180; lon += stepDeg) {
    const H = (lon - sun.lon) * RAD;
    let phi: number;
    if (Math.abs(tanDec) < EPS) {
      phi = Math.cos(H) > 0 ? -90 : 90;
    } else {
      const base = Math.atan(-Math.cos(H) / tanDec);
      phi = (base + (sun.declination > 0 ? shift : -shift)) * DEG;
    }
    ring.push([phi, lon]);
  }

  const darkPole = sun.declination > 0 ? -90 : 90;
  ring.push([darkPole, 180]);
  ring.push([darkPole, -180]);
  return ring;
}
