/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully client-side app: static export for Cloudflare Pages
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
