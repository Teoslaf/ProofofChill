import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        bg: '#F7F1E3',
        text: {
          main: '#2E2E2E',
          light: '#676767',
        },
        success: '#A3E635',
        alert: '#FBBF24',
        kick: '#EF4444',
      },
      fontFamily: {
        pixel: ['"VT323"', 'monospace'],
      },
      borderRadius: {
        pixel: '0.25rem',
      },
      boxShadow: {
        pixel: '4px 4px 0px 0px #000000',
      },
    },
  },
  plugins: [],
}
export default config
