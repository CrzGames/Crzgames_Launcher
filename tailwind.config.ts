import type { Config } from 'tailwindcss'

/** @type {import('tailwindcss').Config} */
export default <Partial<Config>>{
  content: ['./src-nuxt/**/*.vue', './src-common/**/*.vue', './error.vue', './app.vue'],
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
      '4xl': '2560px',
    },
    fontFamily: {
      sans: 'Red Hat Display, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      serif:
        'Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    },
    extend: {
      scale: {
        102: '1.02',
      },
      aspectRatio: {
        '3/4': '3 / 4',
      },
      colors: {
        zinc: {
          100: 'rgba(208,233,255,0.2)',
          200: 'rgba(255,255,255,0.3)',
          400: '#908e97',
          500: '#62626F',
          600: '#52525e',
          700: '#171926',
          900: '#141724',
        },
        amber: {
          400: '#e0a100',
        },
        blue: {
          700: 'rgba(40,45,67,.8)',
          800: '#1d2033',
          900: '#15171e',
        },
      },
    },
  },
  plugins: [],
}
