/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#5aa38f',
        accent: '#f0b968',
      },
    },
  },
  plugins: [],
};

