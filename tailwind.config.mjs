/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          850: '#1a1a1a',
          900: '#171717',
        }
      },
      fontFamily: {
        sans: ['Geist', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'Fira Code', 'monospace'],
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            maxWidth: '72ch',
            '--tw-prose-body': theme('colors.neutral[700]'),
            '--tw-prose-headings': theme('colors.neutral[900]'),
            '--tw-prose-links': theme('colors.primary[600]'),
            '--tw-prose-code': theme('colors.neutral[800]'),
            '--tw-prose-pre-bg': theme('colors.neutral[850]'),
            'code::before': { content: '""' },
            'code::after': { content: '""' },
          },
        },
        invert: {
          css: {
            '--tw-prose-body': theme('colors.neutral[300]'),
            '--tw-prose-headings': theme('colors.neutral[50]'),
            '--tw-prose-links': theme('colors.primary[400]'),
            '--tw-prose-code': theme('colors.neutral[200]'),
            '--tw-prose-pre-bg': theme('colors.neutral[900]'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
