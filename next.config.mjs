/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This allows the Next.js dev server to accept requests from any origin.
    // This is required for the Firebase Studio development environment.
    allowedDevOrigins: ["*"],
  },
};

export default nextConfig;
