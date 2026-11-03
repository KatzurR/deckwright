/**
 * Generates the tileable card textures (leather grain, parchment clouds) as small PNG files in
 * src/render/textures/. Deterministic (seeded), so re-running produces identical files.
 * Run: npm run textures
 *
 * Why PNG and not an SVG feTurbulence filter: the 300 dpi export renders the card through an
 * SVG foreignObject (html-to-image), where nested SVG filters render black.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { encodePng } from '../src/export/png';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable value noise: lattice of `period` cells over `size` pixels, wrapped at the edges. */
function valueNoise(size: number, period: number, seed: number): Float32Array {
  const rand = rng(seed);
  const lattice = Array.from({ length: period * period }, rand);
  const at = (x: number, y: number) => lattice[((y % period) + period) % period * period + (((x % period) + period) % period)];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const out = new Float32Array(size * size);
  const cell = size / period;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = x / cell;
      const gy = y / cell;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const tx = smooth(gx - x0);
      const ty = smooth(gy - y0);
      const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
      const bottom = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
      out[y * size + x] = top * (1 - ty) + bottom * ty;
    }
  }
  return out;
}

function fractal(size: number, periods: number[], weights: number[], seed: number): Float32Array {
  const out = new Float32Array(size * size);
  const total = weights.reduce((a, b) => a + b, 0);
  periods.forEach((p, i) => {
    const n = valueNoise(size, p, seed + i * 101);
    for (let k = 0; k < out.length; k++) out[k] += (n[k] * weights[i]) / total;
  });
  return out;
}

function texture(size: number, noise: Float32Array, color: [number, number, number], alpha: (v: number) => number): Uint8Array {
  const px = new Uint8Array(size * size * 4);
  for (let k = 0; k < noise.length; k++) {
    px.set([...color, Math.round(Math.max(0, Math.min(1, alpha(noise[k]))) * 255)], k * 4);
  }
  return encodePng(size, size, px);
}

const SIZE = 256;
const dir = new URL('../src/render/textures/', import.meta.url);
mkdirSync(dir, { recursive: true });

// Leather: mottled dark patches plus fine grain, as a dark overlay on the leather colour.
const leather = fractal(SIZE, [4, 8, 16, 64, 128], [0.35, 0.25, 0.15, 0.15, 0.1], 7);
writeFileSync(new URL('leather.png', dir), texture(SIZE, leather, [24, 10, 3], (v) => (v - 0.25) * 1.1));

// Parchment: soft clouds, as a light brown overlay on the parchment colour.
const parchment = fractal(SIZE, [2, 4, 8, 32], [0.4, 0.3, 0.2, 0.1], 3);
writeFileSync(new URL('parchment.png', dir), texture(SIZE, parchment, [120, 82, 36], (v) => (v - 0.3) * 0.42));

console.log('src/render/textures/{leather,parchment}.png written');
