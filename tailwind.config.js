/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Source Serif 4', 'Georgia', 'serif'],
        sans: ['Source Serif 4', 'Georgia', 'serif'],
      },
      colors: {
        green: {
          50: '#EAF3DE',
          100: '#C0DD97',
          200: '#97C459',
          300: '#7AB840',
          400: '#5FA030',
          500: '#4A8520',
          600: '#3B6D11',
          700: '#2D5509',
          800: '#214006',
          900: '#173404',
        },
      },
    },
  },
  plugins: [],
}
