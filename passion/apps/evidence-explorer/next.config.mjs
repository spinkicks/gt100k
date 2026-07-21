/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@gt100k/evidence-explorer-view",
    "@gt100k/evidence-graph",
    "@gt100k/evidence-hash-node",
    "@gt100k/evidence-verifier-stub",
    "@gt100k/evidence-deferred",
  ],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
