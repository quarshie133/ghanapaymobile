import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Redirect old /auth/callback to /callback — but NEVER match /api/* paths
        source: "/auth/callback",
        destination: "/callback",
        permanent: false, // Use 307 so query params (tokens) are preserved
      },
    ];
  },
};

export default nextConfig;
