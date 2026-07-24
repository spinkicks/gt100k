/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@gt100k/project-workspace",
    "@gt100k/evidence-graph",
    "@gt100k/specialization-planner",
  ],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
