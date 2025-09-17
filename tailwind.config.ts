import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'zen': {
          '50': '#f8f9fa',
          '100': '#f1f3f4',
          '200': '#e8eaed',
          '300': '#dadce0',
          '400': '#bdc1c6',
          '500': '#9aa0a6',
          '600': '#80868b',
          '700': '#5f6368',
          '800': '#3c4043',
          '900': '#202124',
        },
        'dharma': {
          '50': '#fef7ee',
          '100': '#fdecd3',
          '200': '#fbd5a5',
          '300': '#f8b66d',
          '400': '#f59e0b',
          '500': '#d97706',
          '600': '#b45309',
          '700': '#92400e',
          '800': '#78350f',
          '900': '#451a03',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'wheel-spin': 'wheel-spin 60s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'wheel-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config