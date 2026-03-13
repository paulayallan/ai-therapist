import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sand: "#f6f0e8",
        mist: "#dce8e4",
        pine: "#21453d",
        sage: "#7ca293",
        coral: "#de8e78",
        ink: "#132321"
      },
      fontFamily: {
        display: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Georgia", "serif"],
        body: ["ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 24px 80px rgba(19, 35, 33, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
