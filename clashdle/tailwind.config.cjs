/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Clash Royale fontu her yerde kullanilir (yedege Baloo 2 duser)
    fontFamily: {
      sans: ['Clash', '"Baloo 2"', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
      royal: ['Clash', '"Baloo 2"', '"Segoe UI"', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        royalgreen: '#19b419',
        royalred: '#b41919',
        royalyellow: '#bd9b37',
      },
    },
  },
  plugins: [],
}
