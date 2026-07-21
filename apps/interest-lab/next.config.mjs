/** @type {import('next').NextConfig} */
const nextConfig = {
  // The domain, view, and synthetic catalog are TypeScript-source workspace packages.
  transpilePackages: [
    "@gt100k/interest-lab",
    "@gt100k/interest-lab-view",
    "@gt100k/interest-probe-catalog",
  ],
};

export default nextConfig;
