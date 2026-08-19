import type { Config } from 'tailwindcss';

/**
 * Every color resolves to a CSS custom property defined in `src/app/globals.css`.
 * The `<alpha-value>` slot is what keeps opacity modifiers working
 * (`bg-ink-50/60`, `ring-brand-500/30`), so the vars must hold space-separated
 * RGB channels rather than hex.
 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  /**
   * Part of the shared component contract, but a class no page happens to use
   * yet would be tree-shaken out of the components layer. Pinning them keeps
   * every variant available to any page that reaches for it later.
   */
  safelist: [
    'pill-success',
    'pill-warning',
    'pill-danger',
    'pill-neutral',
    'pill-info',
    'pill-textarea',
  ],
  theme: {
    extend: {
      colors: {
        /**
         * Orange-red brand. 500 is the brand itself and is FILL-ONLY — at
         * 2.8:1 on white it can never carry text. 600 is the lowest shade
         * that clears AA as text, so it is the text/focus-ring grade.
         */
        brand: {
          50: token('brand-50'),
          100: token('brand-100'),
          200: token('brand-200'),
          400: token('brand-400'),
          500: token('brand-500'),
          600: token('brand-600'),
          700: token('brand-700'),
        },
        // Warm-neutral gray ramp — tuned so the brand orange reads as native
        // rather than bolted onto a cool gray.
        ink: {
          900: token('ink-900'),
          800: token('ink-800'),
          700: token('ink-700'),
          600: token('ink-600'),
          500: token('ink-500'),
          400: token('ink-400'),
          300: token('ink-300'),
          200: token('ink-200'),
          100: token('ink-100'),
          50: token('ink-50'),
        },
        // Page background — the canvas the floating shells sit on.
        page: token('canvas'),
        surface: {
          DEFAULT: token('surface'),
          sunken: token('surface-sunken'),
        },

        /**
         * Status. The DEFAULT of each family is the semantic anchor shared
         * with the charts layer. `success` DEFAULT is 3.8:1, which covers
         * graphics and large text but NOT small text — use `success-700` for
         * badge/label text. `warning` and `danger` DEFAULTs are already
         * text-grade.
         */
        success: {
          DEFAULT: token('success-500'),
          50: token('success-50'),
          100: token('success-100'),
          500: token('success-500'),
          700: token('success-700'),
        },
        warning: {
          DEFAULT: token('warning-500'),
          50: token('warning-50'),
          100: token('warning-100'),
          500: token('warning-500'),
          700: token('warning-700'),
        },
        danger: {
          DEFAULT: token('danger-500'),
          50: token('danger-50'),
          100: token('danger-100'),
          500: token('danger-500'),
          700: token('danger-700'),
        },

        // Legacy tint aliases, retuned onto the status families so pages
        // still using them stay coherent with the new palette.
        pink: {
          50: token('danger-50'),
          100: token('danger-100'),
        },
        amber: {
          50: token('warning-50'),
          100: token('warning-100'),
        },
        green: {
          50: token('success-50'),
          100: token('success-100'),
        },
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'SF Mono',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        // 11px. A pure size — the uppercase/tracking/color treatment lives in
        // the `.label-micro` utility so `text-2xs` stays usable for plain text.
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        // 13px data grade — table cells and dense readouts.
        data: ['0.8125rem', { lineHeight: '1.25rem' }],
        // 22px page title.
        title: ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],
        // 28px stat value / login heading.
        display: ['1.75rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
      },
      borderRadius: {
        card: '28px',
        panel: '16px',
        control: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(26 22 20 / 0.04), 0 8px 24px -8px rgb(26 22 20 / 0.08)',
        panel: '0 1px 2px rgb(26 22 20 / 0.03)',
        chip: '0 1px 2px rgb(26 22 20 / 0.06)',
        pop: '0 8px 12px -4px rgb(26 22 20 / 0.08), 0 24px 48px -12px rgb(26 22 20 / 0.22)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(4px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'live-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.82)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 150ms ease-out both',
        'live-pulse': 'live-pulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
