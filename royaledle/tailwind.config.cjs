/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
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