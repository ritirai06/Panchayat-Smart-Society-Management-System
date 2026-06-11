/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#F8FAFC', // Sleek Page Background
          secondary: '#FFFFFF', // Premium Cards
          tertiary:  '#F1F5F9', // Elevated backgrounds
          elevated:  '#E2E8F0',
        },
        brand: {
          DEFAULT: '#10B981', // Primary Emerald
          light:   '#D1FAE5', // Light Emerald
          dark:    '#059669', // Dark Emerald
          teal:    '#0D9488',
        },
        sidebar: {
          DEFAULT: '#0B0F19', // Dark Sidebar Background
        },
        surface: {
          DEFAULT: '#FFFFFF',
          hover:   '#F8FAFC',
          active:  '#F1F5F9',
          border:  '#E5E7EB', // Borders
        },
        text: {
          primary:   '#111827', // Primary Text
          secondary: '#6B7280', // Secondary Text
          muted:     '#9CA3AF',
          disabled:  '#D1D5DB',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger:  '#EF4444',
          info:    '#3B82F6',
        },
      },
      fontFamily: {
        sans:    ['Outfit', 'Inter', 'Manrope', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'Space Grotesk', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card:       '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-lg':  '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        glow:       '0 0 24px rgba(16,185,129,0.15)',
        'glow-sm':  '0 0 12px rgba(16,185,129,0.08)',
        modal:      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: { xs: '2px' },
      animation: {
        'fade-in':    'fadeIn  0.2s ease-out both',
        'slide-up':   'slideUp 0.25s ease-out both',
        'scale-in':   'scaleIn 0.18s ease-out both',
        'slide-in-r': 'slideInR 0.25s ease-out both',
        'shimmer':    'shimmer 1.8s infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0, transform: 'translateY(8px)'  }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:  { from: { opacity: 0, transform: 'scale(0.95)'      }, to: { opacity: 1, transform: 'scale(1)'     } },
        slideInR: { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}
