/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,

 images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "srebewojtqazyuxdzwsr.supabase.co",
      pathname: "/storage/v1/object/public/**",
    }
  ]
},

  webpack(config, { isServer }) {
    if (isServer) {
      config.devtool = false;
    }
    return config;
  },
};

module.exports = nextConfig;
