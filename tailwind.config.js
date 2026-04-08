/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/index.html',
    './public/js/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'monospace'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
