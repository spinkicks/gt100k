/** @type {import("next").NextConfig} */
const nextConfig = {
  // A production build writes into the same `.next` the dev server is reading from, which leaves it
  // serving a chunk map that no longer matches the files on disk: a working page turns into 404s on
  // `main-app.js` and `layout.css`. Nothing is actually broken and the fix is to delete the
  // directory, but the error does not say that.
  //
  // design-lab already carries this, with the note that deployed apps keep the default because
  // where their output lands is a deployment question. This app is not deployed — there is no
  // pipeline referencing it anywhere in the repo — and it is now the app most likely to be built
  // and browsed in the same minute, since it is the surface everyone looks at. Revisit if it ever
  // gains a deploy target.
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
  transpilePackages: [
    "@gt100k/design-tokens",
    "@gt100k/concierge",
    "@gt100k/discovery-catalog",
    "@gt100k/signal-pipeline",
    "@gt100k/two-axis-tagging",
  ],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
