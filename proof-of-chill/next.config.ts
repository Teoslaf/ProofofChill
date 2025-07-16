import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use 'standalone' output for better compatibility with serverless functions
  output: 'standalone',
  
  // Enable React Strict Mode for better development practices
  reactStrictMode: true,
  
  // Configure image optimization
  images: {
    domains: [
      'localhost',
      'vercel.app',
      '*.vercel.app',
      'worldcoin.org',
      '*.worldcoin.org'
    ],
    // Enable image optimization in production
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  
  // Enable server actions if needed
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Handle API routes and rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  
  // TypeScript configuration
  typescript: {
    // Enable build to complete even with TypeScript errors (not recommended for production)
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Don't fail build on ESLint warnings
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
