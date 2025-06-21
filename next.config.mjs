/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true, // ✅ Enable native support
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.geojson$/,
      type: 'json', // Treat `.geojson` as JSON files
    });

    return config;
  },
};

export default nextConfig;
