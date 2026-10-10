import { Fragment, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type {
  Aircraft, Ship, Satellite, RadioStation, CctvCamera, BaseLayerKey, LayerKey, SelectedTarget,
  Earthquake, CyberThreat, GlobalIncident, InfrastructureSite,
} from '@/types';
import {
  planeIcon, jetIcon, heliIcon, shipIcon, warshipIcon, satIcon, radioIcon, cctvIcon,
  selectedPulse, targetReticleIcon, nuclearIcon, baseIcon, conflictIcon, earthquakeIcon,
  cyberIcon, incidentIcon, infraIcon,
} from '@/lib/icons';
import { UNDERSEA_CABLES } from '@/lib/cables';
import { STRATEGIC_POINTS } from '@/lib/strategicPoints';
import { nightPolygon, subSolarPoint } from '@/lib/terminator';
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
  earthquakes: Earthquake[];
  cyber: CyberThreat[];
  incidents: GlobalIncident[];
  infrastructure: InfrastructureSite[];
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

/** Day/night terminator — recomputed on a 60 s cadence. */
function TerminatorLayer() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const ring = useMemo(() => nightPolygon(now), [now]);
  const sun = useMemo(() => subSolarPoint(now), [now]);

  return (
    <>
      <Polygon
        positions={ring}
        interactive={false}
        pathOptions={{ color: '#0b1220', weight: 0.5, opacity: 0.35, fillColor: '#02060f', fillOpacity: 0.42 }}
      />
      <CircleMarker
        center={[sun.lat, sun.lon]}
        radius={7}
        interactive={false}
        pathOptions={{ color: '#fbbf24', weight: 1.5, fillColor: '#fbbf24', fillOpacity: 0.85 }}
      />
    </>
  );
}

export default function MapView({
  baseLayer, layers, aircraft, ships, satellites, radios, cctv, earthquakes, cyber, incidents, infrastructure,
  selected, onSelect, onMapClick, onMapContextMenu, reticle, flyTo, onFlyToDone, onCursorMove,
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

  const satComms = useMemo(() => (layers.satComms ? satellites.filter((s) => s.group === 'comms') : []), [satellites, layers.satComms]);
  const satMil = useMemo(() => (layers.satMilitary ? satellites.filter((s) => s.group === 'military') : []), [satellites, layers.satMilitary]);
  const satNav = useMemo(() => (layers.satNav ? satellites.filter((s) => s.group === 'navigation') : []), [satellites, layers.satNav]);
  const satObs = useMemo(() => (layers.satEarthObs ? satellites.filter((s) => s.group === 'earthobs') : []), [satellites, layers.satEarthObs]);

  const reticleIcon = useMemo(() => targetReticleIcon(), []);

  const satLayers: { key: LayerKey; list: Satellite[] }[] = [
    { key: 'satComms', list: satComms },
    { key: 'satMilitary', list: satMil },
    { key: 'satNav', list: satNav },
    { key: 'satEarthObs', list: satObs },
  ];

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

      {/* Day / night terminator */}
      {layers.terminator && <TerminatorLayer />}

      {/* Target reticle for clicked location */}
      {reticle && <Marker position={reticle} icon={reticleIcon} interactive={false} />}

      {/* Undersea cables */}
      {layers.cables &&
        UNDERSEA_CABLES.map((cable, i) => (
          <Polyline
            key={`cable-${i}`}
            positions={cable.path}
            pathOptions={{ color: '#fbbf24', weight: 1.5, opacity: 0.55, dashArray: '6 4' }}
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

      {/* Strategic points */}
      {layers.strategic &&
        STRATEGIC_POINTS.map((pt) => (
          <Marker
            key={pt.id}
            position={[pt.lat, pt.lon]}
            icon={
              selectedId === pt.id
                ? selectedPulse(pt.category === 'conflict_zone' ? '#ff2d55' : pt.category === 'nuclear' ? '#fbbf24' : '#22d3ee')
                : pt.category === 'nuclear'
                  ? nuclearIcon()
                  : pt.category === 'military_base'
                    ? baseIcon()
                    : conflictIcon()
            }
            eventHandlers={{
              click: () => {
                if (pt.category === 'conflict_zone') {
                  onSelect({ kind: 'conflict', data: pt });
                } else {
                  onSelect({
                    kind: 'territory',
                    data: { id: pt.id, kind: 'territory', lat: pt.lat, lon: pt.lon, displayName: pt.name, country: pt.status, countryCode: '??' },
                  });
                }
              },
            }}
          />
        ))}

      {/* Infrastructure */}
      {layers.infrastructure &&
        infrastructure.map((site) => (
          <Marker
            key={site.id}
            position={[site.lat, site.lon]}
            icon={selectedId === site.id ? selectedPulse(INFRA_CATEGORY_COLOR[site.category]) : infraIcon(INFRA_CATEGORY_COLOR[site.category])}
            eventHandlers={{ click: () => onSelect({ kind: 'infrastructure', data: site }) }}
          />
        ))}

      {/* Cyber threats */}
      {layers.cyber &&
        cyber.map((t) => (
          <Marker
            key={t.id}
            position={[t.lat, t.lon]}
            icon={selectedId === t.id ? selectedPulse(CYBER_SEVERITY_COLOR[t.severity]) : cyberIcon(CYBER_SEVERITY_COLOR[t.severity])}
            eventHandlers={{ click: () => onSelect({ kind: 'cyber', data: t }) }}
          />
        ))}

      {/* Global incidents */}
      {layers.incidents &&
        incidents.map((inc) => (
          <Marker
            key={inc.id}
            position={[inc.lat, inc.lon]}
            icon={selectedId === inc.id ? selectedPulse(INCIDENT_CATEGORY_COLOR[inc.category]) : incidentIcon(INCIDENT_CATEGORY_COLOR[inc.category])}
            eventHandlers={{ click: () => onSelect({ kind: 'incident', data: inc }) }}
          />
        ))}

      {/* Earthquakes */}
      {layers.earthquakes &&
        earthquakes.map((eq) => (
          <Marker
            key={eq.id}
            position={[eq.lat, eq.lon]}
            icon={earthquakeIcon(eq.magnitude)}
            eventHandlers={{
              click: () =>
                onSelect({
                  kind: 'territory',
                  data: { id: eq.id, kind: 'territory', lat: eq.lat, lon: eq.lon, displayName: `M${eq.magnitude.toFixed(1)} Earthquake`, country: eq.place, countryCode: '??' },
                }),
            }}
          />
        ))}

      {/* Civil aircraft */}
      {civAircraft.map((ac) =>
        ac.trail.length > 1 ? (
          <Polyline key={`trail-${ac.id}`} positions={ac.trail} pathOptions={{ color: '#22d3ee', weight: 1, opacity: 0.35 }} />
        ) : null,
      )}
      {civAircraft.map((ac) => (
        <Marker
          key={ac.id}
          position={[ac.lat, ac.lon]}
          icon={selectedId === ac.id ? selectedPulse('#22d3ee') : planeIcon(ac.heading ?? 0, false)}
          eventHandlers={{ click: () => onSelect({ kind: 'aircraft', data: ac }) }}
        />
      ))}

      {/* Military aircraft */}
      {milAircraft.map((ac) =>
        ac.trail.length > 1 ? (
          <Polyline key={`miltrail-${ac.id}`} positions={ac.trail} pathOptions={{ color: '#ff2d55', weight: 1, opacity: 0.4 }} />
        ) : null,
      )}
      {milAircraft.map((ac) => (
        <Marker
          key={ac.id}
          position={[ac.lat, ac.lon]}
          icon={selectedId === ac.id ? selectedPulse('#ff2d55') : jetIcon(ac.heading ?? 0)}
          eventHandlers={{ click: () => onSelect({ kind: 'aircraft', data: ac }) }}
        />
      ))}

      {/* Helicopters */}
      {helicopters.map((ac) =>
        ac.trail.length > 1 ? (
          <Polyline key={`helitrail-${ac.id}`} positions={ac.trail} pathOptions={{ color: ac.military ? '#ff2d55' : '#fbbf24', weight: 1, opacity: 0.35 }} />
        ) : null,
      )}
      {helicopters.map((ac) => (
        <Marker
          key={ac.id}
          position={[ac.lat, ac.lon]}
          icon={selectedId === ac.id ? selectedPulse(ac.military ? '#ff2d55' : '#fbbf24') : heliIcon(ac.heading ?? 0, ac.military)}
          eventHandlers={{ click: () => onSelect({ kind: 'aircraft', data: ac }) }}
        />
      ))}

      {/* Civil ships */}
      {civShips.map((s) =>
        s.trail.length > 1 ? (
          <Polyline key={`cstrail-${s.id}`} positions={s.trail} pathOptions={{ color: '#22d3ee', weight: 1, opacity: 0.35 }} />
        ) : null,
      )}
      {civShips.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lon]}
          icon={selectedId === s.id ? selectedPulse('#22d3ee') : shipIcon(s.heading, false)}
          eventHandlers={{ click: () => onSelect({ kind: 'ship', data: s }) }}
        />
      ))}

      {/* Naval ships */}
      {milShips.map((s) =>
        s.trail.length > 1 ? (
          <Polyline key={`mstrail-${s.id}`} positions={s.trail} pathOptions={{ color: '#ff2d55', weight: 1, opacity: 0.4 }} />
        ) : null,
      )}
      {milShips.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lon]}
          icon={selectedId === s.id ? selectedPulse('#ff2d55') : warshipIcon(s.heading)}
          eventHandlers={{ click: () => onSelect({ kind: 'ship', data: s }) }}
        />
      ))}

      {/* Satellites — four groups */}
      {satLayers.map(({ key, list }) => (
        <Fragment key={key}>
          {list.map((sat) =>
            sat.trail.length > 1 ? (
              <Polyline
                key={`sattrail-${sat.id}`}
                positions={sat.trail}
                pathOptions={{ color: SAT_GROUP_COLOR[sat.group], weight: 1, opacity: 0.4, dashArray: '3 3' }}
              />
            ) : null,
          )}
          {list.map((sat) => (
            <Marker
              key={sat.id}
              position={[sat.lat, sat.lon]}
              icon={selectedId === sat.id ? selectedPulse(SAT_GROUP_COLOR[sat.group]) : satIcon(sat.category, SAT_GROUP_COLOR[sat.group])}
              eventHandlers={{ click: () => onSelect({ kind: 'satellite', data: sat }) }}
            />
          ))}
        </Fragment>
      ))}

      {/* Radios */}
      {layers.radios &&
        radios.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat, r.lon]}
            icon={selectedId === r.id ? selectedPulse('#a855f7') : radioIcon()}
            eventHandlers={{ click: () => onSelect({ kind: 'radio', data: r }) }}
          />
        ))}

      {/* CCTV */}
      {layers.cctv &&
        cctv.map((c) => (
          <Marker
            key={c.id}
            position={[c.lat, c.lon]}
            icon={selectedId === c.id ? selectedPulse('#2dffaa') : cctvIcon()}
            eventHandlers={{ click: () => onSelect({ kind: 'cctv', data: c }) }}
          >
            <Tooltip direction="top" offset={[0, -8]} className="hud-tooltip">
              {c.name}
            </Tooltip>
          </Marker>
        ))}
    </MapContainer>
  );
}
