/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          darkBg: '#0B1220',
          darkSurface: '#111C30',
          darkCard: '#19263B',
          accent: '#23C8BB',
          accentBlue: '#60A5FA',
          success: '#22C55E',
          warning: '#F59E0B',
          critical: '#EF4444',
          textPrimary: '#F8FAFC',
          textSecondary: '#94A3B8',
        }
      }
    },
  },
  plugins: [],
}
