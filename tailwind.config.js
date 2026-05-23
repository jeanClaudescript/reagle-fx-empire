/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        empire: {
          black: '#030308',
          navy: '#0a0f1f',
          'navy-light': '#121a35',
          purple: '#8b5cf6',
          'purple-glow': '#a855f7',
          blue: '#3b82f6',
          'blue-electric': '#00d4ff',
          green: '#10b981',
        },
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-empire':
          'linear-gradient(135deg, #030308 0%, #0a0f1f 40%, #1a1040 100%)',
        'gradient-glow':
          'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(0,212,255,0.15) 100%)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(139, 92, 246, 0.35)',
        'glow-blue': '0 0 40px rgba(0, 212, 255, 0.25)',
        'glow-sm': '0 0 20px rgba(139, 92, 246, 0.2)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
