/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  },
  webpack(config, { isServer }) {
    if (isServer) {
      config.devtool = false;
    }
    return config;
  }
};

module.exports = nextConfig;
