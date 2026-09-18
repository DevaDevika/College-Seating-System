import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_URL ?? "http://127.0.0.1:8788";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;