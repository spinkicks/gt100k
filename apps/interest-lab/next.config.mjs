/** @type {import('next').NextConfig} */
const nextConfig = {
  // The domain + view are TypeScript-source workspace packages; let Next transpile them.
  transpilePackages: ["@gt100k/interest-lab", "@gt100k/interest-lab-view"],
};

export default nextConfig;
