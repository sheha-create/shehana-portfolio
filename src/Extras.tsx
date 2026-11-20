import { useEffect, useRef, useState } from "react";
import { certCategories, certificates, FEATURED_COUNT, profile, type CertCategory, type Certificate } from "./content";
import { registerAnchor } from "./scroll";

function Card({ c }: { c: Certificate }) {
  return (
    <li className="cert">
      {c.image && <img src={c.image} alt={`${c.title} certificate`} loading="lazy" />}
      <p className="issuer">{c.issuer}</p>
      <h3>{c.title}</h3>
      {c.detail && <p className="detail">{c.detail}</p>}
      {c.date && <p className="date">{c.date}</p>}
      {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer">View credential</a>}
    </li>
  );
}

export function Certificates() {
  const ref = useRef<HTMLElement>(null);
  const [all, setAll] = useState(false);
  const [filter, setFilter] = useState<CertCategory | "all">("all");

  useEffect(() => registerAnchor("certificates", () => ref.current!.getBoundingClientRect().top + window.scrollY - 96), []);

  // Featured six by default; "View all" or any category filter works across the full set.
  const pool = all || filter !== "all" ? certificates : certificates.slice(0, FEATURED_COUNT);
  const shown = pool.filter((c) => filter === "all" || c.category === filter);

  return (
    <section ref={ref} className="block" aria-labelledby="certs">
      <h2 id="certs">Certificates</h2>
      <div className="filters" role="group" aria-label="Filter certificates">
        {(["all", ...certCategories] as const).map((f) => (
          <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>
      <ul className="cert-grid">{shown.map((c) => <Card key={c.title} c={c} />)}</ul>
      {filter === "all" && (
        <button className="more" aria-expanded={all} onClick={() => setAll((v) => !v)}>
          {all ? "Show featured only" : `View all ${certificates.length}`}
        </button>
      )}
    </section>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <p>{profile.name}</p>
      <p>
        <a href={`mailto:${profile.email}`}>Email</a>{" "}
        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>{" "}
        <a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
        {profile.resumeUrl && <> <a href={profile.resumeUrl} download>Download résumé</a></>}
      </p>
    </footer>
  );
}
