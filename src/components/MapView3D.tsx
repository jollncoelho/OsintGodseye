import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MLMap, Marker as MLMarker, MapMouseEvent } from 'maplibre-gl';
import type {
  Aircraft, Ship, Satellite, RadioStation, CctvCamera, BaseLayerKey, LayerKey, SelectedTarget,
  CyberThreat, GlobalIncident, InfrastructureSite,
} from '@/types';
import { nightPolygon } from '@/lib/terminator';
import { CYBER_SEVERITY_COLOR } from '@/lib/cyber';
import { INCIDENT_CATEGORY_COLOR } from '@/lib/incidents';
import { INFRA_CATEGORY_COLOR } from '@/lib/infrastructure';
import { SAT_GROUP_COLOR } from '@/lib/satelliteColors';

type Props = {
  baseLayer: BaseLayerKey;
  layers: Record<LayerKey, boolean>;
  aircraft: Aircraft[];
  ships: Ship[];
  satellites: Satellite[];
  radios: RadioStation[];
  cctv: CctvCamera[];
  cyber: CyberThreat[];
  incidents: GlobalIncident[];
  infrastructure: InfrastructureSite[];
  selected: SelectedTarget;
  onSelect: (t: SelectedTarget) => void;
  onMapClick: (lat: number, lon: number, zoom: number) => void;
  onCursorMove: (lat: number, lon: number, zoom: number) => void;
  pitch: number;
  bearing: number;
  terrainEnabled: boolean;
  hillshadeEnabled: boolean;
  buildings3DEnabled: boolean;
  flyTo: [number, number, number?] | null;
  onFlyToDone: () => void;
  reticle: [number, number] | null;
};

const TILE_SOURCES: Record<BaseLayerKey, { url: string; maxZoom: number }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
  },
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
  },
  osm: {
    url: 'https://demotiles.maplibre.org/style/osm-bright-gl-style/style.json',
    maxZoom: 19,
  },
};

/** Keyless global vector tiles with a `building` source-layer (OpenFreeMap). */
const BUILDINGS_TILES = 'https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf';
const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

function planeSvg(heading: number, military: boolean): string {
  const color = military ? '#ff2d55' : '#22d3ee';
  return `<svg viewBox="0 0 24 24" width="24" height="24" style="transform:rotate(${heading}deg);fill:${color};stroke:#0a0f18;stroke-width:0.4"><path d="M12 2L13.2 9.5 21 11.5 21 13 13.2 12.6 13.5 18 16 19.5 16 20.5 12.5 19.5 11.5 20.5 8 20.5 8 19.5 10.5 18 10.8 12.6 3 13 3 11.5 10.8 9.5z"/></svg>`;
}

function jetSvg(heading: number): string {
  return `<svg viewBox="0 0 24 24" width="22" height="22" style="transform:rotate(${heading}deg);fill:#ff2d55;stroke:#0a0f18;stroke-width:0.4"><path d="M12 1.5L10.5 9 3 12.5 3 13.5 10.5 12 9.5 18 12 17.5 14.5 18 13.5 12 10.5 13.5 21 12.5 21 11.5 13.5 12 13.5 3 11.5 3 10.5 12z"/></svg>`;
}

function heliSvg(heading: number, military: boolean): string {
  const color = military ? '#ff2d55' : '#fbbf24';
  return `<svg viewBox="0 0 24 24" width="22" height="22" style="transform:rotate(${heading}deg)"><path d="M2 5L22 5 M12 5L12 8 M8 8L16 8L17 13L14 15L10 15L7 13z M12 15L12 21 M10 21L14 21" fill="none" stroke="${color}" stroke-width="1.4"/><path d="M8 8L16 8L17 13L14 15L10 15L7 13z" fill="${color}" stroke="none"/></svg>`;
}

function shipSvg(heading: number, naval: boolean): string {
  const color = naval ? '#ff2d55' : '#22d3ee';
  return `<svg viewBox="0 0 24 24" width="22" height="22" style="transform:rotate(${heading}deg);fill:${color};stroke:#0a0f18;stroke-width:0.5"><path d="M3 13L21 13L20 17L4 17Z M12 3L12 13 M9 6L15 6L15 11L9 11Z"/></svg>`;
}

function satSvg(color: string): string {
  return `<svg viewBox="0 0 24 24" width="20" height="20" style="fill:none;stroke:${color};stroke-width:1.6"><path d="M12 7a5 5 0 100 10 5 5 0 000-10z M4 9l4 0 M4 15l4 0 M16 9l4 0 M16 15l4 0 M9 4l0 4 M15 4l0 4 M9 16l0 4 M15 16l0 4"/></svg>`;
}

function radioSvg(): string {
  return `<svg viewBox="0 0 24 24" width="18" height="18" style="fill:#a855f7;stroke:#0a0f18;stroke-width:0.4"><circle cx="12" cy="12" r="4"/><path d="M7 7a7 7 0 000 10 M17 7a7 7 0 010 10 M4 4a11 11 0 000 16 M20 4a11 11 0 010 16" fill="none" stroke="#a855f7" stroke-width="1.2"/></svg>`;
}

function cctvSvg(): string {
  return `<svg viewBox="0 0 24 24" width="20" height="20" style="fill:#2dffaa;stroke:#0a0f18;stroke-width:0.4"><rect x="5" y="7" width="11" height="7" rx="1.5" transform="rotate(-15 10 10)"/><path d="M16 10l4-2v3l-4 1z"/><circle cx="10" cy="10.5" r="1.8" fill="#0a0f18"/></svg>`;
}

function cyberSvg(color: string): string {
  return `<svg viewBox="0 0 24 24" width="20" height="20" style="fill:none;stroke:${color};stroke-width:1.5"><rect x="4" y="4" width="16" height="12" rx="1.5"/><path d="M8 20h8 M12 16v4 M8.5 10.5l1.8 1.8 3.2-3.6"/></svg>`;
}

function incidentSvg(color: string): string {
  return `<svg viewBox="0 0 24 24" width="20" height="20" style="fill:none;stroke:${color};stroke-width:1.5"><circle cx="12" cy="12" r="8"/><path d="M12 7.5v5.5" stroke-width="1.8"/><circle cx="12" cy="16.2" r="1" fill="${color}" stroke="none"/></svg>`;
}

function infraSvg(color: string): string {
  return `<svg viewBox="0 0 24 24" width="18" height="18" style="fill:none;stroke:${color};stroke-width="1.4"><path d="M4 20V9l8-5 8 5v11 M9 20v-6h6v6 M4 20h16"/></svg>`;
}

function reticleSvg(): string {
  return `<div style="position:relative;width:48px;height:48px">
    <div class="pulse-ring" style="position:absolute;inset:0;border:2px solid #22d3ee;border-radius:50%"></div>
    <div style="position:absolute;inset:0;border:1px solid #22d3ee;border-radius:50%;opacity:0.5"></div>
    <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:#22d3ee;opacity:0.4;transform:translateX(-50%)"></div>
    <div style="position:absolute;top:50%;left:0;height:1px;width:100%;background:#22d3ee;opacity:0.4;transform:translateY(-50%)"></div>
    <div style="position:absolute;left:50%;top:50%;width:4px;height:4px;background:#ff2d55;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 8px #ff2d55"></div>
  </div>`;
}

function createMarkerEl(svg: string, selected: boolean): HTMLElement {
  const el = document.createElement('div');
  el.style.cursor = 'pointer';
  el.innerHTML = selected
    ? `<div style="position:relative;width:40px;height:40px">
        <div style="position:absolute;inset:0;border:2px solid #22d3ee;border-radius:50%;opacity:0.6"></div>
        <div class="pulse-ring" style="position:absolute;inset:0;border:2px solid #22d3ee;border-radius:50%"></div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">${svg}</div>
      </div>`
    : svg;
  return el;
}

export default function MapView3D({
  baseLayer, layers, aircraft, ships, satellites, radios, cctv, cyber, incidents, infrastructure, selected, onSelect,
  onMapClick, onCursorMove, pitch, bearing, terrainEnabled, hillshadeEnabled, buildings3DEnabled,
  flyTo, onFlyToDone, reticle,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Map<string, MLMarker>>(new Map());
  /**
   * Last rendered appearance per marker id (`svg|selected`).
   *
   * The marker sync effect re-runs on every data tick, and rebuilding the DOM
   * of every marker on each pass is ruinous once hundreds of live AIS vessels
   * are on screen. Markers whose visual is unchanged only get a cheap
   * `setLngLat`, which is what a position update should cost.
   */
  const markerPaintRef = useRef<Map<string, string>>(new Map());
  const [mapReady, setMapReady] = useState(false);
  const selectedId = selected ? (selected.data as { id: string }).id : null;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const ts = TILE_SOURCES[baseLayer];
    const isStyleJson = ts.url.endsWith('.json');

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: isStyleJson
        ? ts.url
        : {
            version: 8,
            projection: { type: 'globe' },
            sources: {
              'raster-tiles': {
                type: 'raster',
                tiles: [ts.url],
                tileSize: 256,
                maxzoom: ts.maxZoom,
                attribution: baseLayer === 'satellite' ? 'Esri World Imagery' : 'Esri Dark Gray',
              },
            },
            layers: [
              { id: 'background', type: 'background', paint: { 'background-color': '#020408' } },
              { id: 'raster-layer', type: 'raster', source: 'raster-tiles', minzoom: 0, maxzoom: ts.maxZoom },
            ],
          },
      center: [20, 10],
      zoom: 1.8,
      pitch: 0,
      bearing: 0,
      maxZoom: ts.maxZoom,
      minZoom: 1,
      hash: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Every optional layer is added defensively: a single failed upstream
      // source must never abort the rest of the map (this is what used to
      // leave the 3D view black).
      try { map.setProjection({ type: 'globe' }); } catch { /* already globe */ }

      try {
        map.addSource('terrain', {
          type: 'raster-dem',
          tiles: [TERRAIN_TILES],
          encoding: 'terrarium',
          tileSize: 256,
          maxzoom: 15,
        });
      } catch { /* terrain unavailable */ }

      try {
        map.addSource('hillshade-source', {
          type: 'raster-dem',
          tiles: [TERRAIN_TILES],
          encoding: 'terrarium',
          tileSize: 256,
          maxzoom: 15,
        });
        map.addLayer({
          id: 'hillshade',
          type: 'hillshade',
          source: 'hillshade-source',
          layout: { visibility: 'none' },
          paint: {
            'hillshade-shadow-color': '#0a0f18',
            'hillshade-illumination-direction': 315,
            // MapLibre caps this at 1; a higher value makes addLayer reject the
            // whole layer, which then breaks every later setLayoutProperty call.
            'hillshade-exaggeration': 1,
          },
        });
      } catch { /* hillshade unavailable */ }

      // OpenFreeMap planet vector tiles — keyless, has a `building` layer.
      try {
        map.addSource('osm-buildings', {
          type: 'vector',
          tiles: [BUILDINGS_TILES],
          maxzoom: 14,
        });
        map.addLayer({
          id: '3d-buildings',
          type: 'fill-extrusion',
          source: 'osm-buildings',
          'source-layer': 'building',
          minzoom: 13,
          layout: { visibility: 'none' },
          paint: {
            'fill-extrusion-color': [
              'interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 10],
              0, '#0a0f18', 50, '#0891b2', 100, '#22d3ee', 200, '#fbbf24',
            ],
            'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.7,
          },
        });
      } catch { /* vector tiles unavailable */ }

      // Day/night terminator
      try {
        addTerminatorLayer(map);
      } catch { /* terminator unavailable */ }

      try {
        (map as unknown as { setFog: (o: Record<string, unknown>) => void }).setFog({
          color: 'rgba(10, 15, 24, 0.6)',
          'high-color': 'rgba(34, 211, 238, 0.08)',
          'horizon-blend': 0.15,
          'space-color': '#020408',
          'star-intensity': 0.6,
        });
      } catch { /* fog unavailable */ }

      if (baseLayer === 'satellite') {
        try {
          map.addSource('ref-labels', {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            maxzoom: 18,
          });
          map.addLayer({
            id: 'ref-labels-layer',
            type: 'raster',
            source: 'ref-labels',
            minzoom: 0,
            maxzoom: 18,
          });
        } catch { /* labels unavailable */ }
      }

      setMapReady(true);
    });

    map.on('click', (e: MapMouseEvent) => {
      onMapClick(e.lngLat.lat, e.lngLat.lng, map.getZoom());
    });

    map.on('mousemove', (e: MapMouseEvent) => {
      onCursorMove(e.lngLat.lat, e.lngLat.lng, map.getZoom());
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.easeTo({ pitch, bearing, duration: 500 });
  }, [pitch, bearing, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.jumpTo({ center: [20, 10], zoom: 1.8, pitch: 0, bearing: 0 });
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    try {
      if (terrainEnabled) map.setTerrain({ source: 'terrain', exaggeration: 1.5 });
      else map.setTerrain(null);
    } catch { /* terrain source missing */ }
  }, [terrainEnabled, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    try {
      if (map.getLayer('hillshade')) {
        map.setLayoutProperty('hillshade', 'visibility', hillshadeEnabled ? 'visible' : 'none');
      }
    } catch { /* layer missing */ }
  }, [hillshadeEnabled, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    try {
      if (map.getLayer('3d-buildings')) {
        map.setLayoutProperty('3d-buildings', 'visibility', buildings3DEnabled ? 'visible' : 'none');
      }
    } catch { /* layer missing */ }
  }, [buildings3DEnabled, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !flyTo) return;
    map.flyTo({
      center: [flyTo[1], flyTo[0]],
      zoom: flyTo[2] ?? Math.max(map.getZoom(), 8),
      pitch: Math.max(map.getPitch(), 30),
      bearing: map.getBearing(),
      duration: 2000,
      essential: true,
    });
    onFlyToDone();
  }, [flyTo, mapReady, onFlyToDone]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const existingIds = new Set(markersRef.current.keys());
    const activeIds = new Set<string>();

    const addMarker = (id: string, lat: number, lon: number, svg: string, kind: string, data: unknown) => {
      activeIds.add(id);
      const existing = markersRef.current.get(id);
      const isSelected = selectedId === id;
      const paint = `${svg}|${isSelected}`;
      if (existing) {
        existing.setLngLat([lon, lat]);
        // Only touch the DOM when the marker actually looks different.
        if (markerPaintRef.current.get(id) !== paint) {
          const el = existing.getElement();
          const newEl = createMarkerEl(svg, isSelected);
          el.replaceChildren(...Array.from(newEl.childNodes));
          markerPaintRef.current.set(id, paint);
        }
        return;
      }
      const el = createMarkerEl(svg, isSelected);
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([lon, lat]).addTo(map);
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        onSelect({ kind, data } as never);
      });
      markersRef.current.set(id, marker);
      markerPaintRef.current.set(id, paint);
    };

    if (layers.civAircraft) aircraft.filter((a) => !a.military && !a.helicopter).forEach((ac) => addMarker(ac.id, ac.lat, ac.lon, planeSvg(ac.heading ?? 0, false), 'aircraft', ac));
    if (layers.milAircraft) aircraft.filter((a) => a.military && !a.helicopter).forEach((ac) => addMarker(ac.id, ac.lat, ac.lon, jetSvg(ac.heading ?? 0), 'aircraft', ac));
    if (layers.helicopters) aircraft.filter((a) => a.helicopter).forEach((ac) => addMarker(ac.id, ac.lat, ac.lon, heliSvg(ac.heading ?? 0, ac.military), 'aircraft', ac));

    if (layers.civShips) ships.filter((s) => !s.naval).forEach((s) => addMarker(s.id, s.lat, s.lon, shipSvg(s.heading, false), 'ship', s));
    if (layers.milShips) ships.filter((s) => s.naval).forEach((s) => addMarker(s.id, s.lat, s.lon, shipSvg(s.heading, true), 'ship', s));

    const satGroups: [LayerKey, Satellite['group']][] = [
      ['satComms', 'comms'],
      ['satMilitary', 'military'],
      ['satNav', 'navigation'],
      ['satEarthObs', 'earthobs'],
    ];
    for (const [key, group] of satGroups) {
      if (!layers[key]) continue;
      satellites.filter((s) => s.group === group).forEach((sat) => addMarker(sat.id, sat.lat, sat.lon, satSvg(SAT_GROUP_COLOR[group]), 'satellite', sat));
    }

    if (layers.radios) radios.forEach((r) => addMarker(r.id, r.lat, r.lon, radioSvg(), 'radio', r));
    if (layers.cctv) cctv.forEach((c) => addMarker(c.id, c.lat, c.lon, cctvSvg(), 'cctv', c));
    if (layers.cyber) cyber.forEach((t) => addMarker(t.id, t.lat, t.lon, cyberSvg(CYBER_SEVERITY_COLOR[t.severity]), 'cyber', t));
    if (layers.incidents) incidents.forEach((i) => addMarker(i.id, i.lat, i.lon, incidentSvg(INCIDENT_CATEGORY_COLOR[i.category]), 'incident', i));
    if (layers.infrastructure) infrastructure.forEach((s) => addMarker(s.id, s.lat, s.lon, infraSvg(INFRA_CATEGORY_COLOR[s.category]), 'infrastructure', s));

    if (reticle) {
      const rid = 'reticle-marker';
      activeIds.add(rid);
      const existing = markersRef.current.get(rid);
      if (existing) {
        existing.setLngLat([reticle[1], reticle[0]]);
      } else {
        const el = document.createElement('div');
        el.style.pointerEvents = 'none';
        el.innerHTML = reticleSvg();
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([reticle[1], reticle[0]]).addTo(map);
        markersRef.current.set(rid, marker);
      }
    }

    existingIds.forEach((id) => {
      if (!activeIds.has(id)) {
        const m = markersRef.current.get(id);
        if (m) {
          m.remove();
          markersRef.current.delete(id);
          markerPaintRef.current.delete(id);
        }
      }
    });
  }, [aircraft, ships, satellites, radios, cctv, cyber, incidents, infrastructure, layers, mapReady, selectedId, onSelect, reticle]);

  return <div ref={containerRef} className="absolute inset-0" style={{ background: '#020408', cursor: 'crosshair' }} />;
}

function addTerminatorLayer(map: MLMap) {
  const ring = nightPolygon(new Date());
  // Close the ring (first point repeated) — an unclosed ring renders as a
  // sliver in MapLibre.
  const closed = ring.map(([lat, lon]) => [lon, lat] as [number, number]);
  if (closed.length && (closed[0][0] !== closed[closed.length - 1][0] || closed[0][1] !== closed[closed.length - 1][1])) {
    closed.push(closed[0]);
  }

  map.addSource('terminator', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [closed] },
      properties: {},
    } as never,
  });

  map.addLayer({
    id: 'terminator-fill',
    type: 'fill',
    source: 'terminator',
    paint: { 'fill-color': '#020408', 'fill-opacity': 0.45 },
  });
}
