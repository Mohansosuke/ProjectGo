/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        /* ── Primary: Indigo (Linear / Stripe feel) ─────────── */
        primary: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        /* ── Violet (accent) ─────────────────────────────────── */
        violet: {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },
        /* ── Surface system ──────────────────────────────────── */
        surface: {
          DEFAULT: '#FFFFFF',
          hover:   '#F9FAFB',
          muted:   '#F3F4F6',
          subtle:  '#F9FAFB',
        },
        /* ── Canvas ──────────────────────────────────────────── */
        canvas: '#F3F4F6',
      },
      boxShadow: {
        'xs':      '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'soft':    '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card':    '0 0 0 1px rgb(0 0 0 / 0.05), 0 1px 3px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px rgb(0 0 0 / 0.08), 0 2px 4px rgb(0 0 0 / 0.04)',
        'elevated': '0 4px 12px rgb(0 0 0 / 0.08), 0 2px 4px rgb(0 0 0 / 0.04)',
        'float':   '0 8px 24px rgb(0 0 0 / 0.08), 0 4px 8px rgb(0 0 0 / 0.04)',
        'modal':   '0 20px 60px rgb(0 0 0 / 0.15), 0 8px 20px rgb(0 0 0 / 0.08)',
        'sidebar': '4px 0 24px rgb(0 0 0 / 0.12)',
        'panel':   '-4px 0 24px rgb(0 0 0 / 0.08)',
        'glow-indigo': '0 0 32px rgba(79, 70, 229, 0.3)',
        'glow-violet': '0 0 32px rgba(139, 92, 246, 0.3)',
        'inset-border': 'inset 0 0 0 1px rgb(0 0 0 / 0.06)',
        'none': 'none',
      },
      borderRadius: {
        'xs':   '3px',
        'sm':   '4px',
        'DEFAULT': '6px',
        'md':   '6px',      // Buttons, Inputs, Selects
        'lg':   '8px',      // Dropdowns, Popovers
        'xl':   '10px',     // Cards
        '2xl':  '12px',     // Modals, Drawers
        '3xl':  '20px',
        'full': '9999px',
      },
      fontSize: {
        'xxs': ['10px', { lineHeight: '14px', letterSpacing: '0.02em' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
      },
      animation: {
        'fade-in':       'fadeIn 0.25s ease-out forwards',
        'slide-up':      'slideUp 0.3s ease-out forwards',
        'slide-in-right': 'slideInRight 0.25s ease-out forwards',
        'scale-in':      'scaleIn 0.2s ease-out forwards',
        'shimmer':       'shimmer 1.5s linear infinite',
        'float':         'float 4s ease-in-out infinite',
        'pulse-glow':    'pulseGlow 2.5s ease-in-out infinite',
        'gradient':      'gradientShift 4s ease infinite',
        'spin-slow':     'spin 8s linear infinite',
        'marquee':       'marqueeScroll 20s linear infinite',
      },
      backdropBlur: {
        'xs':  '2px',
        'sm':  '4px',
        'md':  '8px',
        'lg':  '16px',
        'xl':  '24px',
        '2xl': '40px',
      },
      transitionDuration: {
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
      },
    },
  },
  plugins: [],
}
