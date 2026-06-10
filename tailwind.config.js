/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'tw-',
  content: ['./pages/**/*.vue', './components/**/*.vue'],
  theme: {
    extend: {
      colors: {
        primary: '#003b71',
        primary2: '#96d9e9',
        button: {
          primary: '#002CC6',
          secundary: 'rgba(250, 250, 250, 0.2)',
        },
        '575E6B': '#575E6B',
        DEFAULT: '#FFFFFF',
        '25282B': '#25282B',
        red: {
          DEFAULT: '#D0332F',
        },
      },
      rotate: {
        120: '120deg',
      },
      borderWidth: {
        3: '3px',
      },
      screens: {
        xsm: '540px',
        xmd: '707px',
      },
      fontFamily: {
        'treble-bold': ['heading-pro-treble-bold'],
        'treble-book': ['heading-pro-treble-book'],
        'treble-regular': ['heading-pro-treble-regular'],
        'treble-extrabold': ['heading-pro-treble-extrabold'],
        'medium-heavy': ['heading-pro-medium-heavy'],
      },
      maxWidth: {
        350: '350px',
        150: '150px',
      },
    },
  },
  plugins: [],
}
