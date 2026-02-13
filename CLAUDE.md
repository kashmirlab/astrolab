# Astro Modern Template

<!--
  LAST_VERIFIED: 2026-02-13
-->

Template Astro 6.0 beta production-ready con Bun, Tailwind v4, OXC, Nanostores, deploy Cloudflare.

> **Runtime**: Bun 1.x (Astro 6 richiede Bun 1.x o Node 22+)

## Quick Start

```bash
bun install
bun run dev       # Dev server
bun run build     # Production build (check + build)
bun run preview   # Preview build locale
bun run deploy    # Deploy su Cloudflare
```

## Struttura

```
src/
├── components/
│   ├── ui/          # Atoms (Button, Input, Card)
│   ├── widgets/     # Sections (Hero, Features)
│   └── layout/      # Header, Footer
├── layouts/         # BaseLayout, BlogLayout
├── pages/           # Routes
├── lib/
│   ├── stores/      # Nanostores (theme, ui)
│   └── utils/       # Helper functions
├── content/         # Collections (blog)
└── styles/          # global.css (Tailwind v4 config)
```

## Path Aliases

`@/*` → `./src/*`, con shortcuts per `@components`, `@layouts`, `@lib`, `@assets`.

## Documentazione

| File                       | Contenuto                                                  |
| -------------------------- | ---------------------------------------------------------- |
| [SPEC.md](./SPEC.md)       | Architettura, tecnologie, pattern, configurazioni, deploy  |
| [QUALITY.md](./QUALITY.md) | Tooling DX, git hooks, CI/CD, quality gates, accessibilità |

## Comandi Principali

```bash
bun run check        # Type check (astro check)
bun run lint         # Oxlint
bun run lint:fix     # Oxlint --fix
bun run format       # Oxfmt
bun run knip         # Dead code detection
bun run deploy       # Cloudflare deploy
```
