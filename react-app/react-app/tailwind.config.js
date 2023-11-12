/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/Layout/Header.tsx",
    "./src/HomePage.tsx",
    "./src/AboutPage.tsx",
    "./src/CreatePage.tsx",
    "./src/UserPage.tsx",
    "./src/ShowPage.tsx",
  ],
  theme: {
    extend: {
      height: {
        '55vh': '55vh',
        '60vh': '60vh',
      }
    },
  },
  plugins: [],
}

