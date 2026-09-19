# Jitansh Arora — Portfolio

A single-page software engineering portfolio built with Next.js App Router, React, TypeScript, Tailwind CSS, and React Three Fiber. It features an interactive Three.js hero with an accessible SVG fallback, responsive section navigation, and statically rendered portfolio content.

## Stack

- **Framework:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **3D:** React Three Fiber, drei, and three.js, rendering a GLB model with a WebGL-capability probe, renderer-failure handling, and an accessible SVG fallback
- **Rendering:** statically prerendered at build time; no server-side data fetching or required environment variables

## Requirements

- Node.js 22.x (pinned in `.nvmrc`)
- npm 10, or a compatible version bundled with Node.js 22

## Getting started

```bash
nvm use
npm ci
npm run dev
```

Open `http://localhost:3000`. `npm ci` installs the exact dependency graph recorded in `package-lock.json`.

## Scripts

```bash
npm run dev        # start the development server
npm run typecheck  # validate TypeScript
npm run lint       # run ESLint
npm run build      # create an optimized production build
npm start          # serve a production build (run after npm run build)
```

## Security

`next.config.ts` sets baseline response security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`). A Content Security Policy is not yet configured.

## Project layout

- `app/` — the App Router page, global styles, metadata, robots, and sitemap routes
- `components/` — navigation, motion, and hero visualization components
- `data/portfolio.ts` — experience, project, research, and skills content
- `public/models/satellite_dish.glb` — the 3D model used in the hero

## Third-party assets and licensing

Third-party asset attribution and licensing are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md); the satellite-dish model attribution is also shown in the site footer. No license is granted for the original source code in this repository — third-party asset licenses do not extend a license to the portfolio source as a whole.
