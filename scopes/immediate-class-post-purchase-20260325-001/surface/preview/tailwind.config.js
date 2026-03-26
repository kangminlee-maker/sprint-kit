/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        podo: {
          green: "#B5FD4C",
          "green-dark": "#9AE030",
          black: "#1A1A1A",
        },
      },
    },
  },
  plugins: [],
};
