import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        ink: '#0f0f13',
        card: '#1a1a24',
        muted: '#9698ad',
      },
      boxShadow: {
        float: '0 20px 60px rgba(0,0,0,0.4)',
        lift: '0 18px 40px rgba(15, 15, 19, 0.28)',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
      },
    },
  },
  plugins: [],
} satisfies Config;
