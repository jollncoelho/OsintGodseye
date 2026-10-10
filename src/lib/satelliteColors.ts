import type { SatelliteGroup } from '@/types';

/** Canonical colour per satellite constellation group. */
export const SAT_GROUP_COLOR: Record<SatelliteGroup, string> = {
  comms: '#a855f7',
  military: '#ff2d55',
  navigation: '#2dffaa',
  earthobs: '#22d3ee',
};

export const SAT_GROUP_LABEL: Record<SatelliteGroup, string> = {
  comms: 'SATCOM',
  military: 'MIL-ISR',
  navigation: 'GNSS',
  earthobs: 'EARTH OBS',
};
