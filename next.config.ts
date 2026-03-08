import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Deduplicate yjs — prevents "Yjs was already imported" warning
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      yjs: path.resolve("./node_modules/yjs"),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      yjs: "./node_modules/yjs",
    },
  },
};

export default nextConfig;
