// Simplified undersea telecom cable GeoJSON (major backbone routes).
// Coordinates are approximate polylines for visualization.
import type { LatLngExpression } from 'leaflet';

export type Cable = {
  name: string;
  path: LatLngExpression[];
};

export const UNDERSEA_CABLES: Cable[] = [
  {
    name: 'TAT-14 (USA-UK-EU)',
    path: [
      [40.7, -74.0], [49.0, -30.0], [50.5, -5.0], [51.0, 1.5], [50.0, 8.0], [44.0, 9.0],
    ],
  },
  {
    name: 'SEA-ME-WE 5 (SE Asia-ME-EU)',
    path: [
      [1.3, 103.8], [6.9, 79.8], [25.3, 55.3], [31.2, 32.3], [37.5, 25.0], [38.0, 13.5], [43.5, 10.0],
    ],
  },
  {
    name: 'MAREA (USA-Spain)',
    path: [
      [36.9, -76.3], [38.0, -40.0], [39.0, -10.0], [36.5, -6.3],
    ],
  },
  {
    name: 'FASTER (USA-Japan)',
    path: [
      [35.6, -122.3], [30.0, -160.0], [25.0, 180.0], [33.0, 140.0],
    ],
  },
  {
    name: '2Africa (Africa-Europe-Asia)',
    path: [
      [36.5, -6.3], [36.0, 10.0], [32.0, 20.0], [12.0, 43.0], [11.5, 52.0], [25.0, 56.0], [1.3, 103.8],
    ],
  },
  {
    name: 'Pacific Light Cable (USA-HK)',
    path: [
      [34.0, -118.2], [20.0, -160.0], [10.0, 175.0], [22.3, 114.1],
    ],
  },
  {
    name: 'India-Middle East-Western Europe (IMEWE)',
    path: [
      [19.0, 72.8], [25.3, 55.3], [31.2, 32.3], [37.5, 25.0], [38.0, 13.5], [43.5, 10.0],
    ],
  },
  {
    name: 'Southern Cross (Australia-USA)',
    path: [
      [-33.9, 151.2], [-30.0, 170.0], [-10.0, -160.0], [21.3, -157.8], [37.8, -122.4],
    ],
  },
  {
    name: 'Africa Coast to Europe (ACE)',
    path: [
      [36.5, -6.3], [10.0, -15.0], [5.0, 0.0], [-1.3, 7.0], [-15.0, 40.0], [-33.9, 18.4],
    ],
  },
  {
    name: 'Hawaiki (USA-NZ-Australia)',
    path: [
      [37.8, -122.4], [10.0, -150.0], [-20.0, -170.0], [-36.8, 174.8], [-33.9, 151.2],
    ],
  },
  {
    name: 'Bay of Bengal Gateway (India-Singapore)',
    path: [
      [13.0, 80.3], [8.0, 77.0], [1.3, 103.8],
    ],
  },
  {
    name: 'Japan-Guam-Australia (JGA)',
    path: [
      [35.6, 140.0], [13.5, 144.8], [-33.9, 151.2],
    ],
  },
  {
    name: 'Dunant (USA-France)',
    path: [
      [40.7, -74.0], [45.0, -25.0], [48.0, -5.0], [43.5, -1.5],
    ],
  },
  {
    name: 'Hannibal (Italy-Tunisia)',
    path: [
      [38.0, 13.5], [37.0, 10.0], [36.8, 10.2],
    ],
  },
  {
    name: 'Malaysia-Cambodia-Thailand (MCT)',
    path: [
      [1.3, 103.8], [3.0, 101.3], [11.5, 104.9],
    ],
  },
];
