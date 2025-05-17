/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // Ensure Tailwind scans your files for classes
  ],
  theme: {
    extend: {
      backgroundImage: {
        'pricing-gradient': 'linear-gradient(to bottom, #FFF3C4, #FFFDF9)', // Custom gradient
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
        poppins: ['var(--font-poppins)'],
        montserrat: ['var(--font-montserrat)'],
        bricolage: ['var(--font-bricolage)'],
      },
    },
  },
  plugins: [],
};