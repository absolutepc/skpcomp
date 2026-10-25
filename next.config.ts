import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vinext inspects multipart POSTs for server actions before API dispatch.
  // Allow the media endpoint's 8 MiB files plus multipart framing through;
  // /api/media still enforces its own file-size, type and authorization checks.
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
};

export default nextConfig;
