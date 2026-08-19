/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // admin-configured video thumbnails, etc.
    ],
  },
};

module.exports = nextConfig;
