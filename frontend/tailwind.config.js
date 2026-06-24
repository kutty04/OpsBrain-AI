/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        accent: {
          cyan: '#06B6D4',
          green: '#10B981',
          red: '#EF4444',
          yellow: '#F59E0B',
        }
      }
    },
  },
  plugins: [],
}
