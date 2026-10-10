# 🛰️ OSINT God's Eye — Tactical Geospatial Intelligence Dashboard

An open-source, keyless **GEOINT / OSINT** dashboard: live aircraft, live AIS
shipping, orbital constellations, public camera networks, seismic activity,
undersea cable infrastructure and a day/night terminator — on one tactical HUD.

Two map engines share the same layer set:

* **2D PLAN** — Leaflet + react-leaflet (fast, dense, thousands of markers)
* **3D GLOBE** — MapLibre GL with a real globe projection, terrain and 3D buildings

Everything is driven by **free, public, keyless** data sources. No API keys, no
accounts, no paid tiers.

---

## ✨ Features

### Entity layers
| Layer | Source | Notes |
| :--- | :--- | :--- |
| Civil / military aircraft, helicopters | `adsb.lol` → `adsb.fi` | Live, with automatic provider failover |
| Merchant vessels | Digitraffic AIS (Fintraffic) | ~800 live vessels with real names, IMO, destinations |
| Warships | Curated reference set | No keyless *global* naval AIS exists |
| Satellites (SATCOM / ISR / GNSS / Earth-obs) | On-board Keplerian propagator | 4 switchable constellation groups |
| CCTV / Webcams | 7 public traffic authorities | ~1,500 live cameras |
| Undersea cables | Bundled GeoJSON | Global fibre backbone |
| Live radios | Radio Browser | Worldwide public streams |
| Earthquakes | USGS | M2.5+ feed |
| Day / night terminator | Computed solar geometry | Real sub-solar point + twilight band |
| Strategic points · Infrastructure · Incidents · Cyber | Curated datasets | See *Data honesty* below |

### Interface
* **Tactical HUD shaders** — NVG (night vision), FLIR (thermal), CRT (scanlines)
* **Camera Wall** — OSIRIS-style grid of live feeds with provider filters, text
  search, 15 s auto-refresh and locate/source actions
* **Live Feeds** — 10 real 24/7 news, agency and Earth-observation channels
* **Recon Toolkit** — quick toggles for cams, wall, seismic, cyber and live feeds
* **Target panel** — per-entity telemetry, operator/purpose, trail history
* **Search** — live geocoding (Photon) plus callsign / MMSI / vessel lookup
* **Tactical log** — timestamped, severity-coloured event stream
* **Clock** — rendered in *your* locale and timezone

---

## 🛠️ Tech stack

* **React 18** + **TypeScript 5.5** (strict)
* **Vite 5** with a dev middleware that emulates the serverless API locally
* **Tailwind CSS 3** + lucide-react
* **Leaflet 1.9** / **react-leaflet 4** (2D) and **MapLibre GL 6** (3D)
* **Vercel-style serverless handlers** in `api/` for production

---

## 🚀 Quick start

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

Other scripts:

```bash
npm run build      # production bundle -> dist/
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

> **Note on install:** if `npm install` fails while building native helpers
> (`esbuild` / `@rollup/rollup-*`), install those platform binaries explicitly:
> ```bash
> npm install --no-save --ignore-scripts \
>   @esbuild/win32-x64@0.21.5 @rollup/rollup-win32-x64-msvc@4.24.0
> ```

---

## 📡 Data sources

All live feeds are **keyless and public**. Where a source is not live, that is
stated in the UI rather than faked.

| Domain | Provider | Endpoint |
| :--- | :--- | :--- |
| Aircraft | adsb.lol (primary), adsb.fi (failover) | `/api/adsb` |
| Vessels (AIS) | Digitraffic / Fintraffic (CC BY 4.0) | `/api/vessels` |
| Cameras | TfL, Caltrans, Austin, Fintraffic, Statens vegvesen, NSW, Calgary | `/api/cameras` |
| Earthquakes | USGS | direct |
| Radio | Radio Browser | direct |
| Imagery | Esri World Imagery | direct |
| Buildings (3D) | OpenFreeMap | direct |
| Geocoding | Photon (Komoot) | direct |

### Data honesty

Not every layer can be live, and the UI does not pretend otherwise:

* **Cyber threats** are a curated model of known threat actors with
  deterministically-bucketed event counters — labelled **MODELED TELEMETRY**.
* **Global incidents** and **strategic points** are curated reference datasets,
  deliberately neutral and non-partisan.
* **Warships** are a curated reference fleet, since no keyless global AIS
  source exists. Live AIS targets are badged **LIVE AIS**; curated ones
  **REFERENCE**.
* **Cameras** fall back to a small verified set only if every provider fails.

---

## 📂 Project structure

```text
├── api/                    # Serverless handlers (Vercel-style)
│   ├── adsb.ts             #   aircraft proxy + provider failover
│   ├── cameras.ts          #   camera aggregator
│   └── vessels.ts          #   AIS aggregator
├── shared/                 # Isomorphic modules (server + browser)
│   ├── adsb.ts
│   ├── cameras.ts
│   └── vessels.ts
├── src/
│   ├── components/         # MapView (Leaflet), MapView3D (MapLibre), HUD panels
│   ├── hooks/              # useAircraft, useVessels, useCctvCameras, …
│   ├── lib/                # satellites, terminator, icons, curated datasets
│   └── App.tsx
└── vite.config.ts          # dev mirror of the api/ handlers
```

The `shared/` modules are imported by **both** the serverless handlers and the
browser hooks, so the dev server, the deployed functions and the static-hosting
fallback all run identical aggregation logic.

---

## ⚖️ Disclaimer

Built for educational, research and OSINT demonstration purposes. All live data
is aggregated from publicly broadcasted feeds (ADS-B, AIS, public camera
catalogues, public radio streams, USGS). Nothing here accesses private or
restricted data.

## 📄 License

MIT.
