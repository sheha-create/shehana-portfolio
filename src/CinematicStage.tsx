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

/** One pinned canvas stage that plays a run of consecutive scenes as the page scrolls. */
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

    // Frames load scene by scene in scroll order. The primary stage gates the loader on its first scene
    // and releases the secondary stage once it has finished.
    (async () => {
      if (!primary) await firstStageLoaded;
      for (let i = 0; i < list.length && !cancelled; i++) {
        await store.loadScene(i, () => {
          if (cancelled) return;
          if (primary) setLoadedPct(Math.round((store.loaded / store.total) * 100));
          if (primary && i === 0 && store.sceneLoaded(0) >= 40) setFirstReady(true);
        });
      }
      if (primary) markFirstStageLoaded();
    })();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Header navigation targets: the scroll position where each scene starts.
    const offs = list.map((sc, i) =>
      registerAnchor(sc.id, () => {
        const top = trackRef.current!.getBoundingClientRect().top + window.scrollY;
        // Land a little way into the scene (not at its first frame) so its first text beat is already visible.
        const into = i === 0 && primary ? 0 : 0.16;
        return Math.round(top + (cum[i] + into * (cum[i + 1] - cum[i])) * (trackRef.current!.offsetHeight - window.innerHeight) + 2);
      }));

    let target = 0; // scroll progress 0..1 over this stage's track
    let shown = 0;  // eased progress actually rendered
    let dir = 1;
    const st = ScrollTrigger.create({
      trigger: trackRef.current!, start: "top top", end: "bottom bottom",
      onUpdate: (self) => { target = self.progress; },
    });

    const n = list.length;
    const render = () => {
      const prev = shown;
      shown += (target - shown) * (reduced.current ? 1 : 0.14); // light inertia, works in both directions
      if (Math.abs(shown - prev) > 1e-6) dir = shown > prev ? 1 : -1;
      const g = Math.min(shown, 0.99999);
      let i = 0;
      while (i < n - 1 && g >= cum[i + 1]) i++;
      const p = (g - cum[i]) / (cum[i + 1] - cum[i]);
      const last = i === n - 1;
      const hold = last ? 1 : HOLD; // the last scene of a stage plays to its final frame; no crossfade follows
      const w = canvas.width, h = canvas.height;

      const a = store.get(i, Math.min(p / hold, 1) * (counts[i] - 1), dir);
      if (a) drawCover(ctx, a, w, h);
      if (!last && p > HOLD) {
        const b = store.get(i + 1, 0, dir);
        if (b) drawCover(ctx, b, w, h, (p - HOLD) / (1 - HOLD));
      }

      // Text beats: each scene's items share its playing window; neighbours cross-fade through each other.
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
          if (first && j === 0 && t < c) d = 0;                     // first beat is visible on arrival
          if (k === n - 1 && j === m - 1 && t > c) d = 0;           // last beat of the stage stays to the end
          const o = k === i ? clamp((0.5 - d) / 0.12) : 0;
          el.style.opacity = String(o);
          el.toggleAttribute("inert", o < 0.5);
          el.setAttribute("aria-hidden", o > 0.05 ? "false" : "true");
        });
      });
    };
    gsap.ticker.add(render);

    return () => {
      cancelled = true;
      gsap.ticker.remove(render);
      offs.forEach((off) => off());
      st.kill();
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
                          <a key={l.href} href={l.href} target={l.href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer">{l.label}</a>
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
