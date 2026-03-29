/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
        display: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        cyber: {
          bg:      '#020810',
          panel:   '#050e1a',
          border:  '#0a2040',
          accent:  '#00d4ff',
          accent2: '#ff3d6e',
          accent3: '#00ff9d',
          dim:     '#2a4a6a',
          text:    '#a8d4f5',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scanLine 3s ease-in-out infinite',
        'blink': 'blink 1s steps(1) infinite',
      },
    },
  },
  plugins: [],
}
