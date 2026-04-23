import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
};

export default nextConfig;
