/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'championsecuritysystem.com',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      }
    ],
  },
  reactCompiler: true,
  async rewrites() {
    return [
      // The iPhone PWA is a static SPA committed to public/app/. Serve its
      // index.html at the clean /app URL so employees can just open
      // quotation.championsecuritysystem.com/app and "Add to Home Screen".
      { source: '/app', destination: '/app/index.html' },
    ];
  },
};

export default nextConfig;
