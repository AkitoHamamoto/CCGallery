/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // "./src/**/*.{js,jsx,ts,tsx}",
    "./src/components/Layout/Header.tsx",
    "./src/HomePage.tsx",
    "./src/AboutPage.tsx",
    "./src/CreatePage.tsx",
    "./src/UserPage.tsx",
    "./src/ShowPage.tsx",
    "./src/LoginPage.tsx",
  ],
  theme: {
    extend: {
      height: {
        '55vh': '55vh',
        '60vh': '60vh',
      },
      colors: {
        'black-opacity-4': 'rgba(0, 0, 0, 0.4)'
      }
    },
  },
  plugins: [],
}

