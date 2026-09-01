import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapView from '@/components/MapView';
import MapView3D from '@/components/MapView3D';
import TopBar from '@/components/TopBar';
import LeftSidebar from '@/components/LeftSidebar';
import TargetPanel from '@/components/TargetPanel';
import BottomBar from '@/components/BottomBar';
import CameraControls3D from '@/components/CameraControls3D';
import { useAircraft } from '@/hooks/useAircraft';
import { useRadios } from '@/hooks/useRadios';
import { useTerritoryIntel } from '@/hooks/useTerritoryIntel';
import { MOCK_SHIPS, MOCK_CCTV, MOCK_HELICOPTERS, buildSatellitesWithTrails } from '@/lib/mockData';
import type {
  LayerKey, BaseLayerKey, ShaderKey, SelectedTarget, LogEntry, Ship, Satellite, Aircraft,
} from '@/types';
import { formatUTC } from '@/lib/format';

const SHADER_CLASS: Record<ShaderKey, string> = {
  standard: '',
  nvg: 'shader-nvg',
  thermal: 'shader-thermal',
  crt: 'shader-crt',
};

export default function App() {
  const [baseLayer, setBaseLayer] = useState<BaseLayerKey>('satellite');
  const [shader, setShader] = useState<ShaderKey>('standard');
  const [collapsed, setCollapsed] = useState(false);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    civAircraft: true,
    milAircraft: true,
    helicopters: true,
    civShips: true,
    milShips: true,
    satellites: true,
    cables: true,
    cctv: true,
    radios: false,
  });
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
  const { fetchTerritory } = useTerritoryIntel();

  // 3D camera state
  const [is3DActive, setIs3DActive] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [terrainEnabled, setTerrainEnabled] = useState(false);
  const [hillshadeEnabled, setHillshadeEnabled] = useState(false);
  const [buildings3DEnabled, setBuildings3DEnabled] = useState(false);

  // Fetch live aircraft whenever any aircraft layer is active
  const anyAircraftLayer = layers.civAircraft || layers.milAircraft || layers.helicopters;
  const { aircraft: liveAircraft, loading: acLoading, error: acError } = useAircraft(anyAircraftLayer, false);

  // Merge live aircraft with mock helicopters
  const allAircraft: Aircraft[] = useMemo(() => {
    const liveHeli = liveAircraft.filter((a) => a.helicopter);
    const liveFixed = liveAircraft.filter((a) => !a.helicopter);
    // avoid id collisions
    const mockHeliFiltered = MOCK_HELICOPTERS.filter((m) => !liveHeli.some((l) => l.icao24 === m.icao24));
    return [...liveFixed, ...liveHeli, ...mockHeliFiltered];
  }, [liveAircraft]);

  const { radios, loading: radioLoading, error: radioError } = useRadios(layers.radios);

  // Ships (mock, with slow drift)
  const [ships, setShips] = useState<Ship[]>(MOCK_SHIPS);
  // Satellites (propagated)
  const [satellites, setSatellites] = useState<Satellite[]>([]);

  const addLog = useCallback((level: LogEntry['level'], msg: string) => {
    setLogs((prev) => {
      const next = [...prev, { id: logIdRef.current++, time: formatUTC(new Date()), level, msg }];
      return next.slice(-60);
    });
  }, []);

  // Initial logs
  useEffect(() => {
    addLog('info', "OSINT GOD'S EYE geospatial intelligence platform initialized");
    addLog('info', 'Connecting to ADSB.lol live feed...');
    addLog('info', 'Esri World Imagery tile source online');
    addLog('info', 'Orbital propagator armed — 9 satellites tracked');
    addLog('warn', 'Submarine cable overlay: 15 backbone routes loaded');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aircraft status logs
  useEffect(() => {
    if (acError) addLog('alert', `ADS-B feed degraded: ${acError} — using cached data`);
    else if (!acLoading && liveAircraft.length > 0) {
      const mil = liveAircraft.filter((a) => a.military).length;
      const heli = liveAircraft.filter((a) => a.helicopter).length;
      addLog('info', `Aircraft snapshot: ${liveAircraft.length} tracks (${mil} military, ${heli} rotary)`);
    }
  }, [liveAircraft, acLoading, acError, addLog]);

  useEffect(() => {
    if (radioError) addLog('warn', `Radio-Browser unreachable: ${radioError}`);
    else if (!radioLoading && radios.length > 0) addLog('info', `Radio layer: ${radios.length} live stations`);
  }, [radios, radioLoading, radioError, addLog]);

  // Ship drift simulation
  useEffect(() => {
    const id = setInterval(() => {
      setShips((prev) =>
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
    const tick = () => {
      const now = Date.now();
      const sats = buildSatellitesWithTrails(now);
      setSatellites(sats);
    };
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
      ];
      const [lvl, msg] = events[Math.floor(Math.random() * events.length)];
      addLog(lvl, msg);
    }, 8000);
    return () => clearInterval(id);
  }, [addLog]);

  const toggleLayer = useCallback((k: LayerKey) => {
    setLayers((prev) => ({ ...prev, [k]: !prev[k] }));
  }, []);

  const handleMapClick = useCallback(async (lat: number, lon: number, zoom: number) => {
    setReticle([lat, lon]);
    addLog('info', `Designating target at ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
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
    setReticle([lat, lon]);
    addLog('warn', `Right-click designate: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    setSelected({ kind: 'territory', data: { id: `territory-${lat.toFixed(4)}-${lon.toFixed(4)}`, kind: 'territory', lat, lon, displayName: 'Resolving location...', country: 'Unknown', countryCode: '??' } });
    try {
      const intel = await fetchTerritory(lat, lon, zoom);
      setSelected({ kind: 'territory', data: intel });
      addLog('info', `Territory intel: ${intel.displayName} (${intel.country})`);
    } catch {
      addLog('alert', `Reverse geocoding failed for ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
  }, [fetchTerritory, addLog]);

  const handleCursorMove = useCallback((lat: number, lon: number, zoom: number) => {
    setCursor({ lat, lon, zoom });
  }, []);

  // Listen for zoom-satellite events from TargetPanel
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
        setPitch(60);
        setTerrainEnabled(true);
        setHillshadeEnabled(true);
        addLog('info', '3D tactical view engaged — pitch 60°, terrain armed');
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
        t.data.displayName;
      addLog('info', `Target acquired: ${t.kind.toUpperCase()} ${name}`);
      if (t.kind === 'radio') setActiveRadio(t.data);
    }
  }, [addLog]);

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

  const navigateToCoordinates = useCallback((lat: number, lon: number, label: string, zoom = 17) => {
    setFlyTo([lat, lon, zoom]);
    addLog('info', `Target acquired: ${label}`);
    inspectTerritory(lat, lon, zoom);
  }, [addLog, inspectTerritory]);

  const handleSearch = useCallback(async () => {
    const q = search.trim();
    if (!q) return;
    setShowResults(false);

    // 1. Coordinate detection (lat,lon)
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

    // 2. Callsign / ICAO / ship name / satellite name lookup
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
    const sat = satellites.find((s) => s.name.toUpperCase().includes(upper));
    if (sat) {
      setSelected({ kind: 'satellite', data: sat });
      setFlyTo([sat.lat, sat.lon, 8]);
      addLog('info', `Track locked: ${sat.name}`);
      return;
    }

    // 3. Geocoding — Photon API (Komoot/OSM, no CORS/UA restrictions) then Nominatim fallback
    setLocating(true);
    addLog('info', `Searching: "${q}"...`);

    try {
      // 3a. Photon API
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

      // 3b. Nominatim fallback
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1&accept-language=fr,pt,en`,
          { headers: { Accept: 'application/json', 'User-Agent': 'GodsEyeOSINT/1.0' } },
        );
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (nomData && nomData.length > 0) {
            const lat = parseFloat(nomData[0].lat);
            const lon = parseFloat(nomData[0].lon);
            navigateToCoordinates(lat, lon, nomData[0].display_name);
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
  }, [search, allAircraft, ships, satellites, addLog, inspectTerritory, navigateToCoordinates]);

  const handlePickResult = useCallback((item: import('@/components/TopBar').SearchResultItem) => {
    setShowResults(false);
    setFlyTo([item.lat, item.lon, 17]);
    addLog('info', `Location selected: ${item.displayName}`);
    inspectTerritory(item.lat, item.lon, 17);
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
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
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

  // Counts per layer (only for active layers)
  const counts = useMemo<Record<LayerKey, number>>(() => ({
    civAircraft: layers.civAircraft ? allAircraft.filter((a) => !a.military && !a.helicopter).length : 0,
    milAircraft: layers.milAircraft ? allAircraft.filter((a) => a.military && !a.helicopter).length : 0,
    helicopters: layers.helicopters ? allAircraft.filter((a) => a.helicopter).length : 0,
    civShips: layers.civShips ? ships.filter((s) => !s.naval).length : 0,
    milShips: layers.milShips ? ships.filter((s) => s.naval).length : 0,
    satellites: layers.satellites ? satellites.length : 0,
    cables: layers.cables ? 15 : 0,
    cctv: layers.cctv ? MOCK_CCTV.length : 0,
    radios: layers.radios ? radios.length : 0,
  }), [layers, allAircraft, ships, satellites, radios]);

  return (
    <div className="hud-frame relative flex h-screen w-screen flex-col overflow-hidden bg-hud-bg">


      <TopBar
        civPlanes={counts.civAircraft}
        milPlanes={counts.milAircraft}
        helicopters={counts.helicopters}
        civShips={counts.civShips}
        milShips={counts.milShips}
        satellites={counts.satellites}
        radios={counts.radios}
        cctv={counts.cctv}
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
          {/* Shader overlay (vignette / scanlines) */}
          <div className="shader-overlay" />
          {is3DActive ? (
            <MapView3D
              baseLayer={baseLayer}
              layers={layers}
              aircraft={allAircraft}
              ships={ships}
              satellites={satellites}
              radios={radios}
              cctv={MOCK_CCTV}
              selected={selected}
              onSelect={handleSelect}
              onMapClick={handleMapClick}
              onCursorMove={handleCursorMove}
              pitch={pitch}
              bearing={bearing}
              terrainEnabled={terrainEnabled}
              hillshadeEnabled={hillshadeEnabled}
              buildings3DEnabled={buildings3DEnabled}
              flyTo={flyTo}
              onFlyToDone={() => setFlyTo(null)}
              reticle={reticle}
            />
          ) : (
            <MapView
              baseLayer={baseLayer}
              layers={layers}
              aircraft={allAircraft}
              ships={ships}
              satellites={satellites}
              radios={radios}
              cctv={MOCK_CCTV}
              selected={selected}
              onSelect={handleSelect}
              onMapClick={handleMapClick}
              onMapContextMenu={handleMapContextMenu}
              reticle={reticle}
              flyTo={flyTo}
              onFlyToDone={() => setFlyTo(null)}
              onCursorMove={handleCursorMove}
            />
          )}

          {/* Compass / HUD reticle overlay */}
          <div className="pointer-events-none absolute right-3 top-3 z-[650] flex items-center gap-2">
            <div className="glass rounded px-2 py-1 text-[9px] text-cyan/70">
              {baseLayer.toUpperCase()} · {shader.toUpperCase()} · {is3DActive ? '3D' : '2D'}
            </div>
          </div>

          {/* 3D Camera Controls */}
          <CameraControls3D
            pitch={pitch}
            setPitch={setPitch}
            bearing={bearing}
            setBearing={setBearing}
            terrainEnabled={terrainEnabled}
            setTerrainEnabled={setTerrainEnabled}
            hillshadeEnabled={hillshadeEnabled}
            setHillshadeEnabled={setHillshadeEnabled}
            buildings3DEnabled={buildings3DEnabled}
            setBuildings3DEnabled={setBuildings3DEnabled}
            onToggle3D={handleToggle3D}
            is3DActive={is3DActive}
          />

          {/* Cursor coordinate readout */}
          {cursor && (
            <div className="pointer-events-none absolute bottom-3 left-3 z-[650]">
              <div className="glass rounded px-3 py-1.5 text-[10px] tabular-nums text-cyan/80">
                <span className="text-slate-500">LAT</span> {cursor.lat.toFixed(4)}° &nbsp;
                <span className="text-slate-500">LON</span> {cursor.lon.toFixed(4)}° &nbsp;
                <span className="text-slate-500">Z</span> {cursor.zoom}
              </div>
            </div>
          )}

          {selected && <TargetPanel target={selected} onClose={() => setSelected(null)} />}

          {searchAlert && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-[850] -translate-x-1/2">
              <div className="glass rounded border border-amber/40 bg-hud-bg/95 px-4 py-2 text-[11px] font-semibold text-amber shadow-lg">
                {searchAlert}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomBar logs={logs} activeRadio={activeRadio} onClearRadio={() => setActiveRadio(null)} />
    </div>
  );
}
