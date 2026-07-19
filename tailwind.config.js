/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        netflix: '#E50914',
        'netflix-dark': '#B20710',
        void:     '#141414',
        surface:  '#1f1f1f',
        surface2: '#2f2f2f',
        marquee:  '#E50914',   // kept for existing class names
        stub:     '#B20710',
        ink:      '#ffffff',
        faint:    '#e5e5e5',
        muted:    '#a3a3a3',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
