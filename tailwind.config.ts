import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        lora: ["var(--font-lora)"],
      },
      colors: {
        border: "hsl(var(--border))",
        gray: "hsl(var(--gray))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground), <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary), <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground), <alpha-value>)",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary), <alpha-value>)",
          foreground: "hsl(var(--tertiary-foreground), <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent), <alpha-value>)",
          foreground: "hsl(var(--accent-foreground), <alpha-value>)",
          100: "hsl(var(--accent-100), <alpha-value>)",
        },
        yellow: {
          DEFAULT: "hsl(var(--yellow-100), <alpha-value>)",
          200: "hsl(var(--yellow-200), <alpha-value>)",
        },
        orange: {
          DEFAULT: "hsl(var(--orange-100), <alpha-value>)",
          200: "hsl(var(--orange-200), <alpha-value>)",
        },
        brown: {
          100: "hsl(var(--brown-100), <alpha-value>)",
          700: "hsl(var(--brown-700), <alpha-value>)",
          800: "hsl(var(--brown-800), <alpha-value>)",
        },
        ["light-blue"]: {
          100: "hsl(var(--light-blue), <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground), <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
