# AGENTS.md — BrutxUI Vue 3

Neo-Brutalist UI component library for Vue 3 + Tailwind CSS. Vue 3 port of the original React BrutxUI.

## Monorepo

| Package | Path | Description |
|---------|------|-------------|
| `brutx-ui-vue` | `packages/ui/` | Core Vue 3 component library |
| `brutx` | `packages/cli/` | CLI for `init` and `add` |
| `brutx-registry` | `packages/registry/` | Compiled JSON registry |
| `brutx-shared` | `packages/shared/` | Shared types and metadata |
| `docs` | `apps/docs/` | Next.js 15 docs site |

## Commands

```bash
pnpm build          # Build UI package
pnpm lint           # Lint all packages
pnpm typecheck      # Type-check all packages
pnpm test           # Run UI tests
pnpm test:watch     # Tests in watch mode
```

## Tech Stack

Vue 3.5+ (`<script setup>`) · TypeScript 5.7+ (strict) · Tailwind CSS 3.4+ · reka-ui 2.9+ (headless primitives) · CVA 0.7+ (variants) · clsx + tailwind-merge via `cn()` · Vite 6+ · Vitest 3+ · pnpm 8.15+

## Component Conventions

- `<script setup lang="ts">` with `defineProps<T>()` + `withDefaults()`
- Variants in separate `*-variants.ts` files using CVA, colocated with component
- Always merge classes via `cn()` — never concatenate strings
- Always use `computed()` for dynamic class merging — never call `cn()` in template
- Always use `reka-ui` for accessible headless primitives
- Always export new components from `src/index.ts`

## Neo-Brutalist Visual System

### Design Tokens (`src/styles.css` → `:root` / `.dark`)

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--brutal-border-width` | `3px` | `3px` | Border thickness |
| `--brutal-border-color` | `#000000` | `#ffffff` | Border color |
| `--brutal-shadow-offset-x` | `4px` | `4px` | Shadow X offset |
| `--brutal-shadow-offset-y` | `4px` | `4px` | Shadow Y offset |
| `--brutal-shadow-color` | `#000000` | `#ffffff` | Shadow color |
| `--brutal-radius` | `0px` | `0px` | Border radius |
| `--brutal-bg` | `#ffffff` | `#141414` | Background |
| `--brutal-fg` | `#000000` | `#ffffff` | Foreground |
| `--brutal-primary` | `#FF6B6B` | `#FF6B6B` | Primary (Coral) |
| `--brutal-secondary` | `#4ECDC4` | `#4ECDC4` | Secondary (Mint Teal) |
| `--brutal-accent` | `#FFE66D` | `#FFE66D` | Accent (Yellow) |
| `--brutal-destructive` | `#EF476F` | `#EF476F` | Destructive |
| `--brutal-success` | `#7FB069` | `#7FB069` | Success |
| `--brutal-muted` | `#f3f4f6` | `#1e1e1e` | Muted background |
| `--brutal-ring` | `#000000` | `#ffffff` | Focus ring |
| `--brutal-pressed-offset` | `2px` | `2px` | Active press offset |

### Visual Rules

1. **Borders:** `border-3 border-brutal` — never thin borders
2. **Shadows:** `shadow-brutal*` only — never blurred/spread shadows
3. **Corners:** `rounded-brutal` — never hardcode `rounded-md` etc.
4. **Press:** `active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all`
5. **Hover:** `hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5`
6. **Colors:** Use `--brutal-*` CSS variables — never hardcode arbitrary colors

### Tailwind Utilities

- Borders: `border-3`, `border-brutal`, `rounded-brutal`
- Shadows: `shadow-brutal`, `shadow-brutal-sm`, `shadow-brutal-lg`, `shadow-brutal-xl`
- Colors: `bg-brutal-bg`, `text-brutal-fg`, `bg-brutal-primary`, `bg-brutal-secondary`, `bg-brutal-accent`, `bg-brutal-destructive`, `bg-brutal-success`, `bg-brutal-muted`

### Theme Presets

`.theme-classic` (default) · `.theme-pastel` (softer, 8px radius) · `.theme-mono` (grayscale, 4px borders)

## Imports

- `@/` → `src/`
- Internal: relative paths (`../lib/utils`)
- Headless: `import { Primitive } from 'reka-ui'`
- Icons: `import { Loader2 } from 'lucide-vue-next'`

## Code Style

- No comments unless requested · No magic numbers · No hardcoded values
- 4-space indent · Single quotes · PascalCase components (`Button.vue`) · kebab-case variants (`button-variants.ts`) · camelCase composables (`useToast.ts`)

## Security

- CLI: normalize paths, validate with `isSafePath`
- CSS: no duplicate tokens in `styles.css`
- No hardcoded secrets
