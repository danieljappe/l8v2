/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Events Platform Colors
        'l8-dark': '#050505',
        'l8-beige': '#f9dfc7',
        'l8-blue': '#00c0ff',
        'l8-beige-dark': '#f0d4b0',
        'l8-beige-light': '#fce8d4',
        'l8-blue-dark': '#0099cc',
        'l8-blue-light': '#33ccff',
        
        // Booking Platform Colors
        'booking-dark': '#1a1a2e',
        'booking-orange': '#ff6b35',
        'booking-teal': '#20c997',
        'booking-orange-dark': '#e55a2b',
        'booking-orange-light': '#ff8c69',
        'booking-teal-dark': '#1a8b73',
        'booking-teal-light': '#4dd4b0',
      },
    },
  },
  plugins: [],
};
