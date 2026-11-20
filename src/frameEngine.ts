import type { Scene } from "./content";

export type Tier = "desktop" | "mobile";

const pad = (n: number) => String(n).padStart(4, "0");

export function pickTier(): Tier {
  return window.matchMedia("(max-width: 820px), (pointer: coarse)").matches ? "mobile" : "desktop";
}

/**
 * Memory-safe, progressive on-demand frame store.
 * - Stride-first progressive loading: grabs milestone keyframes first so seeking is instantaneous,
 *   then fills intermediate frames in the background.
 * - On-demand scene fetching: only loads active and approaching scenes.
 * - Bound LRU bitmap memory: prevents GPU memory thrashing and mobile browser tab crashes.
 */
export class FrameStore {
  private blobs: (Blob | undefined)[][];
  private cache = new Map<string, ImageBitmap>(); // insertion order = LRU order
  private pending = new Set<string>();
  private activeLoads = new Set<number>();
  private abortControllers = new Map<number, AbortController>();
  loaded = 0;
  readonly total: number;
  private disposed = false;

  constructor(
    private ids: string[],
    private counts: number[],
    private tier: Tier,
    private maxDecoded: number
  ) {
    this.blobs = counts.map((c) => new Array(c));
    this.total = counts.reduce((a, b) => a + b, 0);
  }

  sceneLoaded(s: number) {
    return this.blobs[s] ? this.blobs[s].filter(Boolean).length : 0;
  }

  isSceneLoading(s: number) {
    return this.activeLoads.has(s);
  }

  /**
   * Progressive two-pass loader for one scene:
   * Pass 1: Keyframe strides (every 4th frame on desktop, 3rd on mobile) so scrubbing across the entire scene works within seconds.
   * Pass 2: Fills intermediate frames for full 60fps micro-smoothness.
   */
  async loadScene(s: number, onProgress?: () => void, concurrency = 6) {
    if (s < 0 || s >= this.ids.length || this.activeLoads.has(s) || this.disposed) return;
    this.activeLoads.add(s);

    const controller = new AbortController();
    this.abortControllers.set(s, controller);
    const count = this.counts[s];
    const stride = this.tier === "desktop" ? 4 : 3;

    const pass1: number[] = [];
    const pass2: number[] = [];
    for (let i = 0; i < count; i++) {
      if (i % stride === 0 || i === count - 1) pass1.push(i);
      else pass2.push(i);
    }
    const sequence = [...pass1, ...pass2];
    let nextIdx = 0;

    const worker = async () => {
      while (nextIdx < sequence.length && !this.disposed && !controller.signal.aborted) {
        const frameIdx = sequence[nextIdx++];
        if (this.blobs[s][frameIdx]) continue;
        try {
          const res = await fetch(`/frames/${this.tier}/${this.ids[s]}/${pad(frameIdx)}.webp`, {
            signal: controller.signal,
          });
          if (res.ok) {
            this.blobs[s][frameIdx] = await res.blob();
            this.loaded++;
            if (onProgress) onProgress();
          }
        } catch {
          // aborted or network failure
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, worker));
    this.activeLoads.delete(s);
  }

  ensureScene(s: number, onProgress?: () => void) {
    if (s >= 0 && s < this.ids.length && !this.activeLoads.has(s) && this.sceneLoaded(s) < this.counts[s]) {
      this.loadScene(s, onProgress);
    }
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
    const blob = this.blobs[s]?.[i];
    if (!blob || this.cache.has(k) || this.pending.has(k)) return;
    this.pending.add(k);
    createImageBitmap(blob)
      .then((b) => this.put(k, b))
      .catch(() => {})
      .finally(() => this.pending.delete(k));
  }

  private nearestBlob(s: number, i: number) {
    const list = this.blobs[s];
    if (!list) return -1;
    const n = this.counts[s];
    for (let d = 0; d < n; d++) {
      if (i - d >= 0 && list[i - d]) return i - d;
      if (i + d < n && list[i + d]) return i + d;
    }
    return -1;
  }

  /**
   * Best available decoded frame now; schedules decoding of the exact frame plus directional lookahead.
   */
  get(s: number, idx: number, dir = 1): ImageBitmap | undefined {
    const n = this.counts[s];
    const targetIdx = Math.max(0, Math.min(n - 1, Math.round(idx)));
    const want = this.nearestBlob(s, targetIdx);
    if (want < 0) return undefined;

    this.decode(s, want);

    // Directional lookahead for smooth scrubbing
    if (this.pending.size < 6) {
      const lookaheadCount = this.tier === "desktop" ? 8 : 4;
      for (let k = 1; k <= lookaheadCount; k++) {
        const a = want + dir * k;
        const b = want - dir * Math.floor(k / 2);
        if (a >= 0 && a < n) this.decode(s, a);
        if (b >= 0 && b < n) this.decode(s, b);
      }
    }

    // Return the closest already-decoded bitmap
    for (let d = 0; d <= 16; d++) {
      for (const j of d === 0 ? [want] : [want - d, want + d]) {
        if (j >= 0 && j < n) {
          const k = this.key(s, j);
          const bmp = this.cache.get(k);
          if (bmp) {
            this.cache.delete(k);
            this.cache.set(k, bmp); // LRU refresh
            return bmp;
          }
        }
      }
    }
    return undefined;
  }

  dispose() {
    this.disposed = true;
    this.abortControllers.forEach((c) => c.abort());
    this.abortControllers.clear();
    this.cache.forEach((b) => b.close());
    this.cache.clear();
  }
}

export function buildStore(scenes: Scene[], tier: Tier) {
  const maxDecoded = tier === "desktop" ? 64 : 32;
  return new FrameStore(
    scenes.map((s) => s.id),
    scenes.map((s) => s.frames[tier]),
    tier,
    maxDecoded
  );
}

/** Draw bitmap to cover the canvas (object-fit: cover) with high-quality smoothing. */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  bmp: ImageBitmap,
  w: number,
  h: number,
  alpha = 1
) {
  const s = Math.max(w / bmp.width, h / bmp.height);
  const dw = bmp.width * s;
  const dh = bmp.height * s;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (alpha < 1) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(bmp, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
  } else {
    ctx.drawImage(bmp, dx, dy, dw, dh);
  }
}
