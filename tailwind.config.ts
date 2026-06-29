import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FDFDFD",
        panel: "#F1F1F1",
        panel2: "#F7F7F7",
        border: "#E5E5E5",
        muted: "#7B7B7B",
        text: "#10110D",
        accent: "#F95837",
        "accent-hover": "#D63A26",
        "accent-soft": "#FDE7E1",
        warn: "#E6A835",
        danger: "#F95837",
        positive: "#119E66",
        "positive-soft": "#E4F3EC",
      },
      fontFamily: {
        sans: ["var(--font-geist)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
