/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@gt100k/concierge",
    "@gt100k/concierge-live",
    "@gt100k/two-axis-tagging",
  ],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
