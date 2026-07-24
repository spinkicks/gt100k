/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@gt100k/evidence-explorer-view",
    "@gt100k/evidence-graph",
    "@gt100k/evidence-hash-node",
    "@gt100k/evidence-verifier-stub",
    "@gt100k/evidence-deferred",
    "@gt100k/evidence-tiny-game",
    "@gt100k/evidence-repo-postgres",
  ],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
    // pglite ships a WASM Postgres; keep it OUT of the server bundle so Next loads it from
    // node_modules at runtime (bundling the .wasm breaks resolution). Server-only package.
    serverComponentsExternalPackages: ["@electric-sql/pglite"],
  },
};

export default nextConfig;
