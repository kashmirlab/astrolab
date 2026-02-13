# Technical Specifications

<!--
  LAST_VERIFIED: 2026-02-13
-->

Architettura, decisioni tecniche e configurazioni del template.

**Astro**: 6.0.0-beta · **Bun**: 1.x · **Tailwind CSS**: 4.1.x · **Nanostores**: 0.11.x · **Zod**: 4.x

---

## Stack e Rationale

| Tecnologia               | Perché                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------- |
| **Astro 6 beta**         | Vite Environment API, workerd support, route caching, Content Layer API, CSP built-in |
| **Bun**                  | 3-4x più veloce di npm, TypeScript nativo                                             |
| **Tailwind v4**          | Config CSS-first (`@theme`), no PostCSS, 2x performance vs v3                         |
| **OXC (oxlint + oxfmt)** | 50-100x più veloce di ESLint, 30x di Prettier                                         |
| **Nanostores**           | 286 bytes, framework-agnostic, persistent, perfetto per Islands                       |

> **Requisiti**: Bun 1.x (o Node 22+), Zod 4 (non Zod 3)

### Integrazioni Astro

```json
{
  "@astrojs/cloudflare": "^12.0.0",
  "@astrojs/mdx": "^4.0.0",
  "@astrojs/sitemap": "^3.0.0",
  "astro-icon": "^1.0.0",
  "@nanostores/persistent": "^0.10.0"
}
```

---

## Architettura

### Design Patterns

- **Islands Architecture**: partial hydration, componenti interattivi solo dove serve
- **Atomic Design**: `ui/` (atoms) → `widgets/` (composite sections) → `layout/` (struttura pagina)
- **Framework-Agnostic State**: Nanostores condiviso tra qualsiasi framework UI
- **CSS-First Config**: Tailwind v4 configurato in CSS, non in JS

### Output Mode

```typescript
// astro.config.mjs
output: "hybrid"; // Static di default, opt-out per page con `export const prerender = false`
```

### Feature Abilitate

- **Responsive Images**: auto srcset/sizes (stabile in v6)
- **SVG Components**: import SVG come componenti Astro (stabile in v6)

---

## Tailwind v4 — Differenze Critiche da v3

- **NO `@astrojs/tailwind`** (deprecato) → usare `@tailwindcss/vite`
- Config in **CSS** via `@theme` e `@plugin`, non in `tailwind.config.js`
- Class sorting built-in (oxfmt ha `tailwindSort: true`)

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-brand-50: oklch(0.95 0.02 260);
  --color-brand-500: oklch(0.65 0.15 260);
  --color-brand-900: oklch(0.25 0.1 260);
  --breakpoint-3xl: 120rem;
}

@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/forms";
```

### Dark Mode

Class-based (`html.dark`). Lo script inline in `<head>` previene il flash:

```html
<script is:inline>
  const theme = localStorage.getItem("theme");
  if (
    theme === '"dark"' ||
    (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  }
</script>
```

---

## State Management — Nanostores

### Theme Store

```typescript
// src/lib/stores/theme.ts
export const THEME_MAP = {
  light: "light",
  dark: "dark",
  system: undefined,
} as const;
export type ThemeValue = (typeof THEME_MAP)[keyof typeof THEME_MAP];

export const $theme = persistentAtom<ThemeValue>("theme", THEME_MAP.system, {
  encode: JSON.stringify,
  decode: JSON.parse,
});
```

`initThemeStore()` applica il tema al DOM e ascolta `prefers-color-scheme` changes.

### UI Store

```typescript
// src/lib/stores/ui.ts
export const $isMobileMenuOpen = atom(false);
export const $modal = map<ModalState>({ isOpen: false, content: null });
```

Helper functions esportate: `toggleMobileMenu()`, `openModal(content)`.

### Regole

- 1 file per store in `lib/stores/`
- Helper functions esportate, non logica inline nei componenti
- `computed()` per valori derivati
- Non usare stores per state locale al componente

---

## Content Layer API

```typescript
// content/config.ts — Glob loader per file locali
const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
  }),
});
```

> **Zod 4**: Astro 6 usa Zod 4. Importare da `astro/zod` per avere la stessa versione. Attenzione: `.default()` ora applica al tipo output (non input), `z.string().email()` è deprecato → usare `z.email()`.

Supporta anche loader custom (API, CMS) — vedi [docs Astro Content Layer](https://docs.astro.build/en/guides/content-collections/).

---

## Cloudflare Deploy

### Adapter Config

```typescript
// astro.config.mjs
adapter: cloudflare({
  imageService: "cloudflare",
  platformProxy: { enabled: true },
});
```

### Wrangler

```json
{
  "name": "my-astro-site",
  "main": "./dist/worker.js",
  "compatibility_date": "2025-01-01",
  "assets": { "directory": "./dist/client" }
}
```

### Deploy

- **Auto**: push su `main` → Cloudflare Pages auto-deploy
- **Manuale**: `bun run build && bunx wrangler deploy`

### Env vars

- Locale: `.dev.vars`
- Produzione: Cloudflare Dashboard → Settings → Environment Variables

### Bindings (KV, D1)

Configurare in `wrangler.json`, accedere via `cloudflare:workers` (Astro 6 ha **rimosso** `Astro.locals.runtime.env`):

```typescript
// API route
import { env } from "cloudflare:workers";

export async function GET() {
  const data = await env.MY_KV.get("key");
  return new Response(data);
}
```

---

## Performance

### Strategie

- **Client Router**: `<ClientRouter />` (sostituisce il vecchio `<ViewTransitions />` rimosso in v6) per navigazione SPA-like
- **Islands**: `client:load` per interattivi, `client:visible` per lazy
- **Image Optimization**: `<Image>` di Astro + Cloudflare Image Resizing
- **Prerender**: `export const prerender = true` per pagine statiche
- **CSP**: `security: { csp: true }` in `astro.config.mjs` (stabile in v6, protegge da XSS)

### Altre feature stabili in v6

- **Live Content Collections**: fetch runtime invece di build-time per dati dinamici
- **astro:env**: env vars type-safe con validazione Zod

### Target

| Metrica              | Target  |
| -------------------- | ------- |
| FCP                  | < 1s    |
| TTI                  | < 2s    |
| TBT                  | < 200ms |
| CLS                  | < 0.1   |
| Lighthouse           | > 95    |
| Bundle totale (gzip) | ~30kb   |

---

## TypeScript

`extends: "astro/tsconfigs/strictest"` con `noUncheckedIndexedAccess` e `noImplicitOverride`.

Path aliases configurati in `tsconfig.json` (vedi CLAUDE.md).
