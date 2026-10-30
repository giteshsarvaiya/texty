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
  // Serve published docs as Markdown to agents: /p/:docId.md or Accept: text/markdown
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/p/:docId.md', destination: '/api/md/:docId' },
        {
          source: '/p/:docId',
          has: [{ type: 'header', key: 'accept', value: '(.*)text/markdown(.*)' }],
          destination: '/api/md/:docId',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  turbopack: {
    resolveAlias: {
      yjs: "./node_modules/yjs",
    },
  },
};

export default nextConfig;
