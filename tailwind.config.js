/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#FF6B35',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
