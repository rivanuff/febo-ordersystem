/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    fontFamily: {
      sans: "Graphik, sans-serif",
      "sans-2": "Gilroy, sans-serif",
    },
    container: {
      center: true,
      padding: "2rem",
    },
    extend: {
      colors: {
        green: {
          1: "#061e18",
          2: "#0a3d3a",
          3: "#007c63",
          4: "#14d2ab",
          5: "#c7e4dd",
        },
      },
    },
  },
  plugins: [],
};
