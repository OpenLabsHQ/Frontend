module.exports = {
  mode: 'jit',
  purge: ['./src/**/*.{js,jsx,ts,tsx'],
  plugins: {
    '@tailwindcss/postcss': {}, // Explicitly use the new package
    autoprefixer: {}
  }
};
