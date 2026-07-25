/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: ["@gt100k/design-tokens"],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
