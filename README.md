# M. Shehana Safreen: cinematic portfolio

Scroll-driven frame-sequence player (Vite + React + TypeScript + GSAP ScrollTrigger + Lenis).

- `npm install`, then `npm run dev` (or `npm run build` and `npm run preview`)
- All copy, projects, skills, achievements and certificates live in `src/content.ts`
- Certificate images: put files in `public/certificates/` and set `image` on the entry. Add `url` only when you have a real verification link.
- Résumé button: set `profile.resumeUrl` in `src/content.ts` to the real PDF path; the button stays hidden while it is empty.
- Frames: `npm run frames` re-extracts `public/frames/` from the original MP4s (read-only on the originals)
- Not connected to GitHub, not deployed.
