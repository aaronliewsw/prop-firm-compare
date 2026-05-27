import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0b",
        panel: "#111114",
        border: "#1f1f24",
        muted: "#9b9ba6",
        text: "#e6e6ea",
        accent: "#7ee787",
        warn: "#f0883e",
        danger: "#f85149",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
