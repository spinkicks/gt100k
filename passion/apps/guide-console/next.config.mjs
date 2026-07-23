/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: ["@gt100k/hypothesis-store", "@gt100k/interest-inference"],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
