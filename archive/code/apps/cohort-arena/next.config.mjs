/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: ["@gt100k/cohort-arena-view", "@gt100k/cohort-compiler"],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
