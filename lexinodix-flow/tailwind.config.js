/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-navy': '#011C26',
        'deep-blue': '#072A40',
        'neutral-gray': '#4F5459',
        'warm-accent': '#BFACA4',
        'warm-bg': '#F5F1EE',
        'warm-border': '#E5DFD9',
        'warm-surface': '#FAF8F6',
        'warm-hover': '#F2EDE8',
      },
      fontFamily: {
        sora: ['var(--font-sora)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      boxShadow: {
        'luxury': '0 1px 3px rgba(1, 28, 38, 0.06), 0 4px 16px rgba(1, 28, 38, 0.04)',
        'luxury-lg': '0 4px 24px rgba(1, 28, 38, 0.08), 0 1px 4px rgba(1, 28, 38, 0.04)',
        'luxury-xl': '0 8px 48px rgba(1, 28, 38, 0.10), 0 2px 8px rgba(1, 28, 38, 0.06)',
      },
    },
  },
  plugins: [],
};
