/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          dark: '#E55A26',
          light: '#FF8C5A',
        },
        secondary: '#1A1A2E',
        accent: '#FFD700',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        'bg-light': '#F8F9FA',
        'text-primary': '#1A1A2E',
        'text-secondary': '#6B7280',
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'primary': '0 0 0 3px rgba(255, 107, 53, 0.2)',
      },
    },
  },
  plugins: [],
}