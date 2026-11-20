import type Lenis from "lenis";

// Shared smooth-scroll instance and a registry of named scroll targets (for the header navigation).
let lenis: Lenis | null = null;
const anchors = new Map<string, () => number>();

export const setLenis = (l: Lenis | null) => { lenis = l; };
export const registerAnchor = (id: string, y: () => number) => { anchors.set(id, y); return () => { anchors.delete(id); }; };

export function scrollToAnchor(id: string) {
  const y = anchors.get(id)?.();
  if (y === undefined) return;
  if (lenis) lenis.scrollTo(y, { duration: 1.6 });
  else window.scrollTo({ top: y });
}

// Lets the second stage wait until the first stage's frames have finished loading.
let release!: () => void;
let released = false;
export const firstStageLoaded = new Promise<void>((r) => { release = r; });
export const markFirstStageLoaded = () => {
  if (!released && release) {
    released = true;
    release();
  }
};
