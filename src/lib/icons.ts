import L from 'leaflet';

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
  const color = military ? '#ff2d55' : '#22d3ee';
  return svgWrap(
    `<svg viewBox="0 0 24 24" width="28" height="28" class="plane-svg${military ? ' mil' : ''}" style="transform:rotate(${heading}deg);transform-origin:center;fill:${color};stroke:#0a0f18;stroke-width:0.4">
      <path d="${planePath}"/>
    </svg>`,
  );
}

// Delta-wing fighter jet silhouette (military)
const jetPath =
  'M12 1.5L10.5 9 3 12.5 3 13.5 10.5 12 9.5 18 12 17.5 14.5 18 13.5 12 10.5 13.5 21 12.5 21 11.5 13.5 12 13.5 3 11.5 3 10.5 12z';

export function jetIcon(heading: number): L.DivIcon {
  return svgWrap(
    `<svg viewBox="0 0 24 24" width="26" height="26" class="plane-svg mil blink" style="transform:rotate(${heading}deg);transform-origin:center;fill:#ff2d55;stroke:#0a0f18;stroke-width:0.4">
      <path d="${jetPath}"/>
    </svg>`,
  );
}

// Helicopter silhouette (rotor on top, tail boom)
const heliPath =
  'M2 5L22 5 M12 5L12 8 M8 8L16 8L17 13L14 15L10 15L7 13z M12 15L12 21 M10 21L14 21';

export function heliIcon(heading: number, military: boolean): L.DivIcon {
  const color = military ? '#ff2d55' : '#fbbf24';
  return svgWrap(
    `<svg viewBox="0 0 24 24" width="26" height="26" class="plane-svg${military ? ' mil' : ''}" style="transform:rotate(${heading}deg);transform-origin:center;fill:${color};stroke:#0a0f18;stroke-width:0.4">
      <path d="${heliPath}" fill="none" stroke="${color}" stroke-width="1.4"/>
      <path d="M8 8L16 8L17 13L14 15L10 15L7 13z" fill="${color}" stroke="none"/>
    </svg>`,
  );
}

const shipPath =
  'M3 13L21 13L20 17L4 17Z M12 3L12 13 M9 6L15 6L15 11L9 11Z';

export function shipIcon(heading: number, naval: boolean): L.DivIcon {
  const color = naval ? '#ff2d55' : '#22d3ee';
  return svgWrap(
    `<svg viewBox="0 0 24 24" width="26" height="26" class="ship-svg${naval ? ' naval' : ''}" style="transform:rotate(${heading}deg);transform-origin:center;fill:${color};stroke:#0a0f18;stroke-width:0.5">
      <path d="${shipPath}"/>
    </svg>`,
  );
}

// Naval warship silhouette with radar mast + anchor badge
const warshipPath =
  'M2 14L22 14L20.5 18L3.5 18Z M12 4L12 14 M10 4L14 4 M9 7L15 7L15 12L9 12z';
const anchorPath =
  'M12 19a2 2 0 100 0.01';

export function warshipIcon(heading: number): L.DivIcon {
  return svgWrap(
    `<svg viewBox="0 0 24 24" width="28" height="28" class="ship-svg naval" style="transform:rotate(${heading}deg);transform-origin:center;fill:#ff2d55;stroke:#0a0f18;stroke-width:0.5">
      <path d="${warshipPath}"/>
      <circle cx="12" cy="3" r="1.2" fill="#fbbf24" stroke="none"/>
      <path d="${anchorPath}" fill="none" stroke="#fbbf24" stroke-width="1"/>
    </svg>`,
  );
}

const satPath =
  'M12 7a5 5 0 100 10 5 5 0 000-10z M4 9l4 0 M4 15l4 0 M16 9l4 0 M16 15l4 0 M9 4l0 4 M15 4l0 4 M9 16l0 4 M15 16l0 4';

export function satIcon(category: string): L.DivIcon {
  const color =
    category === 'ISS' ? '#fbbf24' : category === 'GPS' ? '#2dffaa' : '#a855f7';
  return svgWrap(
    `<svg viewBox="0 0 24 24" width="24" height="24" class="sat-svg" style="fill:none;stroke:${color};stroke-width:1.6">
      <path d="${satPath}"/>
    </svg>
    <div style="position:absolute;top:-2px;left:-2px;width:28px;height:28px;border:1px solid ${color};border-radius:50%;opacity:0.4"></div>`,
  );
}

export function radioIcon(): L.DivIcon {
  return svgWrap(
    `<svg viewBox="0 0 24 24" width="20" height="20" class="radio-svg" style="fill:#a855f7;stroke:#0a0f18;stroke-width:0.4">
      <circle cx="12" cy="12" r="4"/>
      <path d="M7 7a7 7 0 000 10 M17 7a7 7 0 010 10 M4 4a11 11 0 000 16 M20 4a11 11 0 010 16" fill="none" stroke="#a855f7" stroke-width="1.2"/>
    </svg>`,
  );
}

export function cctvIcon(): L.DivIcon {
  return svgWrap(
    `<svg viewBox="0 0 24 24" width="22" height="22" class="cctv-svg" style="fill:#2dffaa;stroke:#0a0f18;stroke-width:0.4">
      <rect x="5" y="7" width="11" height="7" rx="1.5" transform="rotate(-15 10 10)"/>
      <path d="M16 10l4-2v3l-4 1z"/>
      <circle cx="10" cy="10.5" r="1.8" fill="#0a0f18"/>
    </svg>`,
  );
}

export function selectedPulse(color = '#22d3ee'): L.DivIcon {
  return L.divIcon({
    className: 'hud-icon',
    html: `<div style="position:relative;width:40px;height:40px">
      <div style="position:absolute;inset:0;border:2px solid ${color};border-radius:50%;opacity:0.6"></div>
      <div class="pulse-ring" style="position:absolute;inset:0;border:2px solid ${color};border-radius:50%"></div>
      <div style="position:absolute;inset:12px;border:1px solid ${color};border-radius:50%"></div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

// Tactical targeting reticle for clicked map locations
export function targetReticleIcon(): L.DivIcon {
  return L.divIcon({
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
  });
}
