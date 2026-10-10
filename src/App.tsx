import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe, Map as MapIcon } from 'lucide-react';
import MapView from '@/components/MapView';
import MapView3D from '@/components/MapView3D';
import TopBar from '@/components/TopBar';
import LeftSidebar from '@/components/LeftSidebar';
import TargetPanel from '@/components/TargetPanel';
import BottomBar from '@/components/BottomBar';
import ReconToolkit from '@/components/ReconToolkit';
import LiveFeedsModal from '@/components/LiveFeedsModal';
import CameraGalleryModal from '@/components/CameraGalleryModal';
import { useAircraft } from '@/hooks/useAircraft';
import { useRadios } from '@/hooks/useRadios';
import { useTerritoryIntel } from '@/hooks/useTerritoryIntel';
import { useEarthquakes } from '@/hooks/useEarthquakes';
import { useCctvCameras } from '@/hooks/useCctvCameras';
import { useVessels } from '@/hooks/useVessels';
import { MOCK_SHIPS, MOCK_CCTV, MOCK_HELICOPTERS } from '@/lib/mockData';
import { buildSatellitesWithTrails, SAT_CATALOG_SIZE } from '@/lib/satellites';
import { buildCyberThreats } from '@/lib/cyber';
import { INCIDENTS } from '@/lib/incidents';
import { INFRASTRUCTURE_SITES } from '@/lib/infrastructure';
import { STRATEGIC_POINTS } from '@/lib/strategicPoints';
import { UNDERSEA_CABLES } from '@/lib/cables';
import type { LayerKey, BaseLayerKey, ShaderKey, SelectedTarget, LogEntry, Ship, Satellite, Aircraft } from '@/types';
import { formatUTC } from '@/lib/format';

const SHADER_CLASS: Record<ShaderKey, string> = {
  standard: '',
  nvg: 'shader-nvg',
  thermal: 'shader-thermal',
  crt: 'shader-crt',
};

const INITIAL_LAYERS: Record<LayerKey, boolean> = {
  civAircraft: true,
  milAircraft: true,
  helicopters: true,
  civShips: true,
  milShips: true,
  satComms: false,
  satMilitary: true,
  satNav: false,
  satEarthObs: false,
  cables: false,
  cctv: true,
  radios: false,
  strategic: false,
  infrastructure: false,
  earthquakes: false,
  incidents: false,
  cyber: false,
  terminator: false,
};

export default function App() {
  const [baseLayer, setBaseLayer] = useState<BaseLayerKey>('satellite');
  const [shader, setShader] = useState<ShaderKey>('standard');
  const [collapsed, setCollapsed] = useState(false);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(INITIAL_LAYERS);
  const [selected, setSelected] = useState<SelectedTarget>(null);
  const [search, setSearch] = useState('');
  const [flyTo, setFlyTo] = useState<[number, number, number?] | null>(null);
  const [locating, setLocating] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [searchResults, setSearchResults] = useState<import('@/components/TopBar').SearchResultItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchAlert, setSearchAlert] = useState<string | null>(null);
  const [activeRadio, setActiveRadio] = useState<import('@/types').RadioStation | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const [reticle, setReticle] = useState<[number, number] | null>(null);
  const [cursor, setCursor] = useState<{ lat: number; lon: number; zoom: number } | null>(null);
  const [showLiveFeeds, setShowLiveFeeds] = useState(false);
  const [showCameraGallery, setShowCameraGallery] = useState(false);
  const { fetchTerritory } = useTerritoryIntel();

  // 3D camera state
  const [is3DActive, setIs3DActive] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [terrainEnabled, setTerrainEnabled] = useState(false);
  const [hillshadeEnabled, setHillshadeEnabled] = useState(false);
  const [buildings3DEnabled, setBuildings3DEnabled] = useState(false);

  const anyAircraftLayer = layers.civAircraft || layers.milAircraft || layers.helicopters;
  const { aircraft: liveAircraft, loading: acLoading, error: acError } = useAircraft(anyAircraftLayer, false);

  const allAircraft: Aircraft[] = useMemo(() => {
    const liveHeli = liveAircraft.filter((a) => a.helicopter);
    const liveFixed = liveAircraft.filter((a) => !a.helicopter);
    const mockHeliFiltered = MOCK_HELICOPTERS.filter((m) => !liveHeli.some((l) => l.icao24 === m.icao24));
    return [...liveFixed, ...liveHeli, ...mockHeliFiltered];
  }, [liveAircraft]);

  const { radios, loading: radioLoading, error: radioError } = useRadios(layers.radios);
  const { earthquakes, loading: eqLoading, error: eqError } = useEarthquakes(layers.earthquakes);
  const { cameras: liveCameras, loading: cctvLoading, error: cctvError, source: cctvSource } = useCctvCameras(layers.cctv);
  const { vessels: liveVessels, loading: vesselLoading, error: vesselError, source: vesselSource } = useVessels(layers.civShips);

  // Live cameras when available, curated fallback only when every provider failed.
  const allCctv = useMemo(
    () => (liveCameras.length > 0 ? liveCameras : MOCK_CCTV),
    [liveCameras],
  );

  // Curated reference fleet — these drift on a simulation tick so the layer is
  // never static. Live AIS targets (id prefix `ais-`) carry real positions and
  // are deliberately excluded from that drift.
  const [refShips, setRefShips] = useState<Ship[]>(MOCK_SHIPS);

  /**
   * Merge real AIS traffic with the curated reference fleet.
   *
   * There is no keyless *global* AIS feed — Digitraffic covers the Baltic /
   * Gulf of Finland (~800-900 targets). The curated set therefore stays in the
   * mix to keep worldwide coverage of notable naval and merchant vessels.
   */
  const ships = useMemo<Ship[]>(() => {
    if (liveVessels.length === 0) return refShips;
    return [...liveVessels, ...refShips];
  }, [refShips, liveVessels]);
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const cyber = useMemo(() => buildCyberThreats(), []);

  const addLog = useCallback((level: LogEntry['level'], msg: string) => {
    setLogs((prev) => {
      const next = [...prev, { id: logIdRef.current++, time: formatUTC(new Date()), level, msg }];
      return next.slice(-60);
    });
  }, []);

  useEffect(() => {
    addLog('info', "OSINT GOD'S EYE geospatial intelligence platform initialized");
    addLog('info', 'Connecting to ADSB.lol live feed...');
    addLog('info', 'Esri World Imagery tile source online');
    addLog('info', `Orbital propagator armed — ${SAT_CATALOG_SIZE} satellites across 4 constellations`);
    addLog('warn', `Submarine cable overlay: ${UNDERSEA_CABLES.length} backbone routes loaded`);
    addLog('info', `Strategic points database: ${STRATEGIC_POINTS.length} sites loaded`);
    addLog('info', `Infrastructure reference: ${INFRASTRUCTURE_SITES.length} critical sites`);
    addLog('info', `Global incident log: ${INCIDENTS.length} events indexed`);
    addLog('info', 'USGS seismic feed: standing by');
    addLog('info', 'Digitraffic AIS marine feed: standing by');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (acError) addLog('alert', `ADS-B feed degraded: ${acError} — using cached data`);
    else if (!acLoading && liveAircraft.length > 0) {
      const mil = liveAircraft.filter((a) => a.military).length;
      const heli = liveAircraft.filter((a) => a.helicopter).length;
      addLog('info', `ADS-B sync: ${liveAircraft.length} aircraft loaded (${mil} military, ${heli} rotary)`);
    }
  }, [liveAircraft, acLoading, acError, addLog]);

  useEffect(() => {
    if (radioError) addLog('warn', `Radio-Browser unreachable: ${radioError}`);
    else if (!radioLoading && radios.length > 0) addLog('info', `Radio layer: ${radios.length} live stations`);
  }, [radios, radioLoading, radioError, addLog]);

  useEffect(() => {
    if (eqError) addLog('warn', `USGS seismic feed error: ${eqError}`);
    else if (!eqLoading && earthquakes.length > 0) addLog('info', `Seismic monitor: ${earthquakes.length} events (M2.5+) in last 24h`);
  }, [earthquakes, eqLoading, eqError, addLog]);

  useEffect(() => {
    if (cctvError && !cctvLoading) addLog('warn', `Camera feeds: ${cctvError} — using curated fallback`);
    else if (!cctvLoading && liveCameras.length > 0) {
      addLog('info', `Camera network online: ${liveCameras.length} live feeds (${cctvSource ?? 'server'})`);
    }
  }, [liveCameras, cctvLoading, cctvError, cctvSource, addLog]);

  useEffect(() => {
    if (vesselError && !vesselLoading) addLog('warn', `AIS feed degraded: ${vesselError}`);
    else if (!vesselLoading && liveVessels.length > 0) {
      const naval = liveVessels.filter((v) => v.naval).length;
      addLog('info', `AIS sync: ${liveVessels.length} live vessels (${naval} naval, ${vesselSource ?? 'server'})`);
    }
  }, [liveVessels, vesselLoading, vesselError, vesselSource, addLog]);

  // Reference-fleet drift simulation (live AIS targets are never moved).
  useEffect(() => {
    const id = setInterval(() => {
      setRefShips((prev) =>
        prev.map((s) => {
          const rad = (s.heading * Math.PI) / 180;
          const dist = (s.speed * 0.0005) / 60;
          const newLat = s.lat + Math.cos(rad) * dist;
          let newLon = s.lon + Math.sin(rad) * dist;
          if (newLon > 180) newLon -= 360;
          if (newLon < -180) newLon += 360;
          const trail = [...s.trail, [newLat, newLon] as [number, number]];
          if (trail.length > 30) trail.shift();
          return { ...s, lat: newLat, lon: newLon, trail };
        }),
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Satellite propagation
  useEffect(() => {
    const tick = () => setSatellites(buildSatellitesWithTrails(Date.now()));
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);

  // Random tactical events
  useEffect(() => {
    const id = setInterval(() => {
      const events: [LogEntry['level'], string][] = [
        ['info', 'SIGINT sweep complete — no anomalies in current sector'],
        ['info', 'AIS beacon handshake confirmed across maritime nodes'],
        ['warn', 'Unidentified track detected near contested airspace'],
        ['alert', 'Military flight RCH358 entered monitored zone'],
        ['info', 'Satellite uplink stable — ISS pass in 14 min'],
        ['warn', 'Submarine cable integrity check: SEA-ME-WE 5 nominal'],
        ['info', 'Radio frequency scan: 4 new stations acquired'],
        ['warn', 'Seismic anomaly detected — reviewing USGS data'],
        ['info', 'Camera network refresh complete — feeds nominal'],
      ];
      const [lvl, msg] = events[Math.floor(Math.random() * events.length)];
      addLog(lvl, msg);
    }, 9000);
    return () => clearInterval(id);
  }, [addLog]);

  const toggleLayer = useCallback((k: LayerKey) => {
    setLayers((prev) => ({ ...prev, [k]: !prev[k] }));
  }, []);

  const handleMapClick = useCallback(() => {
    setSelected(null);
    setReticle(null);
  }, []);

  const inspectTerritory = useCallback(async (lat: number, lon: number, zoom: number = 16) => {
    setReticle([lat, lon]);
    setSelected({ kind: 'territory', data: { id: `territory-${lat.toFixed(4)}-${lon.toFixed(4)}`, kind: 'territory', lat, lon, displayName: 'Resolving location...', country: 'Unknown', countryCode: '??' } });
    try {
      const intel = await fetchTerritory(lat, lon, zoom);
      setSelected({ kind: 'territory', data: intel });
      addLog('info', `Territory intel: ${intel.displayName} (${intel.country})`);
    } catch {
      addLog('alert', `Reverse geocoding failed for ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
  }, [fetchTerritory, addLog]);

  const handleMapContextMenu = useCallback(async (lat: number, lon: number, zoom: number) => {
    addLog('warn', `Right-click designate: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    await inspectTerritory(lat, lon, zoom);
  }, [inspectTerritory, addLog]);

  const handleCursorMove = useCallback((lat: number, lon: number, zoom: number) => {
    setCursor({ lat, lon, zoom });
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { lat: number; lon: number };
      setFlyTo([detail.lat, detail.lon, 16]);
    };
    window.addEventListener('godseye-zoom-satellite', handler);
    return () => window.removeEventListener('godseye-zoom-satellite', handler);
  }, []);

  const handleToggle3D = useCallback(() => {
    setIs3DActive((prev) => {
      const next = !prev;
      if (next) {
        setPitch(0);
        setBearing(0);
        setTerrainEnabled(true);
        setHillshadeEnabled(true);
        addLog('info', '3D globe view engaged — pitch 0°, terrain armed');
      } else {
        setPitch(0);
        setBearing(0);
        setTerrainEnabled(false);
        setHillshadeEnabled(false);
        setBuildings3DEnabled(false);
        addLog('info', '2D tactical view restored');
      }
      return next;
    });
  }, [addLog]);

  const handleSelect = useCallback((t: SelectedTarget) => {
    setSelected(t);
    if (t) {
      const name =
        t.kind === 'aircraft' ? t.data.callsign :
        t.kind === 'ship' ? t.data.name :
        t.kind === 'satellite' ? t.data.name :
        t.kind === 'radio' ? t.data.name :
        t.kind === 'cctv' ? t.data.name :
        t.kind === 'cyber' ? t.data.targetOrg :
        t.kind === 'incident' ? t.data.title :
        t.kind === 'infrastructure' ? t.data.name :
        t.kind === 'conflict' ? t.data.name :
        t.data.displayName;
      addLog('info', `Target acquired: ${t.kind.toUpperCase()} ${name}`);
      if (t.kind === 'radio') setActiveRadio(t.data);
    }
  }, [addLog]);

  const navigateToCoordinates = useCallback((lat: number, lon: number, label: string, zoom = 17) => {
    setFlyTo([lat, lon, zoom]);
    addLog('info', `Target acquired: ${label}`);
    inspectTerritory(lat, lon, zoom);
  }, [addLog, inspectTerritory]);

  // URL deep-link: ?lat=...&lon=...&label=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat') ?? '');
    const lon = parseFloat(params.get('lon') ?? '');
    const label = params.get('label');
    if (!Number.isNaN(lat) && !Number.isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      const displayLabel = label || `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      const timer = setTimeout(() => navigateToCoordinates(lat, lon, displayLabel, 16), 800);
      return () => clearTimeout(timer);
    }
  }, [navigateToCoordinates]);

  // Live search suggestions (Photon) — powers the dropdown that previously
  // never received any data.
  useEffect(() => {
    const q = search.trim();
    if (q.length < 3 || /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(q)) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const items = (data.features ?? []).map((f: { geometry: { coordinates: [number, number] }; properties: Record<string, string> }) => ({
          displayName: [f.properties.name, f.properties.city, f.properties.country].filter(Boolean).join(', ') || q,
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          type: f.properties.osm_value ?? f.properties.type,
        }));
        if (!cancelled) {
          setSearchResults(items);
          setShowResults(items.length > 0);
        }
      } catch {
        /* suggestions are best-effort */
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const handleSearch = useCallback(async () => {
    const q = search.trim();
    if (!q) return;
    setShowResults(false);

    const coordMatch = q.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[3]);
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        addLog('warn', `Invalid coordinates: "${q}"`);
        return;
      }
      navigateToCoordinates(lat, lon, `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      return;
    }

    const upper = q.toUpperCase();
    const ac = allAircraft.find((a) => a.callsign.toUpperCase().includes(upper) || a.icao24.toUpperCase() === upper);
    if (ac) {
      setSelected({ kind: 'aircraft', data: ac });
      setFlyTo([ac.lat, ac.lon, 12]);
      addLog('info', `Track locked: ${ac.callsign}`);
      return;
    }
    const sh = ships.find((s) => s.name.toUpperCase().includes(upper) || s.mmsi === upper);
    if (sh) {
      setSelected({ kind: 'ship', data: sh });
      setFlyTo([sh.lat, sh.lon, 12]);
      addLog('info', `Track locked: ${sh.name}`);
      return;
    }
    const sat = satellites.find((s) => s.name.toUpperCase().includes(upper) || s.category.toUpperCase().includes(upper));
    if (sat) {
      setSelected({ kind: 'satellite', data: sat });
      setFlyTo([sat.lat, sat.lon, 8]);
      addLog('info', `Track locked: ${sat.name}`);
      return;
    }
    const infra = INFRASTRUCTURE_SITES.find((s) => s.name.toUpperCase().includes(upper));
    if (infra) {
      setSelected({ kind: 'infrastructure', data: infra });
      setFlyTo([infra.lat, infra.lon, 10]);
      addLog('info', `Site locked: ${infra.name}`);
      return;
    }

    setLocating(true);
    addLog('info', `Searching: "${q}"...`);

    try {
      try {
        const photonRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`);
        if (photonRes.ok) {
          const photonData = await photonRes.json();
          if (photonData.features && photonData.features.length > 0) {
            const [lon, lat] = photonData.features[0].geometry.coordinates as [number, number];
            const props = photonData.features[0].properties as { name?: string; city?: string; country?: string };
            const placeName = [props.name, props.city, props.country].filter(Boolean).join(', ') || q;
            navigateToCoordinates(lat, lon, placeName);
            return;
          }
        }
      } catch (err) {
        console.warn('Photon API failed, falling back to Nominatim...', err);
      }

      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1&accept-language=fr,pt,en`,
          { headers: { Accept: 'application/json' } },
        );
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (nomData && nomData.length > 0) {
            navigateToCoordinates(parseFloat(nomData[0].lat), parseFloat(nomData[0].lon), nomData[0].display_name);
            return;
          }
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      }

      addLog('warn', `Target not found: "${q}"`);
      setSearchAlert(`Aucun résultat trouvé pour "${q}". Vérifiez l'orthographe.`);
      setTimeout(() => setSearchAlert(null), 4000);
    } finally {
      setLocating(false);
    }
  }, [search, allAircraft, ships, satellites, addLog, navigateToCoordinates]);

  const handlePickResult = useCallback((item: import('@/components/TopBar').SearchResultItem) => {
    setShowResults(false);
    setSearch(item.displayName);
    setFlyTo([item.lat, item.lon, 14]);
    addLog('info', `Location selected: ${item.displayName}`);
    inspectTerritory(item.lat, item.lon, 14);
  }, [addLog, inspectTerritory]);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      addLog('warn', 'Geolocation not supported by this browser');
      return;
    }
    setGeolocating(true);
    addLog('info', 'Requesting GPS position...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setFlyTo([lat, lon, 16]);
        addLog('info', `GPS position: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        inspectTerritory(lat, lon, 16);
        setGeolocating(false);
      },
      (err) => {
        addLog('warn', `GPS failed: ${err.message}`);
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [addLog, inspectTerritory]);

  const counts = useMemo<Record<LayerKey, number>>(() => ({
    civAircraft: layers.civAircraft ? allAircraft.filter((a) => !a.military && !a.helicopter).length : 0,
    milAircraft: layers.milAircraft ? allAircraft.filter((a) => a.military && !a.helicopter).length : 0,
    helicopters: layers.helicopters ? allAircraft.filter((a) => a.helicopter).length : 0,
    civShips: layers.civShips ? ships.filter((s) => !s.naval).length : 0,
    milShips: layers.milShips ? ships.filter((s) => s.naval).length : 0,
    satComms: layers.satComms ? satellites.filter((s) => s.group === 'comms').length : 0,
    satMilitary: layers.satMilitary ? satellites.filter((s) => s.group === 'military').length : 0,
    satNav: layers.satNav ? satellites.filter((s) => s.group === 'navigation').length : 0,
    satEarthObs: layers.satEarthObs ? satellites.filter((s) => s.group === 'earthobs').length : 0,
    cables: layers.cables ? UNDERSEA_CABLES.length : 0,
    cctv: layers.cctv ? allCctv.length : 0,
    radios: layers.radios ? radios.length : 0,
    strategic: layers.strategic ? STRATEGIC_POINTS.length : 0,
    infrastructure: layers.infrastructure ? INFRASTRUCTURE_SITES.length : 0,
    earthquakes: layers.earthquakes ? earthquakes.length : 0,
    incidents: layers.incidents ? INCIDENTS.length : 0,
    cyber: layers.cyber ? cyber.length : 0,
    terminator: layers.terminator ? 1 : 0,
  }), [layers, allAircraft, ships, satellites, radios, earthquakes, allCctv, cyber]);

  const sharedMapProps = {
    baseLayer,
    layers,
    aircraft: allAircraft,
    ships,
    satellites,
    radios,
    cctv: allCctv,
    cyber,
    incidents: INCIDENTS,
    infrastructure: INFRASTRUCTURE_SITES,
    selected,
    onSelect: handleSelect,
    onMapClick: handleMapClick,
    onCursorMove: handleCursorMove,
    reticle,
    flyTo,
    onFlyToDone: () => setFlyTo(null),
  };

  return (
    <div className="hud-frame relative flex h-screen w-screen flex-col overflow-hidden bg-hud-bg">
      <TopBar
        search={search}
        onSearch={setSearch}
        onSearchSubmit={handleSearch}
        onGeolocate={handleGeolocate}
        locating={locating}
        geolocating={geolocating}
        searchResults={searchResults}
        onPickResult={handlePickResult}
        showResults={showResults}
        setShowResults={setShowResults}
        cursor={cursor}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <LeftSidebar
          layers={layers}
          toggleLayer={toggleLayer}
          counts={counts}
          baseLayer={baseLayer}
          setBaseLayer={setBaseLayer}
          shader={shader}
          setShader={setShader}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        <div className={`relative flex-1 ${SHADER_CLASS[shader]}`}>
          <div className="shader-overlay" />
          {is3DActive ? (
            <MapView3D
              {...sharedMapProps}
              pitch={pitch}
              bearing={bearing}
              terrainEnabled={terrainEnabled}
              hillshadeEnabled={hillshadeEnabled}
              buildings3DEnabled={buildings3DEnabled}
            />
          ) : (
            <MapView
              {...sharedMapProps}
              earthquakes={earthquakes}
              onMapContextMenu={handleMapContextMenu}
            />
          )}

          <div className="pointer-events-none absolute right-3 top-16 z-[650] flex items-center gap-2">
            <div className="border border-cyan/25 bg-black/70 px-2 py-1 text-[9px] text-cyan/70">
              {baseLayer.toUpperCase()} · {shader.toUpperCase()} · {is3DActive ? '3D' : '2D'}
            </div>
          </div>

          <ReconToolkit
            earthquakes={earthquakes}
            eqLoading={eqLoading}
            eqError={eqError}
            cyberCount={layers.cyber ? cyber.length : 0}
            onOpenLiveFeeds={() => setShowLiveFeeds(true)}
            onOpenCameraGallery={() => setShowCameraGallery(true)}
            onToggleCctv={() => toggleLayer('cctv')}
            cctvActive={layers.cctv}
            cctvCount={allCctv.length}
          />

          {cursor && (
            <div className="pointer-events-none absolute bottom-3 left-3 z-[650]">
              <div className="border border-cyan/25 bg-black/70 px-3 py-1.5 text-[10px] tabular-nums text-cyan/80">
                <span className="text-slate-500">LAT</span> {cursor.lat.toFixed(4)}° &nbsp;
                <span className="text-slate-500">LON</span> {cursor.lon.toFixed(4)}° &nbsp;
                <span className="text-slate-500">Z</span> {cursor.zoom}
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-1/2 z-[660] flex -translate-x-1/2 items-center gap-0 border border-cyan/30 bg-black/85 no-select backdrop-blur-md">
            <button
              onClick={handleToggle3D}
              className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold tracking-wider transition ${is3DActive ? 'bg-cyan/15 text-cyan' : 'text-slate-500 hover:text-cyan/80'}`}
            >
              <Globe className="h-4 w-4" />
              3D GLOBE
            </button>
            <div className="h-6 w-px bg-cyan/25" />
            <button
              onClick={handleToggle3D}
              className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold tracking-wider transition ${!is3DActive ? 'bg-cyan/15 text-cyan' : 'text-slate-500 hover:text-cyan/80'}`}
            >
              <MapIcon className="h-4 w-4" />
              2D PLAN
            </button>
          </div>

          {selected && <TargetPanel target={selected} onClose={() => setSelected(null)} />}

          {searchAlert && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-[850] -translate-x-1/2">
              <div className="border border-amber/40 bg-black/90 px-4 py-2 text-[11px] font-semibold text-amber shadow-lg">
                {searchAlert}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomBar logs={logs} activeRadio={activeRadio} onClearRadio={() => setActiveRadio(null)} />

      {showLiveFeeds && <LiveFeedsModal onClose={() => setShowLiveFeeds(false)} />}
      {showCameraGallery && (
        <CameraGalleryModal
          cameras={allCctv}
          loading={cctvLoading}
          source={cctvSource}
          onClose={() => setShowCameraGallery(false)}
          onFlyTo={(lat, lon, name) => {
            setShowCameraGallery(false);
            setFlyTo([lat, lon, 15]);
            addLog('info', `Camera selected: ${name}`);
          }}
        />
      )}
    </div>
  );
}
