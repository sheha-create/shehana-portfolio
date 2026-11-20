import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scenes as allScenes } from "./content";
import { buildStore, drawCover, pickTier } from "./frameEngine";
import { firstStageLoaded, markFirstStageLoaded, registerAnchor } from "./scroll";

gsap.registerPlugin(ScrollTrigger);

const HOLD = 0.86; // fraction of a scene spent playing when another scene follows; the rest crossfades into it
const clamp = (v: number) => Math.min(1, Math.max(0, v));

type Props = { sceneIds: string[]; primary?: boolean };

/** Pinned cinematic stage that plays a run of consecutive scenes with on-demand preloading & idle throttling. */
export default function CinematicStage({ sceneIds, primary = false }: Props) {
  const list = allScenes.filter((s) => sceneIds.includes(s.id));
  const totalVh = list.reduce((a, s) => a + s.weight, 0);
  const cum = list.reduce<number[]>((acc, s) => [...acc, acc[acc.length - 1] + s.weight / totalVh], [0]);

  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[][]>(list.map(() => []));
  const [loadedPct, setLoadedPct] = useState(0);
  const [firstReady, setFirstReady] = useState(!primary);
  const reduced = useRef(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const tier = pickTier();
    const store = buildStore(list, tier);
    const counts = list.map((sc) => sc.frames[tier]);
    let cancelled = false;
    let inView = true;

    // Cache of previously applied DOM opacities to avoid continuous 60fps style thrashing
    const lastOpacities: number[][] = list.map((s) => new Array(s.items.length).fill(-1));

    const onProgress = () => {
      if (cancelled) return;
      if (primary) {
        // Calculate progress based on the initial scene to make the hero ready quickly
        const scene0Frames = counts[0];
        const loaded0 = store.sceneLoaded(0);
        const pct = Math.min(100, Math.round((loaded0 / scene0Frames) * 100));
        setLoadedPct(pct);
        if (loaded0 >= 24) setFirstReady(true);
      }
    };

    // Predictive loading: load scene 0 immediately. Adjacent scenes load on scroll approach.
    (async () => {
      if (!primary) await firstStageLoaded;
      if (cancelled) return;

      // Load initial scene
      await store.loadScene(0, onProgress);
      if (primary) {
        setFirstReady(true);
        markFirstStageLoaded();
      }

      // Preload next scene in background
      if (list.length > 1 && !cancelled) {
        store.ensureScene(1, onProgress);
      }
    })();

    const applySmoothing = () => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };

    let canvasWidth = 0;
    let canvasHeight = 0;
    let needsRedraw = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasWidth = Math.round(window.innerWidth * dpr);
      canvasHeight = Math.round(window.innerHeight * dpr);
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      applySmoothing();
      needsRedraw = true;
    };
    resize();
    window.addEventListener("resize", resize);

    // Track intersection with viewport to pause ticker when completely off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries.some((e) => e.isIntersecting);
        if (inView) needsRedraw = true;
      },
      { rootMargin: "300px 0px" }
    );
    if (trackRef.current) observer.observe(trackRef.current);

    // Header navigation targets: the scroll position where each scene starts
    const offs = list.map((sc, i) =>
      registerAnchor(sc.id, () => {
        const top = trackRef.current!.getBoundingClientRect().top + window.scrollY;
        const into = i === 0 && primary ? 0 : 0.16;
        // On target click, ensure target scene and next scene are queued for download
        store.ensureScene(i, onProgress);
        if (i + 1 < list.length) store.ensureScene(i + 1, onProgress);
        return Math.round(top + (cum[i] + into * (cum[i + 1] - cum[i])) * (trackRef.current!.offsetHeight - window.innerHeight) + 2);
      })
    );

    let target = 0; // scroll progress 0..1 over this stage's track
    let shown = 0;  // eased progress actually rendered
    let dir = 1;
    let lastRenderedProgress = -1;

    const st = ScrollTrigger.create({
      trigger: trackRef.current!,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        target = self.progress;
        needsRedraw = true;
      },
    });

    const n = list.length;
    const render = () => {
      if (!inView) return;

      const prev = shown;
      const diff = target - shown;
      const isMoving = Math.abs(diff) > 1e-5;

      if (isMoving) {
        shown += diff * (reduced.current ? 1 : 0.18);
        dir = shown > prev ? 1 : -1;
      } else if (shown !== target) {
        shown = target;
      }

      // Check if progress or frame state changed enough to justify redrawing canvas & updating DOM
      if (!isMoving && !needsRedraw && Math.abs(shown - lastRenderedProgress) < 1e-5) {
        return; // Idle sleep: saves hundreds of CPU/GPU cycles per second
      }

      needsRedraw = false;
      lastRenderedProgress = shown;

      const g = Math.min(shown, 0.99999);
      let i = 0;
      while (i < n - 1 && g >= cum[i + 1]) i++;

      // Trigger predictive background loading for current scene and the next upcoming scene
      store.ensureScene(i, onProgress);
      if (i + 1 < n) store.ensureScene(i + 1, onProgress);

      const p = (g - cum[i]) / (cum[i + 1] - cum[i]);
      const last = i === n - 1;
      const hold = last ? 1 : HOLD;
      const w = canvasWidth;
      const h = canvasHeight;

      const a = store.get(i, Math.min(p / hold, 1) * (counts[i] - 1), dir);
      if (a) drawCover(ctx, a, w, h);

      if (!last && p > HOLD) {
        const b = store.get(i + 1, 0, dir);
        if (b) drawCover(ctx, b, w, h, (p - HOLD) / (1 - HOLD));
      }

      // Text beats: only mutate DOM attributes when opacity changes significantly
      list.forEach((sc, k) => {
        const els = itemRefs.current[k];
        const m = els.length;
        const local = k < i ? 1 : k > i ? 0 : p;
        const first = k === 0 && primary;
        const a0 = first ? 0 : 0.08;
        const b0 = last && k === n - 1 ? 1 : HOLD - 0.02;
        const t = (local - a0) / (b0 - a0);

        els.forEach((el, j) => {
          if (!el) return;
          const c = (j + 0.5) / m;
          let d = Math.abs(t - c) * m;
          if (first && j === 0 && t < c) d = 0;
          if (k === n - 1 && j === m - 1 && t > c) d = 0;
          const o = k === i ? clamp((0.5 - d) / 0.12) : 0;

          const prevO = lastOpacities[k][j];
          if (Math.abs(o - prevO) > 0.005 || (prevO < 0.5 && o >= 0.5) || (prevO >= 0.5 && o < 0.5)) {
            lastOpacities[k][j] = o;
            el.style.opacity = String(o);
            el.toggleAttribute("inert", o < 0.5);
            el.setAttribute("aria-hidden", o > 0.05 ? "false" : "true");
          }
        });
      });
    };

    gsap.ticker.add(render);

    return () => {
      cancelled = true;
      gsap.ticker.remove(render);
      offs.forEach((off) => off());
      st.kill();
      observer.disconnect();
      window.removeEventListener("resize", resize);
      store.dispose();
    };
  }, []);

  return (
    <>
      {primary && (
        <div className={`loader ${firstReady ? "done" : ""}`} role="status" aria-live="polite">
          <span>{loadedPct}%</span>
        </div>
      )}
      <div ref={trackRef} className="track" style={{ height: `${totalVh}vh` }}>
        <div className="stage">
          <canvas ref={canvasRef} aria-hidden="true" />
          <div className="vignette" />
          {list.map((s, k) => (
            <section key={s.id} className={`copy ${s.align} ${s.id}`} aria-label={s.label}>
              <div className="items">
                {s.items.map((it, j) => (
                  <article key={j} className="item" ref={(el) => { itemRefs.current[k][j] = el; }}>
                    <h2 className={s.id === "intro" ? "hero" : undefined}>{it.heading}</h2>
                    {it.meta?.map((m, x) => <p key={x} className="meta">{m}</p>)}
                    {it.body?.map((b, x) => <p key={x} className="body">{b}</p>)}
                    {it.tags && <p className="body tags">{it.tags.join(", ")}</p>}
                    {it.links && (
                      <p className="links">
                        {it.links.map((l) => (
                          <a
                            key={l.href}
                            href={l.href}
                            className={l.href.endsWith(".pdf") ? "resume-btn" : undefined}
                            download={l.href.endsWith(".pdf") ? "Shehana-Safreen-Resume.pdf" : undefined}
                            target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                            rel="noopener noreferrer"
                          >
                            {l.label}
                          </a>
                        ))}
                      </p>
                    )}
                    {s.items.length > 1 && <p className="count">{j + 1} of {s.items.length}</p>}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
