import type { NextConfig } from "next";

const supabaseBackendUrl =
  process.env.INTERNAL_SUPABASE_URL || "http://187.53.141.200:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/supabase-proxy/:path*",
        destination: `${supabaseBackendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
