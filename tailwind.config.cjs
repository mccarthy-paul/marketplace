/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tell Tailwind which files to scan for class names
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    extend: {
      // Custom brand font (optional)
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },

      // Custom colours (so you can reuse them by name instead of hex)
      colors: {
        brand:  {
          DEFAULT: '#0b3d2e',   // dark green
          light:   '#0d503b',   // hover green
        },
        accent: {
          DEFAULT: '#facc15',   // warm gold (Tailwind's amber-400)
          light:   '#fcd34d',   // hover
        },
      },
    },
  },

  // Extra Tailwind plugins (remove forms if you’re not using it)
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

