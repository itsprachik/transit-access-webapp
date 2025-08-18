/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false, // hides Vercel icon in corner
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
