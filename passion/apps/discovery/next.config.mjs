/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@gt100k/design-tokens",
    "@gt100k/concierge",
    "@gt100k/discovery-catalog",
    "@gt100k/signal-pipeline",
    "@gt100k/two-axis-tagging",
  ],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
