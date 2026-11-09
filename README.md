
<h1 align="center">Solvd</h1>

<p align="center">
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-7.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 7.0"></a>
  <a href="https://vite.dev"><img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8"></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4"></a>
  <a href="https://js.cubing.net/cubing/"><img src="https://img.shields.io/badge/cubing.js-0.66-FF6B00?style=flat-square" alt="cubing.js 0.66"></a>
  <a href="https://dexie.org"><img src="https://img.shields.io/badge/Dexie-4-3A6EA5?style=flat-square" alt="Dexie 4"></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-12-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm 12"></a>
</p>

<p align="center">
  <strong>A speedcubing timer with persistent storage.</strong>
</p>

I recently got back into cubing and wanted a timer that keeps my times in persistent storage, so I can switch devices without exporting and importing every time.

## Versions

- **Static** (in progress): runs fully in the browser and saves solves to IndexedDB.
- **Self-hosted** (planned): adds a backend and database so times sync across devices.

## Getting started

```bash
cd frontend
pnpm install
pnpm dev
```

## Deploying to Vercel

The site is a static Vite build, so it deploys to Vercel as-is.

1. Import the repo in Vercel and set the **Root Directory** to `frontend`. The framework is detected as Vite, and `frontend/vercel.json` sets the install and build commands, the output folder (`dist`), security headers and long-lived caching for the hashed assets.
2. Add the domain `solvd.spencerkelly.ca` under the project's Domains settings, then add the DNS record Vercel shows for it (for a subdomain this is a CNAME to `cname.vercel-dns.com`).
3. Every push to `main` deploys to production, and every PR gets a preview URL.

Node 20.19+ or 22.12+ is required (set in `engines`). pnpm comes from the `packageManager` field.

The canonical URL, Open Graph tags, `robots.txt` and `sitemap.xml` all point at `https://solvd.spencerkelly.ca`. If the domain changes, update `frontend/index.html` and the two files in `frontend/public/`.

## Credits

Scrambles come from [cubing.js](https://github.com/cubing/cubing.js) by Lucas Garron and the cubing.js contributors. Thanks for making it open source.
