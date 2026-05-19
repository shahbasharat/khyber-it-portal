/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || "http://localhost:3001";
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*` // Proxy to backend — set NEXT_PUBLIC_API_URL in .env.local
      }
    ];
  }
};

export default nextConfig;
