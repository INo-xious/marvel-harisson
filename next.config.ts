import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve the current painting at the canonical root; retain the earlier routes.
  async rewrites() {
    return { beforeFiles: [{ source: "/", destination: "/brush-study.html" }] };
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
