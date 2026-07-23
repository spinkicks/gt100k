/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@gt100k/hypothesis-store",
    "@gt100k/interest-inference",
    "@gt100k/signal-pipeline",
    "@gt100k/two-axis-tagging",
    "@gt100k/student-profile",
  ],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
