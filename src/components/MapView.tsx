import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Aircraft, Ship, Satellite, RadioStation, CctvCamera, BaseLayerKey, LayerKey, SelectedTarget } from '@/types';
import { planeIcon, jetIcon, heliIcon, shipIcon, warshipIcon, satIcon, radioIcon, cctvIcon, selectedPulse, targetReticleIcon } from '@/lib/icons';
import { UNDERSEA_CABLES } from '@/lib/cables';

type Props = {
  baseLayer: BaseLayerKey;
  layers: Record<LayerKey, boolean>;
  aircraft: Aircraft[];
  ships: Ship[];
  satellites: Satellite[];
  radios: RadioStation[];
  cctv: CctvCamera[];
  selected: SelectedTarget;
  onSelect: (t: SelectedTarget) => void;
  onMapClick: (lat: number, lon: number, zoom: number) => void;
  onMapContextMenu: (lat: number, lon: number, zoom: number) => void;
  reticle: [number, number] | null;
  flyTo: [number, number, number?] | null;
  onFlyToDone: () => void;
  onCursorMove: (lat: number, lon: number, zoom: number) => void;
};

type TileLayerDef = { url: string; attribution: string; maxZoom: number; reference?: boolean };

const TILE_LAYERS: Record<BaseLayerKey, { base: TileLayerDef; reference?: TileLayerDef; maxZoom: number }> = {
  satellite: {
    base: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri World Imagery',
      maxZoom: 18,
    },
    reference: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri World Boundaries and Places',
      maxZoom: 18,
      reference: true,
    },
    maxZoom: 18,
  },
  dark: {
    base: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri Dark Gray Canvas',
      maxZoom: 16,
    },
    reference: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri Dark Gray Reference',
      maxZoom: 16,
      reference: true,
    },
    maxZoom: 16,
  },
  osm: {
    base: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: 'OpenStreetMap',
      maxZoom: 19,
    },
    maxZoom: 19,
  },
};

function FlyController({ flyTo, onFlyToDone }: { flyTo: [number, number, number?] | null; onFlyToDone: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo[0], flyTo[1]], flyTo[2] ?? 10, { duration: 1.5 });
      onFlyToDone();
    }
  }, [flyTo, map, onFlyToDone]);
  return null;
}

function BaseLayerSwitcher({ baseLayer }: { baseLayer: BaseLayerKey }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [baseLayer, map]);
  return null;
}

function MapEventHandler({
  onMapClick, onMapContextMenu, onCursorMove,
}: {
  onMapClick: (lat: number, lon: number, zoom: number) => void;
  onMapContextMenu: (lat: number, lon: number, zoom: number) => void;
  onCursorMove: (lat: number, lon: number, zoom: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      const map = e.target;
      onMapClick(e.latlng.lat, e.latlng.lng, map.getZoom());
    },
    contextmenu: (e) => {
      L.DomEvent.preventDefault(e.originalEvent);
      const map = e.target;
      onMapContextMenu(e.latlng.lat, e.latlng.lng, map.getZoom());
    },
    mousemove: (e) => {
      const map = e.target;
      onCursorMove(e.latlng.lat, e.latlng.lng, map.getZoom());
    },
  });
  return null;
}

export default function MapView({
  baseLayer, layers, aircraft, ships, satellites, radios, cctv, selected, onSelect, onMapClick, onMapContextMenu, reticle, flyTo, onFlyToDone, onCursorMove,
}: Props) {
  const tile = TILE_LAYERS[baseLayer];
  const selectedId = selected ? (selected.data as { id: string }).id : null;

  const civAircraft = useMemo(
    () => (layers.civAircraft ? aircraft.filter((a) => !a.military && !a.helicopter) : []),
    [aircraft, layers.civAircraft],
  );
  const milAircraft = useMemo(
    () => (layers.milAircraft ? aircraft.filter((a) => a.military && !a.helicopter) : []),
    [aircraft, layers.milAircraft],
  );
  const helicopters = useMemo(
    () => (layers.helicopters ? aircraft.filter((a) => a.helicopter) : []),
    [aircraft, layers.helicopters],
  );
  const civShips = useMemo(
    () => (layers.civShips ? ships.filter((s) => !s.naval) : []),
    [ships, layers.civShips],
  );
  const milShips = useMemo(
    () => (layers.milShips ? ships.filter((s) => s.naval) : []),
    [ships, layers.milShips],
  );

  const reticleIcon = useMemo(() => targetReticleIcon(), []);

  return (
    <MapContainer
      center={[30, 0]}
      zoom={3}
      minZoom={2}
      maxZoom={tile.maxZoom}
      zoomControl={true}
      worldCopyJump
      className="absolute inset-0"
      style={{ background: '#05080d', cursor: 'crosshair' }}
    >
      <TileLayer key={`base-${baseLayer}`} url={tile.base.url} attribution={tile.base.attribution} maxZoom={tile.base.maxZoom} />
      {tile.reference && (
        <TileLayer key={`ref-${baseLayer}`} url={tile.reference.url} attribution={tile.reference.attribution} maxZoom={tile.reference.maxZoom} />
      )}
      <BaseLayerSwitcher baseLayer={baseLayer} />
      <FlyController flyTo={flyTo} onFlyToDone={onFlyToDone} />
      <MapEventHandler onMapClick={onMapClick} onMapContextMenu={onMapContextMenu} onCursorMove={onCursorMove} />

      {/* Target reticle for clicked location */}
      {reticle && (
        <Marker position={reticle} icon={reticleIcon} interactive={false} />
      )}

      {/* Undersea cables */}
      {layers.cables &&
        UNDERSEA_CABLES.map((cable, i) => (
          <Polyline
            key={`cable-${i}`}
            positions={cable.path}
            pathOptions={{
              color: '#fbbf24',
              weight: 1.5,
              opacity: 0.55,
              dashArray: '6 4',
            }}
            eventHandlers={{
              mouseover: (e) => {
                const layer = e.target as L.Polyline;
                layer.setStyle({ weight: 3, opacity: 0.9 });
                layer.bindTooltip(cable.name, { className: 'hud-tooltip' }).openTooltip();
              },
              mouseout: (e) => {
                (e.target as L.Polyline).setStyle({ weight: 1.5, opacity: 0.55 });
              },
            }}
          />
        ))}

      {/* Civil aircraft trails */}
      {civAircraft.map((ac) =>
        ac.trail.length > 1 ? (
          <Polyline key={`trail-${ac.id}`} positions={ac.trail} pathOptions={{ color: '#22d3ee', weight: 1, opacity: 0.35 }} />
        ) : null,
      )}
      {/* Civil aircraft markers */}
      {civAircraft.map((ac) => (
        <Marker
          key={ac.id}
          position={[ac.lat, ac.lon]}
          icon={selectedId === ac.id ? selectedPulse('#22d3ee') : planeIcon(ac.heading ?? 0, false)}
          eventHandlers={{ click: () => onSelect({ kind: 'aircraft', data: ac }) }}
        />
      ))}

      {/* Military aircraft trails */}
      {milAircraft.map((ac) =>
        ac.trail.length > 1 ? (
          <Polyline key={`miltrail-${ac.id}`} positions={ac.trail} pathOptions={{ color: '#ff2d55', weight: 1, opacity: 0.4 }} />
        ) : null,
      )}
      {/* Military aircraft markers (delta jet, blinking red) */}
      {milAircraft.map((ac) => (
        <Marker
          key={ac.id}
          position={[ac.lat, ac.lon]}
          icon={selectedId === ac.id ? selectedPulse('#ff2d55') : jetIcon(ac.heading ?? 0)}
          eventHandlers={{ click: () => onSelect({ kind: 'aircraft', data: ac }) }}
        />
      ))}

      {/* Helicopter trails */}
      {helicopters.map((ac) =>
        ac.trail.length > 1 ? (
          <Polyline key={`helitrail-${ac.id}`} positions={ac.trail} pathOptions={{ color: ac.military ? '#ff2d55' : '#fbbf24', weight: 1, opacity: 0.35 }} />
        ) : null,
      )}
      {/* Helicopter markers */}
      {helicopters.map((ac) => (
        <Marker
          key={ac.id}
          position={[ac.lat, ac.lon]}
          icon={selectedId === ac.id ? selectedPulse(ac.military ? '#ff2d55' : '#fbbf24') : heliIcon(ac.heading ?? 0, ac.military)}
          eventHandlers={{ click: () => onSelect({ kind: 'aircraft', data: ac }) }}
        />
      ))}

      {/* Civil ship trails */}
      {civShips.map((s) =>
        s.trail.length > 1 ? (
          <Polyline key={`cstrail-${s.id}`} positions={s.trail} pathOptions={{ color: '#22d3ee', weight: 1, opacity: 0.35 }} />
        ) : null,
      )}
      {/* Civil ship markers */}
      {civShips.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lon]}
          icon={selectedId === s.id ? selectedPulse('#22d3ee') : shipIcon(s.heading, false)}
          eventHandlers={{ click: () => onSelect({ kind: 'ship', data: s }) }}
        />
      ))}

      {/* Naval ship trails */}
      {milShips.map((s) =>
        s.trail.length > 1 ? (
          <Polyline key={`mstrail-${s.id}`} positions={s.trail} pathOptions={{ color: '#ff2d55', weight: 1, opacity: 0.4 }} />
        ) : null,
      )}
      {/* Naval ship markers (warship with anchor badge) */}
      {milShips.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lon]}
          icon={selectedId === s.id ? selectedPulse('#ff2d55') : warshipIcon(s.heading)}
          eventHandlers={{ click: () => onSelect({ kind: 'ship', data: s }) }}
        />
      ))}

      {/* Satellite trails */}
      {layers.satellites &&
        satellites.map((sat) =>
          sat.trail.length > 1 ? (
            <Polyline
              key={`sattrail-${sat.id}`}
              positions={sat.trail}
              pathOptions={{
                color: sat.category === 'ISS' ? '#fbbf24' : sat.category === 'GPS' ? '#2dffaa' : '#a855f7',
                weight: 1,
                opacity: 0.4,
                dashArray: '3 3',
              }}
            />
          ) : null,
        )}

      {/* Satellite markers */}
      {layers.satellites &&
        satellites.map((sat) => (
          <Marker
            key={sat.id}
            position={[sat.lat, sat.lon]}
            icon={selectedId === sat.id ? selectedPulse('#fbbf24') : satIcon(sat.category)}
            eventHandlers={{ click: () => onSelect({ kind: 'satellite', data: sat }) }}
          />
        ))}

      {/* Radio markers */}
      {layers.radios &&
        radios.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat, r.lon]}
            icon={selectedId === r.id ? selectedPulse('#a855f7') : radioIcon()}
            eventHandlers={{ click: () => onSelect({ kind: 'radio', data: r }) }}
          />
        ))}

      {/* CCTV markers */}
      {layers.cctv &&
        cctv.map((c) => (
          <Marker
            key={c.id}
            position={[c.lat, c.lon]}
            icon={selectedId === c.id ? selectedPulse('#2dffaa') : cctvIcon()}
            eventHandlers={{ click: () => onSelect({ kind: 'cctv', data: c }) }}
          />
        ))}
    </MapContainer>
  );
}
