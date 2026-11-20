import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import CinematicStage from "./CinematicStage";
import { Certificates, Footer } from "./Extras";
import Header from "./Header";
import { setLenis } from "./scroll";
import "./styles.css";

function App() {
  // One smooth-scroll instance for the whole page, shared by both stages and the header navigation.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); setLenis(null); };
  }, []);

  return (
    <>
      <Header />
      <CinematicStage primary sceneIds={["intro", "about", "experience", "projects", "skills"]} />
      <main className="extras"><Certificates /></main>
      <CinematicStage sceneIds={["contact"]} />
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
