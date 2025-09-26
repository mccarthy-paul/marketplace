/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tell Tailwind which files to scan for class names
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  darkMode: 'class', // Enable dark mode with class strategy

  theme: {
    extend: {
      // Luxury fonts
      fontFamily: {
        'serif': ['Playfair Display', 'Georgia', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Bebas Neue', 'Impact', 'sans-serif'],
      },

      // Luxury color palette
      colors: {
        // Primary luxury colors
        luxury: {
          dark: '#0a0a0a',      // Almost black
          charcoal: '#1a1a1a',  // Charcoal
          gray: '#2d2d2d',      // Dark gray
          medium: '#404040',    // Medium gray
          light: '#666666',     // Light gray
        },
        // Gold accents - Updated to Luxe 24 bronze tones
        gold: {
          DEFAULT: '#BA997D',   // Luxe 24 bronze
          light: '#D4B5A0',     // Light bronze
          dark: '#9A7A5D',      // Dark bronze
          rose: '#e8c9a0',      // Rose gold
        },
        // Luxe24 light theme colors
        'luxe-bronze': '#BA997D',    // Primary rose gold/bronze
        'luxe-bronze-dark': '#9A7A5D',  // Dark bronze
        // Neutral palette
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Keep green for success states
        success: {
          DEFAULT: '#3ab54a',
          light: '#4ade80',
          dark: '#15803d',
        },
      },

      // Animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'zoom-in': 'zoomIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      // Box shadows for depth
      boxShadow: {
        'luxury': '0 10px 40px rgba(0, 0, 0, 0.15)',
        'luxury-lg': '0 20px 60px rgba(0, 0, 0, 0.25)',
        'gold': '0 4px 20px rgba(212, 175, 55, 0.25)',
      },

      // Background patterns
      backgroundImage: {
        'gradient-luxury': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        'gradient-gold': 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
        'gradient-subtle': 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)',
      },
    },
  },

  // Extra Tailwind plugins
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};

