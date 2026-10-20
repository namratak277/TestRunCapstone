import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: "#1E7A6E", light: "#DDF1EE", dark: "#14564D", mid: "#2A9D8F" },
        coral: { DEFAULT: "#F4A261", light: "#FCE5D0", dark: "#6B3A0B" },
        navy: { DEFAULT: "#264653", soft: "#31596A" },
        cream: "#FBF7F0",
        beige: "#F1E8DA",
        line: "#E5DACA",
        muted: "#3D565F",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
