/**
 * Tiny anti-aliased polygon rasterizer + PNG encoder, zero dependencies.
 *
 * Why hand-roll this: the board renderer only ever draws filled polygons,
 * circles and rings, so a general SVG rasterizer (librsvg/sharp/cairo) would be
 * a heavy native dependency bought for nothing — and one that commonly is not
 * installed. Node's built-in zlib is enough to write a PNG, and even-odd
 * scanline filling with sub-row supersampling is enough to draw a board that
 * survives a vision check. The payoff is a skill that runs on any machine with
 * `node` and no install step.
 */

import { deflateSync } from "node:zlib";

const SUBROWS = 4; // vertical samples per pixel row; 4 is plenty for board art

export class Canvas {
  /** @param {number} width @param {number} height @param {[number,number,number]} bg */
  constructor(width, height, bg = [255, 255, 255]) {
    this.width = width;
    this.height = height;
    this.px = new Uint8Array(width * height * 3);
    for (let i = 0; i < this.px.length; i += 3) {
      this.px[i] = bg[0];
      this.px[i + 1] = bg[1];
      this.px[i + 2] = bg[2];
    }
    this._cov = new Float32Array(width);
  }

  /**
   * Fill subpaths with the even-odd rule. Even-odd means an inner loop punches a
   * hole, which is how rings and the bishop's slit are drawn without needing
   * boolean path operations.
   * @param {Array<Array<[number,number]>>} subpaths
   * @param {[number,number,number]} color
   * @param {number} alpha
   */
  fill(subpaths, color, alpha = 1) {
    const edges = [];
    let ymin = Infinity;
    let ymax = -Infinity;
    for (const path of subpaths) {
      const n = path.length;
      if (n < 3) continue;
      for (let i = 0; i < n; i++) {
        const [x0, y0] = path[i];
        const [x1, y1] = path[(i + 1) % n];
        if (y0 === y1) continue; // horizontal edges contribute no crossings
        edges.push([x0, y0, x1, y1]);
        if (y0 < ymin) ymin = y0;
        if (y1 < ymin) ymin = y1;
        if (y0 > ymax) ymax = y0;
        if (y1 > ymax) ymax = y1;
      }
    }
    if (!edges.length) return;

    const rowStart = Math.max(0, Math.floor(ymin));
    const rowEnd = Math.min(this.height - 1, Math.ceil(ymax));
    const cov = this._cov;
    const xs = [];

    for (let py = rowStart; py <= rowEnd; py++) {
      cov.fill(0);
      for (let s = 0; s < SUBROWS; s++) {
        const sy = py + (s + 0.5) / SUBROWS;
        xs.length = 0;
        for (const [x0, y0, x1, y1] of edges) {
          // Half-open [min,max) test: a vertex shared by two edges is counted
          // once, which keeps parity correct at polygon corners.
          if (sy >= Math.min(y0, y1) && sy < Math.max(y0, y1)) {
            xs.push(x0 + ((sy - y0) * (x1 - x0)) / (y1 - y0));
          }
        }
        if (xs.length < 2) continue;
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) {
          this._addSpan(cov, xs[i], xs[i + 1], 1 / SUBROWS);
        }
      }
      const base = py * this.width * 3;
      for (let x = 0; x < this.width; x++) {
        const a = Math.min(1, cov[x]) * alpha;
        if (a <= 0) continue;
        const o = base + x * 3;
        this.px[o] = this.px[o] + (color[0] - this.px[o]) * a;
        this.px[o + 1] = this.px[o + 1] + (color[1] - this.px[o + 1]) * a;
        this.px[o + 2] = this.px[o + 2] + (color[2] - this.px[o + 2]) * a;
      }
    }
  }

  /** Accumulate horizontal coverage for one span, with fractional end pixels. */
  _addSpan(cov, xa, xb, weight) {
    if (xb <= 0 || xa >= this.width) return;
    if (xa < 0) xa = 0;
    if (xb > this.width) xb = this.width;
    if (xb <= xa) return;
    const ia = Math.floor(xa);
    const ib = Math.floor(xb);
    if (ia === ib) {
      cov[ia] += (xb - xa) * weight;
      return;
    }
    cov[ia] += (ia + 1 - xa) * weight;
    for (let i = ia + 1; i < ib; i++) cov[i] += weight;
    if (ib < this.width) cov[ib] += (xb - ib) * weight;
  }

  rect(x, y, w, h, color, alpha = 1) {
    this.fill([[[x, y], [x + w, y], [x + w, y + h], [x, y + h]]], color, alpha);
  }

  circle(cx, cy, r, color, alpha = 1) {
    this.fill([circlePath(cx, cy, r)], color, alpha);
  }

  ring(cx, cy, rOuter, rInner, color, alpha = 1) {
    this.fill([circlePath(cx, cy, rOuter), circlePath(cx, cy, rInner)], color, alpha);
  }

  toPNG() {
    return encodePNG(this.width, this.height, this.px);
  }
}

export function circlePath(cx, cy, r, segments = 72) {
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]);
  }
  return pts;
}

/**
 * Grow a closed path outward by `d` pixels along each vertex's direction from
 * the path centroid. Drawing the grown path in the outline colour and then the
 * original on top yields a cheap, uniform-looking outline — enough to keep a
 * white piece legible on a light square without implementing true polygon
 * offsetting.
 */
export function grow(path, d) {
  let cx = 0;
  let cy = 0;
  for (const [x, y] of path) {
    cx += x;
    cy += y;
  }
  cx /= path.length;
  cy /= path.length;
  return path.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [x + (dx / len) * d, y + (dy / len) * d];
  });
}

// ---------------------------------------------------------------- PNG encoding

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

export function encodePNG(width, height, rgb) {
  const stride = width * 3;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0 (None)
    Buffer.from(rgb.buffer, rgb.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2 = truecolour RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
