import L from 'leaflet';

/**
 * Icon cache.
 *
 * react-leaflet calls `marker.setIcon(icon)` whenever the `icon` prop changes
 * identity — and `setIcon` tears down and rebuilds the marker's DOM node. With
 * ~800 live AIS vessels on screen, rebuilding every icon on every render is
 * catastrophic (measured: a 4.5 s main-thread stall).
 *
 * These factories are pure functions of a handful of small integer/boolean
 * arguments, so caching by argument key makes the returned icon referentially
 * stable and lets react-leaflet skip the DOM work entirely.
 */
const iconCache = new Map<string, L.DivIcon>();
const ICON_CACHE_MAX = 4096;

function cached(key: string, make: () => L.DivIcon): L.DivIcon {
  const hit = iconCache.get(key);
  if (hit) return hit;
  const icon = make();
  // Headings are rounded to whole degrees, so the key space is bounded in
  // practice; this guard only exists to keep a pathological input from
  // growing the map without limit.
  if (iconCache.size >= ICON_CACHE_MAX) iconCache.clear();
  iconCache.set(key, icon);
  return icon;
}

/** Normalise a heading to a stable integer in [0, 360). */
const hdg = (heading: number) => ((Math.round(heading) % 360) + 360) % 360;

const svgWrap = (svg: string, w = 28, h = 28) =>
  L.divIcon({
    className: 'hud-icon',
    html: svg,
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
  });

const planePath =
  'M12 2L13.2 9.5 21 11.5 21 13 13.2 12.6 13.5 18 16 19.5 16 20.5 12.5 19.5 11.5 20.5 8 20.5 8 19.5 10.5 18 10.8 12.6 3 13 3 11.5 10.8 9.5z';

export function planeIcon(heading: number, military: boolean): L.DivIcon {
  return cached(`plane:${hdg(heading)}:${military}`, () => {
    const color = military ? '#ff2d55' : '#22d3ee';
    return svgWrap(
      `<svg viewBox="0 0 24 24" width="28" height="28" class="plane-svg${military ? ' mil' : ''}" style="transform:rotate(${hdg(heading)}deg);transform-origin:center;fill:${color};stroke:#0a0f18;stroke-width:0.4">
      <path d="${planePath}"/>
    </svg>`,
    );
  });
}

// Delta-wing fighter jet silhouette (military)
const jetPath =
  'M12 1.5L10.5 9 3 12.5 3 13.5 10.5 12 9.5 18 12 17.5 14.5 18 13.5 12 10.5 13.5 21 12.5 21 11.5 13.5 12 13.5 3 11.5 3 10.5 12z';

export function jetIcon(heading: number): L.DivIcon {
  return cached(`jet:${hdg(heading)}`, () =>
    svgWrap(
      `<svg viewBox="0 0 24 24" width="26" height="26" class="plane-svg mil blink" style="transform:rotate(${hdg(heading)}deg);transform-origin:center;fill:#ff2d55;stroke:#0a0f18;stroke-width:0.4">
      <path d="${jetPath}"/>
    </svg>`,
    ),
  );
}

// Helicopter silhouette (rotor on top, tail boom)
const heliPath =
  'M2 5L22 5 M12 5L12 8 M8 8L16 8L17 13L14 15L10 15L7 13z M12 15L12 21 M10 21L14 21';

export function heliIcon(heading: number, military: boolean): L.DivIcon {
  return cached(`heli:${hdg(heading)}:${military}`, () => {
    const color = military ? '#ff2d55' : '#fbbf24';
    return svgWrap(
      `<svg viewBox="0 0 24 24" width="26" height="26" class="plane-svg${military ? ' mil' : ''}" style="transform:rotate(${hdg(heading)}deg);transform-origin:center;fill:${color};stroke:#0a0f18;stroke-width:0.4">
      <path d="${heliPath}" fill="none" stroke="${color}" stroke-width="1.4"/>
      <path d="M8 8L16 8L17 13L14 15L10 15L7 13z" fill="${color}" stroke="none"/>
    </svg>`,
    );
  });
}

const shipPath =
  'M3 13L21 13L20 17L4 17Z M12 3L12 13 M9 6L15 6L15 11L9 11Z';

export function shipIcon(heading: number, naval: boolean): L.DivIcon {
  return cached(`ship:${hdg(heading)}:${naval}`, () => {
    const color = naval ? '#ff2d55' : '#22d3ee';
    return svgWrap(
      `<svg viewBox="0 0 24 24" width="26" height="26" class="ship-svg${naval ? ' naval' : ''}" style="transform:rotate(${hdg(heading)}deg);transform-origin:center;fill:${color};stroke:#0a0f18;stroke-width:0.5">
      <path d="${shipPath}"/>
    </svg>`,
    );
  });
}

// Naval warship silhouette with radar mast + anchor badge
const warshipPath =
  'M2 14L22 14L20.5 18L3.5 18Z M12 4L12 14 M10 4L14 4 M9 7L15 7L15 12L9 12z';
const anchorPath =
  'M12 19a2 2 0 100 0.01';

export function warshipIcon(heading: number): L.DivIcon {
  return cached(`warship:${hdg(heading)}`, () =>
    svgWrap(
      `<svg viewBox="0 0 24 24" width="28" height="28" class="ship-svg naval" style="transform:rotate(${hdg(heading)}deg);transform-origin:center;fill:#ff2d55;stroke:#0a0f18;stroke-width:0.5">
      <path d="${warshipPath}"/>
      <circle cx="12" cy="3" r="1.2" fill="#fbbf24" stroke="none"/>
      <path d="${anchorPath}" fill="none" stroke="#fbbf24" stroke-width="1"/>
    </svg>`,
    ),
  );
}

const satPath =
  'M12 7a5 5 0 100 10 5 5 0 000-10z M4 9l4 0 M4 15l4 0 M16 9l4 0 M16 15l4 0 M9 4l0 4 M15 4l0 4 M9 16l0 4 M15 16l0 4';

export function satIcon(category: string, overrideColor?: string): L.DivIcon {
  const color =
    overrideColor ??
    (category === 'ISS' ? '#fbbf24' : category === 'GPS' ? '#2dffaa' : '#a855f7');
  return cached(`sat:${category}:${color}`, () =>
    svgWrap(
      `<svg viewBox="0 0 24 24" width="24" height="24" class="sat-svg" style="fill:none;stroke:${color};stroke-width:1.6">
      <path d="${satPath}"/>
    </svg>
    <div style="position:absolute;top:-2px;left:-2px;width:28px;height:28px;border:1px solid ${color};border-radius:50%;opacity:0.4"></div>`,
    ),
  );
}

export function radioIcon(): L.DivIcon {
  return cached('radio', () =>
    svgWrap(
      `<svg viewBox="0 0 24 24" width="20" height="20" class="radio-svg" style="fill:#a855f7;stroke:#0a0f18;stroke-width:0.4">
      <circle cx="12" cy="12" r="4"/>
      <path d="M7 7a7 7 0 000 10 M17 7a7 7 0 010 10 M4 4a11 11 0 000 16 M20 4a11 11 0 010 16" fill="none" stroke="#a855f7" stroke-width="1.2"/>
    </svg>`,
    ),
  );
}

export function cctvIcon(): L.DivIcon {
  return cached('cctv', () =>
    svgWrap(
      `<svg viewBox="0 0 24 24" width="22" height="22" class="cctv-svg" style="fill:#2dffaa;stroke:#0a0f18;stroke-width:0.4">
      <rect x="5" y="7" width="11" height="7" rx="1.5" transform="rotate(-15 10 10)"/>
      <path d="M16 10l4-2v3l-4 1z"/>
      <circle cx="10" cy="10.5" r="1.8" fill="#0a0f18"/>
    </svg>`,
    ),
  );
}

export function nuclearIcon(): L.DivIcon {
  return cached('nuclear', () =>
    svgWrap(
      `<svg viewBox="0 0 24 24" width="22" height="22" style="fill:none;stroke:#fbbf24;stroke-width:1.5">
      <circle cx="12" cy="12" r="3" fill="#fbbf24"/>
      <ellipse cx="12" cy="12" rx="8" ry="3.5" fill="none"/>
      <ellipse cx="12" cy="12" rx="8" ry="3.5" fill="none" transform="rotate(60 12 12)"/>
      <ellipse cx="12" cy="12" rx="8" ry="3.5" fill="none" transform="rotate(120 12 12)"/>
    </svg>`,
    ),
  );
}

export function baseIcon(): L.DivIcon {
  return cached('base', () =>
    svgWrap(
      `<svg viewBox="0 0 24 24" width="22" height="22" style="fill:#22d3ee;stroke:#0a0f18;stroke-width:0.4">
      <path d="M12 2L4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" fill="none" stroke="#22d3ee" stroke-width="1.5"/>
      <path d="M12 2L4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" fill="#22d3ee" opacity="0.15"/>
      <circle cx="12" cy="10" r="2" fill="#22d3ee"/>
    </svg>`,
    ),
  );
}

export function conflictIcon(): L.DivIcon {
  return cached('conflict', () =>
    svgWrap(
      `<svg viewBox="0 0 24 24" width="24" height="24" style="fill:#ff2d55;stroke:#0a0f18;stroke-width:0.4">
      <path d="M12 2L2 22h20z" fill="none" stroke="#ff2d55" stroke-width="1.5"/>
      <path d="M12 2L2 22h20z" fill="#ff2d55" opacity="0.15"/>
      <path d="M12 9v6M12 18v1" stroke="#ff2d55" stroke-width="2"/>
    </svg>`,
    ),
  );
}

export function earthquakeIcon(magnitude: number): L.DivIcon {
  const size = Math.round(Math.min(28, 14 + magnitude * 2));
  const color = magnitude >= 6 ? '#ff2d55' : magnitude >= 4.5 ? '#fbbf24' : '#22d3ee';
  return cached(`eq:${size}:${color}`, () =>
    svgWrap(
      `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="fill:none;stroke:${color};stroke-width:1.5">
      <circle cx="12" cy="12" r="3" fill="${color}" stroke="none"/>
      <circle cx="12" cy="12" r="6" opacity="0.6"/>
      <circle cx="12" cy="12" r="9" opacity="0.3"/>
    </svg>`,
      size, size,
    ),
  );
}

// ---------- Cyber / incidents / infrastructure ----------

export function cyberIcon(color: string): L.DivIcon {
  return cached(`cyber:${color}`, () =>
    svgWrap(
      `<svg viewBox="0 0 24 24" width="22" height="22" style="fill:none;stroke:${color};stroke-width:1.5">
      <rect x="4" y="4" width="16" height="12" rx="1.5" fill="${color}" opacity="0.14"/>
      <rect x="4" y="4" width="16" height="12" rx="1.5"/>
      <path d="M8 20h8 M12 16v4"/>
      <path d="M8.5 10.5l1.8 1.8 3.2-3.6" stroke-width="1.6"/>
    </svg>`,
    ),
  );
}

export function incidentIcon(color: string): L.DivIcon {
  return cached(`incident:${color}`, () =>
    svgWrap(
      `<svg viewBox="0 0 24 24" width="22" height="22" style="fill:none;stroke:${color};stroke-width:1.5">
      <circle cx="12" cy="12" r="8" fill="${color}" opacity="0.12"/>
      <circle cx="12" cy="12" r="8"/>
      <path d="M12 7.5v5.5" stroke-width="1.8"/>
      <circle cx="12" cy="16.2" r="1" fill="${color}" stroke="none"/>
    </svg>`,
    ),
  );
}

export function infraIcon(color: string): L.DivIcon {
  return cached(`infra:${color}`, () =>
    svgWrap(
      `<svg viewBox="0 0 24 24" width="20" height="20" style="fill:none;stroke:${color};stroke-width:1.4">
      <path d="M4 20V9l8-5 8 5v11z" fill="${color}" opacity="0.12"/>
      <path d="M4 20V9l8-5 8 5v11"/>
      <path d="M9 20v-6h6v6"/>
      <path d="M4 20h16"/>
    </svg>`,
    ),
  );
}

export function sunIcon(): L.DivIcon {
  return cached('sun', () =>
    svgWrap(
      `<svg viewBox="0 0 24 24" width="20" height="20" style="fill:#fbbf24;stroke:none">
      <circle cx="12" cy="12" r="4"/>
      <g stroke="#fbbf24" stroke-width="1.4" fill="none">
        <path d="M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M19.1 4.9L17 7 M7 17l-2.1 2.1"/>
      </g>
    </svg>`,
    ),
  );
}


export function selectedPulse(color = '#22d3ee'): L.DivIcon {
  return cached(`pulse:${color}`, () =>
    L.divIcon({
      className: 'hud-icon',
      html: `<div style="position:relative;width:40px;height:40px">
      <div style="position:absolute;inset:0;border:2px solid ${color};border-radius:50%;opacity:0.6"></div>
      <div class="pulse-ring" style="position:absolute;inset:0;border:2px solid ${color};border-radius:50%"></div>
      <div style="position:absolute;inset:12px;border:1px solid ${color};border-radius:50%"></div>
    </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    }),
  );
}

// Tactical targeting reticle for clicked map locations
export function targetReticleIcon(): L.DivIcon {
  return cached('reticle', () =>
    L.divIcon({
      className: 'hud-icon',
      html: `<div style="position:relative;width:48px;height:48px">
      <div class="pulse-ring" style="position:absolute;inset:0;border:2px solid #22d3ee;border-radius:50%"></div>
      <div style="position:absolute;inset:0;border:1px solid #22d3ee;border-radius:50%;opacity:0.5"></div>
      <div style="position:absolute;inset:8px;border:1px solid #22d3ee;border-radius:50%;opacity:0.7"></div>
      <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:#22d3ee;opacity:0.4;transform:translateX(-50%)"></div>
      <div style="position:absolute;top:50%;left:0;height:1px;width:100%;background:#22d3ee;opacity:0.4;transform:translateY(-50%)"></div>
      <div style="position:absolute;left:50%;top:50%;width:4px;height:4px;background:#ff2d55;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 8px #ff2d55"></div>
    </div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    }),
  );
}

