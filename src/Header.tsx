import { profile } from "./content";
import { scrollToAnchor } from "./scroll";

const nav = [
  ["intro", "Home"], ["about", "About"], ["experience", "Experience"], ["projects", "Projects"],
  ["skills", "Skills"], ["certificates", "Certificates"], ["contact", "Contact"],
] as const;

export default function Header() {
  return (
    <header className="bar">
      <a className="who" href="#top" onClick={(e) => { e.preventDefault(); scrollToAnchor("intro"); }}>{profile.name}</a>
      <nav aria-label="Sections">
        {nav.map(([id, label]) => (
          <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); scrollToAnchor(id); }}>{label}</a>
        ))}
      </nav>
    </header>
  );
}
