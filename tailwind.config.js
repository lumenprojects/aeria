/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'light': '#F5F6FF',
        'dark': '#101015',
        'accent-1': '#4A6FA5',
        'accent-2': '#B8860B',
        'accent-3': '#6B8E23',
        'success': '#4CAF50',
        'warning': '#FF9800',
        'error': '#F44336',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '2rem',
      },
      boxShadow: {
        'card': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
      transitionDuration: {
        '400': '400ms',
      },
      height: {
        'navbar': '94px',
      },
      maxWidth: {
        'reader': '65ch',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: 'var(--text-primary)',
            a: {
              color: theme('colors.accent-1'),
              '&:hover': {
                color: theme('colors.accent-1'),
                textDecoration: 'underline',
              },
            },
            h1: {
              color: 'var(--text-primary)',
              fontWeight: '600',
            },
            h2: {
              color: 'var(--text-primary)',
              fontWeight: '600',
            },
            h3: {
              color: 'var(--text-primary)',
              fontWeight: '600',
            },
            h4: {
              color: 'var(--text-primary)',
              fontWeight: '600',
            },
            blockquote: {
              borderLeftColor: theme('colors.accent-1'),
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
