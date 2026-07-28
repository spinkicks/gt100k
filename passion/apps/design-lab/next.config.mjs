/** @type {import("next").NextConfig} */
const nextConfig = {
  // A production build writes into the same `.next` the dev server is reading from, which leaves it
  // serving a chunk map that no longer matches the files on disk: "Cannot find module './935.js'",
  // in a red overlay, on a page that was working a second ago. Nothing is actually broken and the
  // fix is to delete the directory, but the error does not say that and it costs whoever hits it
  // twenty minutes.
  //
  // So builds go somewhere else. Only here: this is the prototype lab, it is not deployed, and it is
  // the app most likely to be built and browsed at the same time. The deployed apps keep the default
  // because changing where their output lands is a deployment question, not a convenience one.
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
  transpilePackages: ["@gt100k/concierge", "@gt100k/design-tokens", "@gt100k/two-axis-tagging"],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
