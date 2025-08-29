import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to complete with ESLint warnings for demo page
    ignoreDuringBuilds: false,
  },
  images: {
    // Disable image optimization warnings for demo page
    unoptimized: false,
  }
};

export default nextConfig;
