/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bloomberg-inspired dark theme
        slate: {
          900: '#0a0a0a',  // Primary background
          800: '#111111',  // Secondary background
          700: '#1a1a1a',  // Tertiary/borders
          600: '#333333',  // Muted borders
          500: '#555555',  // Muted text
          400: '#888888',  // Secondary text
          300: '#e0e0e0',  // Primary text
        },
        // Accent colors (neon style)
        cyan: {
          400: '#00d4ff',
          500: '#00b8e6',
        },
        green: {
          400: '#00ff88',
          500: '#00cc6a',
          900: 'rgba(0, 255, 136, 0.1)',
        },
        red: {
          400: '#ff4757',
          500: '#cc3945',
          900: 'rgba(255, 71, 87, 0.1)',
        },
        yellow: {
          400: '#ffd93d',
        },
        blue: {
          400: '#4a9eff',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      fontSize: {
        'xs': '11px',
        'sm': '12px',
        'base': '13px',
      },
    },
  },
  plugins: [],
}
