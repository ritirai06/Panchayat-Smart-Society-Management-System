/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Manrope"', 'sans-serif'],
        heading: ['"Space Grotesk"', '"Manrope"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 8px 24px 0 rgb(79 70 229 / 0.10)',
        glow: '0 0 20px rgb(79 70 229 / 0.20)',
        'glow-sm': '0 0 12px rgb(79 70 229 / 0.15)',
      },
      animation: {
        'fade-in':   'fadeIn 0.25s ease-out both',
        'slide-up':  'slideUp 0.3s ease-out both',
        'scale-in':  'scaleIn 0.2s ease-out both',
        'shimmer':   'shimmer 1.5s infinite',
        'bounce-slow': 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
