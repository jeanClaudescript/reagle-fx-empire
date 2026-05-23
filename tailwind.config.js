/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
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
        theme: {
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          elevated: 'rgb(var(--color-elevated) / <alpha-value>)',
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          accent: 'rgb(var(--color-accent) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-empire':
          'linear-gradient(135deg, rgb(var(--gradient-from)) 0%, rgb(var(--gradient-mid)) 45%, rgb(var(--gradient-to)) 100%)',
        'mesh-hero': 'var(--mesh-hero)',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
        'glow-blue': 'var(--shadow-glow-blue)',
        'glow-sm': 'var(--shadow-glow-sm)',
        glass: 'var(--shadow-glass)',
        'mobile-card': 'var(--shadow-mobile)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'live-pulse': 'live-pulse 1.5s ease-in-out infinite',
        'scan-line': 'scan-line 4s linear infinite',
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
        'live-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.15)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
}
