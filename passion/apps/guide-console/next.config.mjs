/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@gt100k/concierge",
    "@gt100k/family",
    "@gt100k/hypothesis-store",
    "@gt100k/interest-inference",
    "@gt100k/signal-pipeline",
    "@gt100k/two-axis-tagging",
    "@gt100k/student-profile",
    "@gt100k/specialization-planner",
    "@gt100k/wellbeing",
  ],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
