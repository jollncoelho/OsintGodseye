# 🛰️ OSINT-God's Eye — Tactical Geospatial & OSINT Intelligence Dashboard

An open-source, client-side geospatial intelligence (GEOINT) dashboard inspired by *God's Eye*. Designed for real-time aerial, maritime, and territorial reconnaissance using free, keyless open APIs.

---

## 🌟 Key Features

* 🌍 **High-Definition Satellite Imagery:** Powered by Esri World Imagery with optional hybrid boundary and locality labels.
* ✈️ **Live Flight Tracking:** Real-time commercial and military aircraft positioning via the OpenSky Network REST API with live telemetry (speed, altitude, climb, heading).
* 🚢 **Maritime Tracking:** Live positioning of commercial cargo vessels, tankers, and naval warships.
* 🛰️ **Orbital Satellites:** Dynamic orbital calculation and trajectory projections for satellites (ISS, Starlink, GPS).
* 🌐 **Global Undersea Telecom Cables:** Detailed polyline overlays of submarine fiber-optic backbone infrastructure.
* 📍 **Interactive Territorial Intel:** Click or right-click anywhere globally to reverse-geocode addresses, fetch live local weather (Open-Meteo), and view localized photographic intel.
* 🎛️ **Tactical HUD Filters:** Dynamic CSS shader modes including **NVG** (Night Vision Green), **FLIR** (Thermal Infrared), **CRT** (Radar Scanlines), and standard view.
* 📻 **Global Radio Intercepts:** Integrated audio stream player connecting to worldwide local broadcast frequencies via Radio Browser.

---

## 🛠️ Tech Stack

* **Framework:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Language:** TypeScript
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) + Lucide Icons
* **Mapping Engine:** [Leaflet](https://leafletjs.com/) / [React-Leaflet](https://react-leaflet.js.org/) & [MapLibre GL](https://maplibre.org/)
* **Map Tiles:** Esri ArcGIS Online (World Imagery, Canvas Dark Gray, Reference Labels) & OpenStreetMap

---

## 🚀 Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18+ recommended)
* `npm`, `yarn` or `pnpm`

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/jollncoelho/OsintGodseye.git
cd OsintGodseye
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start local development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
```

---

## 📡 Free & Keyless APIs Used

| Service | Provider | Usage |
| :--- | :--- | :--- |
| **Satellite Imagery** | Esri ArcGIS Rest Services | HD satellite map tiles & overlays |
| **Flight Tracking** | OpenSky Network | Live aircraft state vectors |
| **Aircraft Photos** | Planespotters.net / Wikimedia | Target preview photography |
| **Geocoding & Search** | OpenStreetMap Nominatim / Photon | Global address search and reverse geocoding |
| **Local Weather** | Open-Meteo | Real-time weather and wind telemetry |
| **Live Audio Streams** | Radio Browser API | Worldwide tactical radio streams |

---

## 📂 Project Structure

```text
OsintGodseye/
├── public/
│   └── data/               # Undersea cables & satellite GeoJSON datasets
├── src/
│   ├── components/
│   │   ├── Map/            # Leaflet / MapLibre map engine & tile layers
│   │   ├── Layers/         # Aircraft, vessels, satellites & HUD markers
│   │   ├── Sidebar/        # Tactical layer filters & HUD shader toggles
│   │   ├── TargetHud/      # Target acquired telemetry & street view panel
│   │   └── TopBar/         # Local clock, search bar & metrics
│   ├── services/           # OpenSky, Nominatim & Open-Meteo fetchers
│   ├── styles/             # NVG, FLIR and CRT scanline animations
│   ├── App.tsx             # Root layout
│   └── main.tsx            # Entry point
├── package.json
└── README.md
```

---

## ⚖️ Disclaimer

This project is developed solely for educational, research, and Open Source Intelligence (OSINT) demonstration purposes. All tracked data is aggregated from open, publicly broadcasted feeds (ADS-B, AIS, public radio streams, and public satellite telemetry).

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
