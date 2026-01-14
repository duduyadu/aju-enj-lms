/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Museum Editorial Design System
        'porcelain': '#F9F7F2',
        'espresso': '#2D241E',
        'taupe': '#8C857E',
        'botanical': '#4A5D4E',
        'museum-border': '#EAE7DE',
        'museum-gold': '#D4AF37',

        // Legacy AJU colors (kept for compatibility)
        'aju-navy': '#001f3f',
        'aju-gold': '#FFD700',
        'aju-sky': '#87CEEB',

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
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
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
        navy: "hsl(var(--navy))",
        gold: "hsl(var(--gold))",
        "sky-blue": "hsl(var(--sky-blue))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'museum': '2.5rem',
        'museum-lg': '3rem',
      },
      fontFamily: {
        'serif': ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        'museum': '0.3em',
        'museum-wide': '0.4em',
      },
      boxShadow: {
        'museum': '0 4px 20px rgba(45, 36, 30, 0.08)',
        'museum-hover': '0 8px 30px rgba(45, 36, 30, 0.12)',
      },
    },
  },
  plugins: [],
}