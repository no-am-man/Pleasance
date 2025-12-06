
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {
      // Add the path to your tailwind.config.ts file.
      config: './tailwind.config.ts',
    },
    autoprefixer: {},
  },
};

export default config;
