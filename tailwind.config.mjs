/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  safelist: [
    // Clases dinámicas usadas en el perfil de planta y componentes
    'bg-[#4ade80]', 'bg-[#fbbf24]', 'bg-[#60a5fa]', 'bg-[#c084fc]', 'bg-[#94a3b8]', 'bg-[#fb923c]',
    'bg-[rgba(74,222,128,0.12)]', 'bg-[rgba(251,191,36,0.12)]', 'bg-[rgba(96,165,250,0.12)]',
    'bg-[rgba(192,132,252,0.12)]', 'bg-[rgba(148,163,184,0.12)]', 'bg-[rgba(251,146,60,0.12)]',
    'text-[#4ade80]', 'text-[#fbbf24]', 'text-[#60a5fa]', 'text-[#c084fc]', 'text-[#94a3b8]', 'text-[#fb923c]',
    'border', 'border-std', 'border-subtle', 'bg-card', 'bg-card-elev', 'bg-panel', 'bg-surface',
    'text-primary', 'text-secondary', 'text-muted', 'text-subtle', 'text-faint',
    'rounded-full', 'rounded-panel', 'rounded-card', 'rounded-sm',
    'px-2.5', 'py-1', 'py-2', 'p-4', 'p-5', 'gap-1.5', 'gap-2', 'gap-4', 'gap-5', 'gap-6', 'gap-8',
    'text-xs', 'text-[11px]', 'text-[15px]', 'mb-0.5', 'mb-2', 'mb-3', 'mb-4', 'mb-8',
    'uppercase', 'tracking-widest', 'capitalize', 'inline-flex', 'flex', 'items-center', 'items-start', 'items-between', 'justify-between',
    'object-cover', 'shrink-0', 'block', 'min-w-0', 'w-6', 'h-6', 'max-w-[1200px]', 'mx-auto', 'px-6', 'py-10',
    'grid', 'grid-cols-1', 'md:grid-cols-[minmax(0,360px)_1fr]', 'lg:grid-cols-[1fr_340px]'
  ],
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
