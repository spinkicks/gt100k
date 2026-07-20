/** @type {import('next').NextConfig} */
const nextConfig = {
  // The domain + stub are TypeScript-source workspace packages; let Next transpile them.
  transpilePackages: ["@gt100k/learning-loop", "@gt100k/timeback-stub"],
};

export default nextConfig;
