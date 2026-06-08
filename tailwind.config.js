/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0B0F14',
        'temple-stone': '#4B443F',
        'sandal-gold': '#C79A53',
        'deep-kumkum': '#7A1F1F',
        'monsoon-blue': '#1E3A5F',
        ivory: '#F7F4EE',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        anton: ['Anton', 'sans-serif'],
        playfair: ['"Playfair Display"', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
        cormorant: ['"Playfair Display"', 'serif'], // kept for backward compatibility
        inter: ['Outfit', 'sans-serif'], // kept for backward compatibility
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
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
        "ken-burns-1": {
          "0%": { transform: "scale(1) translate(-1%, -1%)" },
          "50%": { transform: "scale(1.08) translate(1%, 1%)" },
          "100%": { transform: "scale(1) translate(-1%, -1%)" },
        },
        "ken-burns-2": {
          "0%": { transform: "scale(1) translate(1%, -1%)" },
          "50%": { transform: "scale(1.06) translate(-1%, 1%)" },
          "100%": { transform: "scale(1) translate(1%, -1%)" },
        },
        "drift": {
          "0%, 100%": { transform: "translateX(-10px)" },
          "50%": { transform: "translateX(10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "ken-burns-1": "ken-burns-1 20s ease-in-out infinite",
        "ken-burns-2": "ken-burns-2 20s ease-in-out infinite",
        "drift": "drift 12s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
