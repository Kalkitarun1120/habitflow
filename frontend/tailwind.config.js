/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981', // Premier Modern Emerald
          600: '#059669', // High-contrast Light Mode Primary
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#022C22',
        },
        surface: {
          light: '#FFFFFF',
          'light-subtle': '#F8FAFC',
          'light-card': '#FFFFFF',
          'light-border': '#E2E8F0',
          dark: '#0B0F17', // Obsidian Canvas
          'dark-card': '#131B26', // Elevated Card
          'dark-subtle': '#16202E', // Subtle Hover
          'dark-border': '#1E293B',
          'dark-border-subtle': 'rgba(255, 255, 255, 0.08)',
        },
        accent: {
          teal: '#0D9488',
          tealGlow: '#2DD4BF',
          indigo: '#6366F1',
          amber: '#F59E0B',
          rose: '#F43F5E',
          sky: '#0EA5E9',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        'premium': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'premium-lg': '0 12px 32px -4px rgba(15, 23, 42, 0.1), 0 4px 12px -2px rgba(15, 23, 42, 0.05)',
        'glow-emerald': '0 0 20px -2px rgba(16, 185, 129, 0.35)',
        'dark-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.35rem',
      }
    },
  },
  plugins: [],
}
