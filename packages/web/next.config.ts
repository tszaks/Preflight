import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ['@preflight/shared'],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
