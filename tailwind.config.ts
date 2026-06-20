import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2B2527",
        leaf: "#2f6f62",
        rosewood: "#7A1F3D",
        rose: "#B85C76",
        saffron: "#C79A45",
        ivory: "#FFF9F5",
        blush: "#F8EDE8",
        warmgrey: "#756A6E",
        success: "#2F7D5A",
        danger: "#B42318",
        mist: "#F8EDE8"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(122,31,61,.12)",
        card: "0 10px 30px rgba(43,37,39,.08)"
      }
    }
  },
  plugins: []
};

export default config;
