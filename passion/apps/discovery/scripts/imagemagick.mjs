// Finding ImageMagick, which is two different command names and not always installed.
//
// The tile art's uniformity is a measurement rather than a style claim, so the thing that checks it
// has to actually run — a skipped luminance test is the confound going unmeasured while the suite
// stays green. That makes "which binary, and is it here" worth a module rather than a guess.
//
// TWO NAMES. ImageMagick 7 renamed `convert` to `magick` and keeps `convert` only as a deprecated
// shim that prints a warning to stderr. Ubuntu still ships 6.9, where `convert` is the real name and
// `magick` does not exist. Preferring `magick` and falling back means the same code works on a
// developer's machine and on a runner without either one having to match the other.
//
// NOT ALWAYS INSTALLED. It used to be preinstalled on `ubuntu-latest` and this was written assuming
// so. That assumption failed in CI with `convert: command not found`, which is why the workflow now
// installs it explicitly for the one job that needs it, and why this throws a sentence explaining
// the fix rather than an ENOENT from inside a test about brightness.
import { execFileSync } from "node:child_process";

function resolve() {
  for (const bin of ["magick", "convert"]) {
    try {
      execFileSync(bin, ["-version"], { stdio: "ignore" });
      return bin;
    } catch {
      // Try the next name.
    }
  }
  throw new Error(
    "ImageMagick not found (looked for `magick`, then `convert`). " +
      "Install it — `sudo apt-get install imagemagick` on Debian or Ubuntu, `brew install imagemagick` on macOS. " +
      "The browse wall's art is checked by measuring it, so this cannot be skipped.",
  );
}

/** The binary name, resolved once per process. */
export const IM = resolve();

/** Run ImageMagick and return its trimmed stdout. */
export function magick(args) {
  return execFileSync(IM, args, { encoding: "utf8" }).trim();
}
