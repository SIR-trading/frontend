import type { Config } from "tailwindcss";

const config = {
  darkMode: ["selector"],
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
    colors: {
      // To Review
      gold: "hsl(var(--gold), <alpha-value>)",
      purple: "hsl(var(--purple), <alpha-value>)",
      ring: "hsl(var(--ring), <alpha-value>)",
      red: {
        DEFAULT: "hsl(var(--red), <alpha-value>)",
        200: "hsl(var(--red-200), <alpha-value>)",
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
        600: "hsl(var(--accent-600), <alpha-value>)",
      },

      white: "white",
      black: "black",
      transparent: "transparent",
      background: "hsl(var(--background), <alpha-value>)",
      foreground: "hsl(var(--foreground), <alpha-value>)",
      border: "hsl(var(--border), <alpha-value>)",
      primary: "hsl(var(--primary), <alpha-value>)",
      tertiary: {
        DEFAULT: "hsl(var(--tertiary), <alpha-value>)",
        border: "hsl(var(--tertiary-border))",
      },
      secondary: "hsl(var(--secondary), <alpha-value>)",
      gray: "hsl(var(--gray), <alpha-value>)",
      "on-bg-subdued": "hsl(var(--on-bg-subdued))",
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0.7" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0.7", transform: "translate(-10px,0)" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.3s ease-in-out ",
        "fade-in": "fadeIn 0.4s ease-in-out forwards",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        geist: ["var(--font-geist-sans)"],
        "geist-mono": ["var(--font-geist-mono)"],
      },
      // colors: {
      //   border: "hsl(var(--border))",
      //   gray: {
      //     50: "hsl(var(--gray-50), <alpha-value>)",
      //     100: "hsl(var(--gray-100), <alpha-value>)",
      //     200: "hsl(var(--gray-200), <alpha-value>)",
      //     300: "hsl(var(--gray-300), <alpha-value>)",
      //     400: "hsl(var(--gray-400), <alpha-value>)",
      //     500: "hsl(var(--gray-500), <alpha-value>)",
      //     600: "hsl(var(--gray-600), <alpha-value>)",
      //     700: "hsl(var(--gray-700), <alpha-value>)",
      //     800: "hsl(var(--gray-800), <alpha-value>)",
      //   },
      //   purple: "hsl(var(--purple), <alpha-value>)",
      //   gold: "rgba(132, 42, 255, <alpha-value>)",
      //   input: "hsl(var(--input))",
      //
      //   background: "hsl(var(--background), <alpha-value>)",
      //   foreground: "hsl(var(--foreground))",
      //   primary: {
      //     DEFAULT: "hsl(var(--primary), <alpha-value>)",
      //     foreground: "hsl(var(--primary-foreground), <alpha-value>)",
      //   },
      //   secondary: {
      //     DEFAULT: "hsl(var(--secondary), <alpha-value>)",
      //     100: "hsl(var(--secondary-100), <alpha-value>)",
      //     200: "hsl(var(--secondary-200), <alpha-value>)",
      //     300: "hsl(var(--secondary-300), <alpha-value>)",
      //     400: "hsl(var(--secondary-400), <alpha-value>)",
      //     500: "hsl(var(--secondary-500), <alpha-value>)",
      //     600: "hsl(var(--secondary-600), <alpha-value>)",
      //     700: "hsl(var(--secondary-700), <alpha-value>)",
      //     800: "hsl(var(--secondary-800), <alpha-value>)",
      //     900: "hsl(var(--secondary-900), <alpha-value>)",
      //     1000: "hsl(var(--secondary-1000), <alpha-value>)",
      //     foreground: "hsl(var(--secondary-foreground), <alpha-value>)",
      //   },
      //   tertiary: {
      //     DEFAULT: "hsl(var(--tertiary), <alpha-value>)",
      //     foreground: "hsl(var(--tertiary-foreground), <alpha-value>)",
      //     border: "hsl(var(--tertiary-border), <alpha-value>)",
      //   },

      //   yellow: {
      //     DEFAULT: "hsl(var(--yellow-100), <alpha-value>)",
      //     200: "hsl(var(--yellow-200), <alpha-value>)",
      //   },
      //   red: {
      //     DEFAULT: "hsl(var(--red), <alpha-value>)",
      //     200: "hsl(var(--red-200), <alpha-value>)",
      //   },
      //   orange: {
      //     DEFAULT: "hsl(var(--orange-100), <alpha-value>)",
      //     200: "hsl(var(--orange-200), <alpha-value>)",
      //   },
      //   brown: {
      //     100: "hsl(var(--brown-100), <alpha-value>)",
      //     700: "hsl(var(--brown-700), <alpha-value>)",
      //     800: "hsl(var(--brown-800), <alpha-value>)",
      //   },
      //   ["light-blue"]: {
      //     100: "hsl(var(--light-blue), <alpha-value>)",
      //   },
      //   popover: {
      //     DEFAULT: "hsl(var(--popover))",
      //     foreground: "hsl(var(--popover-foreground))",
      //   },
      //   card: {
      //     DEFAULT: "hsl(var(--card))",
      //     foreground: "hsl(var(--card-foreground), <alpha-value>)",
      //   },
      // },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      opacity: {
        2: "0.02",
        3: "0.03",
        4: "0.04",
        7: "0.07",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
