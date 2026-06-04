import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // 기존 정적 페이지를 public/ 에서 cleanUrls 처럼 제공.
  async rewrites() {
    return [
      { source: "/vr", destination: "/vr/index.html" },
      { source: "/fcx", destination: "/fcx/index.html" },
    ];
  },
};

export default nextConfig;
