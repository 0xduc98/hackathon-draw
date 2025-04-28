/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)'],
      },
      colors: {
        primary: '#6A1EBB',
        'primary-light': '#8A4EDD',
        'primary-dark': '#4A0F8F',
      },
    },
  },
  plugins: [],
}

