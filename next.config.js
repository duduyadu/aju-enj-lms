/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Workaround for Korean path issue with Turbopack
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig