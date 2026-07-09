import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/auth/callback",
        destination: "/callback",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
