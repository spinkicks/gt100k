/**
 * PNG decoding and downscaling.
 *
 * This exists to keep vision calls reliable. A 1024x1024 PNG straight out of
 * gpt-image-2 is around 2 MB, which is ~2.7 MB once base64-encoded, and the
 * gateway drops the socket mid-upload on payloads that size often enough that
 * retrying does not save you. Downscaling first is the actual fix: a board only
 * has to be legible enough to count squares and name pieces, and at 640px a
 * chessboard still gives 80 pixels per square.
 *
 * Only 8-bit non-interlaced PNGs are handled — that covers everything this skill
 * produces or receives from the gateway. Anything else is passed through
 * untouched rather than corrupted.
 */

import { inflateSync } from "node:zlib";
import { encodePNG } from "./raster.mjs";

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

export function isPNG(bytes) {
  return bytes.length > 8 && bytes.readUInt32BE(0) === 0x89504e47;
}

/**
 * Decode to {width, height, rgb} (3 bytes per pixel). Returns null when the file
 * uses a feature this decoder does not cover, so callers can fall back.
 */
export function decodePNG(buf) {
  if (!isPNG(buf)) return null;
  let off = 8;
  let width, height, depth, ctype, interlace;
  let palette = null;
  const idat = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      ctype = data[9];
      interlace = data[12];
    } else if (type === "PLTE") palette = data;
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  const channels = CHANNELS[ctype];
  if (depth !== 8 || interlace !== 0 || !channels || !idat.length) return null;
  if (ctype === 3 && !palette) return null;

  const bpp = channels;
  const stride = width * bpp;
  let raw;
  try {
    raw = inflateSync(Buffer.concat(idat));
  } catch {
    return null;
  }
  if (raw.length < height * (stride + 1)) return null;

  const lines = Buffer.alloc(height * stride);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const cur = lines.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? lines.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
  }

  // Normalise every colour type to plain RGB, compositing any alpha onto white.
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, px = 0; px < width * height; px++) {
    const o = px * bpp;
    let r, g, b, alpha = 255;
    if (ctype === 0) r = g = b = lines[o];
    else if (ctype === 4) {
      r = g = b = lines[o];
      alpha = lines[o + 1];
    } else if (ctype === 2) [r, g, b] = [lines[o], lines[o + 1], lines[o + 2]];
    else if (ctype === 6) {
      [r, g, b] = [lines[o], lines[o + 1], lines[o + 2]];
      alpha = lines[o + 3];
    } else {
      const idx = lines[o] * 3;
      [r, g, b] = [palette[idx], palette[idx + 1], palette[idx + 2]];
    }
    if (alpha !== 255) {
      const a = alpha / 255;
      r = Math.round(r * a + 255 * (1 - a));
      g = Math.round(g * a + 255 * (1 - a));
      b = Math.round(b * a + 255 * (1 - a));
    }
    rgb[i++] = r;
    rgb[i++] = g;
    rgb[i++] = b;
  }
  return { width, height, rgb };
}

/** Box-filter downscale to at most maxDim on the long edge. */
function boxDownscale({ width, height, rgb }, maxDim) {
  const scale = maxDim / Math.max(width, height);
  if (scale >= 1) return { width, height, rgb };
  const outW = Math.max(1, Math.round(width * scale));
  const outH = Math.max(1, Math.round(height * scale));
  const out = new Uint8Array(outW * outH * 3);
  for (let y = 0; y < outH; y++) {
    const y0 = Math.floor((y * height) / outH);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * height) / outH));
    for (let x = 0; x < outW; x++) {
      const x0 = Math.floor((x * width) / outW);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * width) / outW));
      let r = 0, g = 0, b = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const o = (sy * width + sx) * 3;
          r += rgb[o];
          g += rgb[o + 1];
          b += rgb[o + 2];
          n++;
        }
      }
      const o = (y * outW + x) * 3;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
    }
  }
  return { width: outW, height: outH, rgb: out };
}

/**
 * Shrink a PNG for upload. Returns the original bytes unchanged if it is already
 * small enough, is not a decodable PNG, or if re-encoding somehow came out bigger.
 */
export function shrinkForUpload(bytes, { maxDim = 512, maxBytes = 600_000 } = {}) {
  if (!isPNG(bytes) || bytes.length <= maxBytes) return bytes;
  const decoded = decodePNG(bytes);
  if (!decoded) return bytes;
  const small = boxDownscale(decoded, maxDim);
  const out = encodePNG(small.width, small.height, small.rgb);
  return out.length < bytes.length ? out : bytes;
}
