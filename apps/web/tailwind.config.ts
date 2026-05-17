import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'fir-green':          '#19433E',
        'fir-green-light':    '#235C55',
        'fir-green-subtle':   '#E8F0EF',
        'slate-dark':         '#4A4D51',
        'slate-mid':          '#6B6E73',
        'slate-border':       '#C2C4C7',
        'antique-gold':       '#BD8D27',
        'antique-gold-light': '#D4A84B',
        'antique-gold-subtle':'#FDF6E7',
        'cream':              '#FAF8F3',
        'color-success':      '#19433E',
        'color-warning':      '#BD8D27',
        'color-error':        '#C0392B',
        'color-info':         '#2563EB',
        // Dedicated dark mode theme colors
        'slate-dark-bg':      '#101418',
        'slate-dark-card':    '#161A20',
        'slate-dark-sidebar': '#13171C',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(25, 67, 62, 0.06)',
        'base': '0 2px 4px 0 rgba(25, 67, 62, 0.08), 0 1px 2px -1px rgba(25, 67, 62, 0.06)',
        'md': '0 4px 8px -2px rgba(25, 67, 62, 0.10), 0 2px 4px -2px rgba(25, 67, 62, 0.06)',
        'lg': '0 8px 16px -4px rgba(25, 67, 62, 0.12), 0 4px 6px -4px rgba(25, 67, 62, 0.08)',
        'xl': '0 20px 32px -8px rgba(25, 67, 62, 0.16), 0 8px 16px -8px rgba(25, 67, 62, 0.10)',
      }
    },
  },
  plugins: [],
};
export default config;
