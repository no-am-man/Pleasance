
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ensure the CSS rule is correctly configured
    const oneOf = config.module.rules.find((rule) => typeof rule.oneOf === 'object');
    if (oneOf) {
      const cssRule = oneOf.oneOf.find(
        (rule) => rule.test?.toString().includes('css')
      );
      if (cssRule) {
        // You can add further specific loader configurations here if needed
      }
    }
    
    // For SVG handling if you need it in the future, but not related to the current error
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;
