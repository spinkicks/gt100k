/** @type {import("next").NextConfig} */
const nextConfig = {
  // Fully static: the page is prose plus a client-side widget with no server logic,
  // so we export a static site that hosts on any static origin (AWS Amplify/S3).
  output: "export",
  images: { unoptimized: true },
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
