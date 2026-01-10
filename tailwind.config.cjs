/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        qatar: '#8A1538',
        sand: '#fdf6e3',
      },
    },
  },
  plugins: [],
}