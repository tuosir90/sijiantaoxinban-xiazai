/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      {
        source: '/ui/unified-ui.html',
        destination: '/',
      },
      {
        source: '/ui/image-merger.html',
        destination: '/image-merger',
      },
    ]
  },
}

export default nextConfig
