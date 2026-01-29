/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': '#1a1a2e',
        'app-surface': '#16213e',
        'app-primary': '#0f3460',
        'app-accent': '#e94560',
      }
    },
  },
  plugins: [],
}
