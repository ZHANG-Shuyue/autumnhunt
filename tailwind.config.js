/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          cream: '#E8D5B7',
          mist: '#B8C5D6',
          rose: '#D4B5B0',
          sage: '#A8B5A0',
          ash: '#C5BDB5',
        },
        neutral: {
          bg: '#FAF7F2',
          card: '#FFFFFF',
          border: '#EDE6DB',
          text: '#5C5048',
          muted: '#8A7F75',
        },
      },
      borderRadius: {
        '2xl': '16px',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(92, 80, 72, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        zh: ['PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        en: ['Inter', 'Helvetica Neue', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
