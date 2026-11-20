import type { Scene } from "./content";

export type Tier = "desktop" | "mobile";

const pad = (n: number) => String(n).padStart(4, "0");

export function pickTier(): Tier {
  return window.matchMedia("(max-width: 820px), (pointer: coarse)").matches ? "mobile" : "desktop";
}

/**
 * Memory-safe frame store.
 * - Compressed frames (WebP blobs, ~18 MB total on desktop) are all kept in memory.
 * - Decoded ImageBitmaps live in a small LRU (a 1280x720 bitmap is ~3.7 MB), decoded on demand
 *   around the playhead, so memory stays bounded regardless of total frame count.
 */
export class FrameStore {
  private blobs: (Blob | undefined)[][];
  private cache = new Map<string, ImageBitmap>(); // insertion order = LRU order
  private pending = new Set<string>();
  loaded = 0;
  readonly total: number;
  private disposed = false;

  constructor(private ids: string[], private counts: number[], private tier: Tier, private maxDecoded: number) {
    this.blobs = counts.map((c) => new Array(c));
    this.total = counts.reduce((a, b) => a + b, 0);
  }

  sceneLoaded(s: number) { return this.blobs[s].filter(Boolean).length; }

  /** Fetch compressed frames for one scene, in playback order. */
  async loadScene(s: number, onProgress: () => void, concurrency = 8) {
    let next = 0;
    const count = this.counts[s];
    const worker = async () => {
      while (next < count && !this.disposed) {
        const i = next++;
        try {
          const res = await fetch(`/frames/${this.tier}/${this.ids[s]}/${pad(i)}.webp`);
          if (res.ok) this.blobs[s][i] = await res.blob();
        } catch { /* leave missing; nearest-frame fallback covers it */ }
        this.loaded++;
        onProgress();
      }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));
  }

  private key(s: number, i: number) { return `${s}:${i}`; }

  private put(k: string, bmp: ImageBitmap) {
    if (this.disposed) { bmp.close(); return; }
    this.cache.set(k, bmp);
    while (this.cache.size > this.maxDecoded) {
      const oldest = this.cache.keys().next().value as string;
      this.cache.get(oldest)?.close();
      this.cache.delete(oldest);
    }
  }

  private decode(s: number, i: number) {
    const k = this.key(s, i);
    const blob = this.blobs[s][i];
    if (!blob || this.cache.has(k) || this.pending.has(k)) return;
    this.pending.add(k);
    createImageBitmap(blob).then((b) => this.put(k, b)).catch(() => {}).finally(() => this.pending.delete(k));
  }

  private nearestBlob(s: number, i: number) {
    const n = this.counts[s];
    for (let d = 0; d < n; d++) {
      if (this.blobs[s][i - d]) return i - d;
      if (this.blobs[s][i + d]) return i + d;
    }
    return -1;
  }

  /** Best available decoded frame now; schedules decoding of the exact frame plus lookahead in the travel direction. */
  get(s: number, idx: number, dir = 1): ImageBitmap | undefined {
    const n = this.counts[s];
    const want = this.nearestBlob(s, Math.max(0, Math.min(n - 1, Math.round(idx))));
    if (want < 0) return undefined;
    this.decode(s, want);
    // Lookahead only when the decode queue is short, so a fast flick never buries the exact frame behind stale work.
    if (this.pending.size < 6) {
      for (let k = 1; k <= 14; k++) {
        const a = want + dir * k, b = want - dir * (k >> 1);
        if (a >= 0 && a < n) this.decode(s, a);
        if (b >= 0 && b < n) this.decode(s, b);
      }
    }
    for (let d = 0; d <= 24; d++) {
      for (const j of d === 0 ? [want] : [want - d, want + d]) {
        const k = this.key(s, j);
        const bmp = this.cache.get(k);
        if (bmp) { this.cache.delete(k); this.cache.set(k, bmp); return bmp; } // touch LRU
      }
    }
  }

  dispose() {
    this.disposed = true;
    this.cache.forEach((b) => b.close());
    this.cache.clear();
  }
}

export function buildStore(scenes: Scene[], tier: Tier) {
  const maxDecoded = tier === "desktop" ? 120 : 96; // ~450 MB / ~115 MB worst case
  return new FrameStore(scenes.map((s) => s.id), scenes.map((s) => s.frames[tier]), tier, maxDecoded);
}

/** Draw bitmap to cover the canvas (object-fit: cover). */
export function drawCover(ctx: CanvasRenderingContext2D, bmp: ImageBitmap, w: number, h: number, alpha = 1) {
  const s = Math.max(w / bmp.width, h / bmp.height);
  const dw = bmp.width * s, dh = bmp.height * s;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.globalAlpha = alpha;
  ctx.drawImage(bmp, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.globalAlpha = 1;
}
