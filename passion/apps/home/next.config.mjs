/** @type {import("next").NextConfig} */
const nextConfig = {
  // Fully static: the front door is a router, not an application. It exports to any static origin
  // and stays up whether or not the surfaces behind it do.
  output: "export",
  images: { unoptimized: true },
  transpilePackages: ["@gt100k/design-tokens", "@gt100k/ui"],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
