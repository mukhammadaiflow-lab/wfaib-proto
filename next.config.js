/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable standalone output for Docker
  output: 'standalone',
  
  // TODO Phase 2: Add security headers for production
  // async headers() {
  //   return [
  //     {
  //       source: '/:path*',
  //       headers: [
  //         { key: 'X-Frame-Options', value: 'DENY' },
  //         { key: 'X-Content-Type-Options', value: 'nosniff' },
  //         { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  //       ],
  //     },
  //   ]
  // },
  
  // TODO Phase 2: Configure CSP
}

module.exports = nextConfig
