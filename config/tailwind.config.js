const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  darkMode: 'selector',
  content: [
    './public/*.html',
    './app/helpers/**/*.rb',
    './app/javascript/**/*.js',
    './app/views/**/*.{erb,haml,html,slim}',
  ],
  theme: {
    extend: {
      fontFamily: {
        
        alfa: ['Alfa Slab One', 'cursive'],
      },
      colors: {
      },
    },
  },
  plugins: [
    // require('flowbite/plugin'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
    
  ]
}
