# Tools & Quality

<!--
  LAST_VERIFIED: 2026-02-13T16:00
-->

Tooling per DX, code quality e CI/CD.

---

## Overview

| Tool                          | Cosa fa                                                 | Quando              |
| ----------------------------- | ------------------------------------------------------- | ------------------- |
| **Lefthook** `2.1.x`          | Git hooks (pre-commit, commit-msg, pre-push)            | Team projects       |
| **Commitlint** `20.x`         | Conventional commits enforcement                        | Team projects       |
| **Oxlint** `1.47.x`           | Linting (50-100x ESLint), jsx-a11y, type-aware via tsgo | Sempre              |
| **Oxfmt** `0.1.x` (alpha)     | Formatting (30x Prettier), Tailwind sort                | Sempre              |
| **Knip** `5.83.x`             | Dead code, unused deps/exports                          | Production          |
| **Lighthouse CI** `0.15.x`    | Performance budgets, Core Web Vitals                    | Production          |
| **Renovate**                  | Auto-update dependencies                                | Maintained projects |
| **sort-package-json** `3.6.x` | Ordina package.json                                     | Sempre              |

---

## Git Hooks — Lefthook

Scelto su Husky: parallelo di default, config YAML, zero deps Node, file filtering built-in.

> **Lefthook v2**: usa `jobs` (array) al posto del vecchio `commands` (map).

### lefthook.yml

```yaml
pre-commit:
  parallel: true
  jobs:
    - name: astro-check
      glob: "*.astro"
      run: bunx astro check --minimumSeverity warning {staged_files}
    - name: oxlint
      glob: "*.{js,jsx,ts,tsx,astro}"
      run: bunx oxlint --fix {staged_files}
    - name: oxfmt
      glob: "*.{js,jsx,ts,tsx,astro,json,md,mdx,css}"
      run: bunx oxfmt {staged_files}
    - name: sort-package
      glob: "package.json"
      run: bunx sort-package-json {staged_files}

commit-msg:
  jobs:
    - name: commitlint
      run: bunx commitlint --edit {1}

pre-push:
  jobs:
    - name: knip
      run: bunx knip --production
```

---

## Conventional Commits — Commitlint

### commitlint.config.mjs

```javascript
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore"],
    ],
    "scope-enum": [1, "always", ["ui", "widgets", "content", "config", "deps"]],
    "subject-case": [2, "never", ["upper-case"]],
    "header-max-length": [2, "always", 72],
  },
};
```

Esempi: `feat(ui): add dark mode toggle`, `fix(widgets): mobile menu close on nav`, `chore(deps): update astro to 6.0.0-beta.1`

---

## Dead Code — Knip

### knip.json

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": ["src/pages/**/*.astro", "src/content/config.ts", "astro.config.mjs"],
  "project": ["src/**/*.{ts,tsx,astro,js,jsx}"],
  "ignore": ["**/*.test.ts", "**/*.spec.ts", "tests/**"],
  "ignoreDependencies": ["@astrojs/check", "typescript"],
  "astro": {
    "entry": ["astro.config.mjs", "src/pages/**/*.astro", "src/layouts/**/*.astro"]
  }
}
```

```bash
bunx knip                # Full check
bunx knip --dependencies # Solo deps inutilizzate
bunx knip --fix          # Auto-remove da package.json
bunx knip --production   # Ignora test files
```

---

## Dependency Updates — Renovate

### renovate.json

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "schedule": ["every weekend"],
  "labels": ["dependencies"],
  "packageRules": [
    {
      "description": "Auto-merge patch/minor",
      "matchUpdateTypes": ["patch", "minor", "digest"],
      "automerge": true,
      "minimumReleaseAge": "3 days"
    },
    {
      "description": "Manual review major",
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "minimumReleaseAge": "7 days"
    },
    { "matchPackageNames": ["@astrojs/**"], "groupName": "Astro" },
    {
      "matchPackageNames": ["tailwindcss", "@tailwindcss/**"],
      "groupName": "Tailwind CSS"
    },
    {
      "matchPackageNames": ["nanostores", "@nanostores/**"],
      "groupName": "Nanostores"
    },
    {
      "matchPackageNames": ["oxlint", "oxfmt", "lefthook"],
      "groupName": "Dev tools"
    }
  ],
  "lockFileMaintenance": {
    "enabled": true,
    "schedule": ["before 3am on monday"]
  }
}
```

Setup: installare [Renovate GitHub App](https://github.com/apps/renovate).

> **Tip**: quando Renovate apre una PR con bump di versione, aggiornare anche la versione inline nella tabella Overview e `LAST_VERIFIED`.

---

## Performance — Lighthouse CI

### lighthouserc.json

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "bunx astro preview",
      "url": ["http://localhost:4321/"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

### budget.json

```json
[
  {
    "path": "/*",
    "resourceSizes": [
      { "resourceType": "document", "budget": 18 },
      { "resourceType": "script", "budget": 150 },
      { "resourceType": "stylesheet", "budget": 50 },
      { "resourceType": "image", "budget": 300 },
      { "resourceType": "total", "budget": 500 }
    ],
    "resourceCounts": [{ "resourceType": "third-party", "budget": 5 }]
  }
]
```

---

## Accessibility — jsx-a11y via Oxlint

Oxlint supporta `jsx-a11y` nativamente. Da v1.0 supporta anche **type-aware linting** via tsgo (TypeScript 7 nativo in Go). Config in `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["eslint", "typescript", "unicorn", "oxc", "jsx-a11y"],
  "categories": {
    "correctness": "error"
  },
  "rules": {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/anchor-has-content": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-role": "error",
    "jsx-a11y/click-events-have-key-events": "warn",
    "jsx-a11y/heading-has-content": "error",
    "jsx-a11y/html-has-lang": "error",
    "jsx-a11y/label-has-associated-control": "error",
    "jsx-a11y/tabindex-no-positive": "error"
  }
}
```

> **Attenzione**: `plugins` sovrascrive i default. Includere sempre `eslint`, `typescript`, `unicorn`, `oxc` oltre a `jsx-a11y`.

### Checklist Manuale

- Keyboard: tab through tutti gli elementi interattivi, Escape chiude modali
- Screen reader: testare con VoiceOver (macOS) / NVDA (Windows)
- Visual: zoom 400%, contrasto colori, focus indicators visibili, reduced motion

Target: **WCAG 2.1 Level AA**.

---

## VSCode

### .vscode/extensions.json

```json
{
  "recommendations": [
    "astro-build.astro-vscode",
    "bradlc.vscode-tailwindcss",
    "oxc.oxc-vscode",
    "yoavbls.pretty-ts-errors",
    "usernamehw.errorlens"
  ],
  "unwantedRecommendations": ["esbenp.prettier-vscode", "dbaeumer.vscode-eslint"]
}
```

### .vscode/settings.json (punti critici)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "tailwindCSS.experimental.configFile": "src/styles/global.css",
  "css.validate": false,
  "[astro]": { "editor.defaultFormatter": "oxc.oxc-vscode" }
}
```

`tailwindCSS.experimental.configFile` deve puntare al **file CSS** (non .js) — necessario per Tailwind v4.
`css.validate: false` — necessario per le at-rules custom (`@theme`, `@plugin`).

---

## CI/CD — GitHub Actions

### .github/workflows/quality.yml

```yaml
name: Quality Checks

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run check
      - run: bunx oxlint
      - run: bunx oxfmt --check
      - run: bunx knip --production

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run build
      - uses: treosh/lighthouse-ci-action@v12
        with:
          configPath: "./lighthouserc.json"
          budgetPath: "./budget.json"
          uploadArtifacts: true
          temporaryPublicStorage: true
```

---

## Dependencies

```json
{
  "devDependencies": {
    "lefthook": "^2.1.0",
    "@commitlint/cli": "^20.0.0",
    "@commitlint/config-conventional": "^20.0.0",
    "@lhci/cli": "^0.15.0",
    "knip": "^5.83.0",
    "sort-package-json": "^3.6.0"
  }
}
```

---

## Setup Checklist

### Fase 1 — DX Base

```bash
bun add -D lefthook @commitlint/cli @commitlint/config-conventional sort-package-json
bunx lefthook install
```

Creare: `lefthook.yml` (v2 con `jobs`), `commitlint.config.mjs`, `.vscode/extensions.json`, `.vscode/settings.json`.

### Fase 2 — Code Quality

```bash
bun add -D knip
```

Creare `knip.json`, run `bunx knip`. Opzionale: setup Renovate app + `renovate.json`.

### Fase 3 — Production Quality

```bash
bun add -D @lhci/cli
```

Creare `lighthouserc.json`, `budget.json`. Verificare jsx-a11y rules in `.oxlintrc.json`.

### Fase 4 — CI/CD

Creare `.github/workflows/quality.yml`, push, verificare che i check passino.
