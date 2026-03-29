/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // In production, export as static site served by Express backend
  ...(isProd ? { output: 'export', images: { unoptimized: true } } : {}),
  images: {
    ...(isProd ? { unoptimized: true } : {}),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Rewrites only work in dev mode (not with static export)
  ...(!isProd
    ? {
        rewrites: async () => {
          return {
            beforeFiles: [
              {
                source: '/api/:path*',
                destination: 'http://localhost:4000/api/:path*',
              },
            ],
          };
        },
      }
    : {}),
};

module.exports = nextConfig;
