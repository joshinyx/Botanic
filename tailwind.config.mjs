/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // shadcn/ui tokens — only what components need, avoiding conflicts
        // with the project's own bg/text/card theming system
        border:      "var(--border)",
        input:       "var(--input)",
        ring:        "var(--ring)",
        primary: {
          DEFAULT:    "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT:    "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT:    "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT:    "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        popover: {
          DEFAULT:    "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        // Theme-aware via CSS variables
        canvas:     "var(--color-bg-base)",
        panel:      "var(--color-bg-panel)",
        surface:    "var(--color-bg-surface)",
        elevated:   "var(--color-bg-elevated)",
        "fg-1":     "var(--color-text-primary)",
        "fg-2":     "var(--color-text-secondary)",
        "fg-muted": "var(--color-text-muted)",
        "fg-sub":   "var(--color-text-subtle)",
        "fg-faint": "var(--color-text-faint)",
        brand:      "var(--color-brand)",
        accent:     "var(--color-accent)",
        "accent-h": "var(--color-accent-hover)",
        // Static (semantic — don't change with theme)
        success:    "#27a644",
        "success-2": "#10b981",
      },
      fontFamily: {
        sans: [
          "Inter Variable",
          "SF Pro Display",
          "-apple-system",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["Berkeley Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "510",
        semibold: "590",
      },
      borderRadius: {
        micro: "2px",
        sm: "4px",
        DEFAULT: "6px",
        card: "8px",
        panel: "12px",
        large: "22px",
      },
      boxShadow: {
        subtle:   "rgba(0,0,0,0.03) 0px 1.2px 0px",
        elevated: "rgba(0,0,0,0.4) 0px 2px 4px",
        ring:     "rgba(0,0,0,0.2) 0px 0px 0px 1px",
        focus:    "rgba(0,0,0,0.1) 0px 4px 12px",
        inset:    "rgba(0,0,0,0.2) 0px 0px 12px 0px inset",
        dialog:   "rgba(0,0,0,0) 0px 8px 2px, rgba(0,0,0,0.01) 0px 5px 2px, rgba(0,0,0,0.04) 0px 3px 2px, rgba(0,0,0,0.07) 0px 1px 1px, rgba(0,0,0,0.08) 0px 0px 1px",
      },
    },
  },
  plugins: [],
};
