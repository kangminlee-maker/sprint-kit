import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "podo-green": "#6ABE36",
        "green-100": "#E8F5E0",
        "green-500": "#6ABE36",
        "green-700": "#4A8F1E",
        "red-normal": "#FD6771",
        "red-100": "#FFF0F1",
        "red-500": "#FD6771",
        "blue-500": "#6184FF",
      },
      fontFamily: {
        pretendard: ["Pretendard Variable", "sans-serif"],
      },
      screens: {
        mobile: "360px",
        tablet: "480px",
      },
    },
  },
  plugins: [],
} satisfies Config;
