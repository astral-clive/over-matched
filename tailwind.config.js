/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tank: {
          from: '#3b82f6',
          to: '#8b5cf6',
        },
        damage: {
          from: '#ef4444',
          to: '#f97316',
        },
        support: {
          from: '#10b981',
          to: '#06b6d4',
        },
      },
    },
  },
  plugins: [],
}
