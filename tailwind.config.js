/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#03000a",
          panel: "rgba(10, 5, 22, 0.7)",
          cyan: "#00f2fe",
          magenta: "#ff007f",
          blue: "#0066ff",
          violet: "#8a2be2",
          green: "#39ff14",
          amber: "#ffb700",
          slate: "#0f172a"
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 15px rgba(0, 242, 254, 0.35)',
        'magenta-glow': '0 0 15px rgba(255, 0, 127, 0.35)',
        'green-glow': '0 0 15px rgba(57, 255, 20, 0.35)',
        'violet-glow': '0 0 20px rgba(138, 43, 226, 0.25)',
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
        'neon-border': 'borderGlow 4s ease infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(0, 242, 254, 0.5)' },
          '50%': { borderColor: 'rgba(255, 0, 127, 0.5)' },
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
