/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        hud: {
          bg: '#0a0f18',
          panel: '#0d1420',
          border: '#1e2a3d',
        },
        cyan: {
          DEFAULT: '#22d3ee',
          dim: '#0891b2',
        },
        danger: '#ff2d55',
        amber: '#fbbf24',
        green: '#2dffaa',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
