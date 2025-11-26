import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Tăng giới hạn lên 10MB, bạn có thể điều chỉnh tùy ý
    },
  },

  // Exclude instrumentation from Edge Runtime analysis
  serverExternalPackages: ['instrumentation'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'www.figma.com',
      },
      {
        protocol: "http",
        hostname: "*"
      },
      {
        protocol: "https",
        hostname: "*"
      },
      {
        protocol: "https",
        hostname: "zalo-miniapp.github.io"
      }
    ],
  },

  // Turbopack config for Next.js 16
  turbopack: {},
};

export default nextConfig;
