import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Orange-red brand — the "MITE Admin" wordmark.
        brand: {
          50: '#fff1ed',
          100: '#ffd9cc',
          500: '#ff6a3d',
          600: '#ff4d2e',
          700: '#e63c1e',
        },
        // Dark pill-button gray.
        ink: {
          900: '#111111',
          800: '#222222',
          700: '#3f3f3f',
          500: '#6b7280',
          400: '#9ca3af',
          300: '#d1d5db',
          200: '#e5e7eb',
          100: '#f0f0f0',
          50: '#f7f7f7',
        },
        // Page background — very light cool gray.
        page: '#f5f5f5',
        // Status colors.
        success: '#22c55e',
        warning: '#eab308',
        danger: '#ef4444',
        pink: {
          50: '#ffe4e6',
          100: '#fecdd3',
        },
        amber: {
          50: '#fef3c7',
        },
        green: {
          50: '#dcfce7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '28px',
      },
    },
  },
  plugins: [],
};

export default config;
