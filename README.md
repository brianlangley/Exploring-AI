# LM Studio, Explained

Interactive, shareable explainer of LM Studio for the Inholland Exploring AI Tool Market (Bewijsstuk 3).

Unofficial student project. Not affiliated with, sponsored or endorsed by LM Studio or Element Labs. LM Studio and its logos are trademarks of their owner, used only to refer to the product.

## Read first

- `PLAN-v3.md`: the current plan (presentation route, 3D models, review decisions in section 9, status in section 10, design proposal in section 11). PLAN.md and PLAN-v2.md are background; PLAN-draft.md is an older copy of PLAN.md.

- `PLAN.md`: full plan, site map, Three.js scene, device check logic, verified models, brand rules, timeline, what is still needed
- `data/models.json`: verified model list (25 Nov 2026) that drives the device check and model picker

## Languages

Dutch by default, English via the switch in the header (the choice is remembered). All copy lives in `app/locales/nl.ts` and `app/locales/en.ts` (same shape, TypeScript checks it). Timeline text in `data/timeline.json`.

## Stack

Same as the KLM Hangar 14 site: Nuxt 4, Nuxt UI, Tailwind CSS, Three.js, TypeScript. Static site via `nuxt generate`. Node 24 (see `.node-version`).

## Run locally

```
npm install
npm run dev
```

Open `http://localhost:3000`. Before deploying:

```
npm run lint
npm run build
```

## Assets you add yourself

- `public/brand/`: official files from https://lmstudio.ai/brand (unchanged)
- `public/screens/`: your own screenshots of the real LM Studio app

## Deploy

Any static host. Build command `npm run build`, output directory `.output/public` (Cloudflare Pages, Netlify or GitHub Pages).
