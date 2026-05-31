/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:        '#F6F6F5',
        navy:      '#1B1946',
        navyDeep:  '#11103A',
        gray:      '#9D9DA3',
        grayMid:   '#5B5A6E',
        grayLight: '#717189',
        border:    '#B7B8C5',
        paleGreen: '#DFF09F',
        softGreen: '#CDF35E',
        lime:      '#C1F42F',
        neon:      '#B8ED23',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(27, 25, 70, 0.06), 0 1px 2px rgba(27, 25, 70, 0.04)',
        'card-hover': '0 4px 12px rgba(27, 25, 70, 0.1)',
        'dropdown':   '0 8px 24px rgba(27, 25, 70, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
