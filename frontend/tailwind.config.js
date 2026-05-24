/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tier: {
          dark_green: '#166534',
          light_green: '#16a34a',
          yellow: '#ca8a04',
          orange: '#c2410c',
          red: '#b91c1c',
          gray: '#6b7280',
        },
      },
    },
  },
  plugins: [],
}
