/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#FF6B35',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}

