/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api-production-7927.up.railway.app/api/:path*' // Proxy to Railway Backend
      }
    ]
  }
};

export default nextConfig;
