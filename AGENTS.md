# AGENTS.md — BrutxUI Vue 3

This file provides context and instructions for AI agents working on the BrutxUI Vue 3 codebase.

---

## Project Overview

BrutxUI Vue 3 is a Neo-Brutalist UI component library for **Vue 3** and **Tailwind CSS**. It is a Vue 3 port of the original React-based BrutxUI, distributed as a copy-paste-first component registry via a CLI tool.

The monorepo is managed with **pnpm workspaces** and contains the following packages:

| Package | Path | Description |
|---------|------|-------------|
| `brutx-ui-vue` | `packages/ui/` | Core Vue 3 component library |
| `brutx` (CLI) | `packages/cli/` | CLI tool for `init` and `add` commands |
| `brutx-registry` | `packages/registry/` | Compiled JSON component registry |
| `brutx-shared` | `packages/shared/` | Shared types and component metadata |
| `docs` | `apps/docs/` | Next.js 15 documentation site |

---

## Tech Stack

- **Framework:** Vue 3.5+ (Composition API with `<script setup>`)
- **Language:** TypeScript 5.7+ (strict mode)
- **Styling:** Tailwind CSS 3.4+ with CSS custom properties
- **Headless Primitives:** reka-ui 2.9+ (Vue equivalent of Radix UI)
- **Form Validation:** vee-validate 4.15+ with @vee-validate/zod and zod 3.25+
- **Icons:** lucide-vue-next 0.510+
- **Class Variants:** class-variance-authority (CVA) 0.7+
- **Class Merging:** clsx + tailwind-merge via `cn()` utility
- **Calendar:** v-calendar 3.1+
- **Build:** Vite 6+ with vite-plugin-dts for type declarations
- **Testing:** Vitest 3+ with @vue/test-utils and jsdom
- **Linting:** ESLint 10+ with eslint-plugin-vue and typescript-eslint
- **Package Manager:** pnpm 8.15+

---

## Monorepo Commands

```bash
pnpm install                        # Install all workspace dependencies
pnpm build                          # Build the UI package (brutx-ui-vue)
pnpm build:ui                       # Alias for building UI package
pnpm build:docs                     # Build the docs site
pnpm dev                            # Start docs dev server
pnpm lint                           # Lint all packages
pnpm typecheck                      # Type-check all packages
pnpm test                           # Run UI package tests
pnpm test:watch                     # Run tests in watch mode
pnpm test:coverage                  # Run tests with coverage
pnpm clean                          # Clean all dist directories
```

Package-specific commands:

```bash
pnpm --filter brutx-ui-vue build    # Build UI package
pnpm --filter brutx-ui-vue test     # Test UI package
pnpm --filter brutx-ui-vue lint     # Lint UI package
pnpm --filter brutx-ui-vue typecheck # Type-check UI package
pnpm --filter brutx build           # Build CLI package
pnpm --filter brutx-registry build  # Compile registry JSON
pnpm --filter brutx-registry validate # Validate registry schemas
```

---

## Directory Structure (packages/ui)

```
packages/ui/
├── src/
│   ├── components/          # Vue SFC components
│   │   ├── Button.vue       # Main button component
│   │   ├── Calendar.vue     # Calendar component
│   │   ├── SubmitButton.vue # Server-safe submit button
│   │   └── button-variants.ts # CVA variant definitions
│   ├── composables/         # Vue composables
│   │   └── useToast.ts      # Toast notification composable
│   ├── hooks/               # Re-exported hooks
│   │   └── index.ts
│   ├── lib/                 # Internal utilities
│   │   ├── utils.ts         # cn() merge utility
│   │   ├── utils.test.ts    # Utility tests
│   │   └── brutalism-plugin.js # Tailwind CSS plugin
│   ├── styles.css           # Global CSS with design tokens
│   ├── index.ts             # Main entry point (exports)
│   ├── calendar.ts          # Calendar sub-entry
│   ├── submit-button.ts     # SubmitButton sub-entry
│   └── env.d.ts             # Vite env type declarations
├── vite.config.ts           # Vite build configuration
├── vitest.config.ts         # Vitest test configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── eslint.config.js         # ESLint flat config
└── package.json
```

---

## Component Authoring Conventions

### Vue SFC Pattern

All components use `<script setup lang="ts">` with the Composition API:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'
import { componentVariants } from './component-variants'

type ComponentVariantProps = VariantProps<typeof componentVariants>

interface ComponentProps {
    variant?: NonNullable<ComponentVariantProps['variant']>
    size?: NonNullable<ComponentVariantProps['size']>
    class?: string
}

const props = withDefaults(defineProps<ComponentProps>(), {
    variant: 'default',
    size: 'default',
})

const classes = computed(() =>
    cn(componentVariants({ variant: props.variant, size: props.size }), props.class)
)
</script>

<template>
    <div :class="classes">
        <slot />
    </div>
</template>
```

### Variant Definitions

Variants are defined in separate `.ts` files using CVA, colocated with the component:

```ts
import { cva } from 'class-variance-authority'

export const componentVariants = cva(
    [
        'base-classes-here',
    ],
    {
        variants: {
            variant: { default: '...', primary: '...' },
            size: { sm: '...', default: '...', lg: '...' },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)
```

### Key Rules

1. **Always use `cn()`** from `../lib/utils` (or `@/lib/utils`) to merge classes — never concatenate class strings directly.
2. **Always use CVA** for variant definitions — never inline conditional classes in templates.
3. **Always use `reka-ui`** primitives for accessible headless behavior (Dialog, Popover, Tooltip, etc.) — this is the Vue equivalent of Radix UI.
4. **Always use `defineProps<T>()`** with TypeScript interface — do not use the runtime props declaration syntax.
5. **Always use `withDefaults()`** for prop defaults when using TypeScript interface syntax.
6. **Always use `computed()`** for dynamic class merging — never call `cn()` directly in the template.
7. **Always export new components** from `src/index.ts` — add both the component and its variants export.

---

## Neo-Brutalist Visual System

### Core Design Tokens (CSS Custom Properties)

All visual tokens are defined in `src/styles.css` under `:root` and `.dark`:

| Token | Default (Light) | Default (Dark) | Purpose |
|-------|-----------------|----------------|---------|
| `--brutal-border-width` | `3px` | `3px` | Border thickness |
| `--brutal-border-color` | `#000000` | `#ffffff` | Border color |
| `--brutal-shadow-offset-x` | `4px` | `4px` | Shadow X offset |
| `--brutal-shadow-offset-y` | `4px` | `4px` | Shadow Y offset |
| `--brutal-shadow-color` | `#000000` | `#ffffff` | Shadow color |
| `--brutal-radius` | `0px` | `0px` | Border radius |
| `--brutal-bg` | `#ffffff` | `#141414` | Background |
| `--brutal-fg` | `#000000` | `#ffffff` | Foreground |
| `--brutal-primary` | `#FF6B6B` | `#FF6B6B` | Primary accent (Coral) |
| `--brutal-secondary` | `#4ECDC4` | `#4ECDC4` | Secondary accent (Mint Teal) |
| `--brutal-accent` | `#FFE66D` | `#FFE66D` | Accent (Saturated Yellow) |
| `--brutal-destructive` | `#EF476F` | `#EF476F` | Destructive color |
| `--brutal-success` | `#7FB069` | `#7FB069` | Success color |
| `--brutal-muted` | `#f3f4f6` | `#1e1e1e` | Muted background |
| `--brutal-ring` | `#000000` | `#ffffff` | Focus ring color |
| `--brutal-pressed-offset` | `2px` | `2px` | Active press offset |

### Theme Presets

Three built-in presets override the CSS custom properties:

1. **`.theme-classic`** — Deep black shadows, neon accents, sharp corners (default)
2. **`.theme-pastel`** — Softer colors, lighter contrast, `8px` corners, `2px` borders
3. **`.theme-mono`** — Grayscale colors, heavier `4px` borders, `5px` shadow offset

### Tailwind Utility Classes

These are defined in `tailwind.config.js` and `brutalism-plugin.js`:

- **Borders:** `border-3`, `border-brutal`, `rounded-brutal`
- **Shadows:** `shadow-brutal` (4px), `shadow-brutal-sm` (2px), `shadow-brutal-lg` (6px), `shadow-brutal-xl` (8px)
- **Colors:** `bg-brutal-bg`, `text-brutal-fg`, `bg-brutal-primary`, `bg-brutal-secondary`, `bg-brutal-accent`, `bg-brutal-destructive`, `bg-brutal-success`, `bg-brutal-muted`, `ring-brutal-ring`
- **Plugin utilities:** `nb-border`, `nb-shadow`, `nb-press`, `nb-font`, `nb-hover`, `nb-active`, `nb-focus`, `nb-disabled`
- **Plugin components:** `nb-btn`, `nb-card`, `nb-input`

### Visual Rules

1. **Thick borders:** Always use `border-3 border-brutal` (or `border-brutal` which uses the CSS variable). Never use thin slate borders.
2. **Flat shadows:** Only hard offset shadows (`shadow-brutal*`). Never use blurred or spread shadows.
3. **Sharp corners:** Default to `rounded-brutal` (respects `--brutal-radius`). Never hardcode `rounded-md` or similar.
4. **Press feedback:** Buttons translate down on active: `active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all`.
5. **Hover feedback:** Elements lift on hover: `hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5`.
6. **High-contrast accents:** Use the brutalism color palette via CSS variables — never hardcode arbitrary colors.

---

## Import Conventions

- **Path alias:** `@/` maps to `src/` (configured in both `tsconfig.json` and `vite.config.ts`)
- **Internal imports** within `packages/ui/src/` use relative paths (e.g., `../lib/utils`)
- **reka-ui imports:** Import from `reka-ui` directly (e.g., `import { Primitive } from 'reka-ui'`)
- **Icon imports:** Import from `lucide-vue-next` (e.g., `import { Loader2 } from 'lucide-vue-next'`)

---

## Testing Conventions

- **Framework:** Vitest with jsdom environment and `@vue/test-utils`
- **Test file location:** Colocated with source (e.g., `src/lib/utils.test.ts`)
- **Test pattern:** `src/**/*.{test,spec}.{ts,tsx}`
- **Globals:** Vitest globals are enabled (`globals: true` in vitest.config.ts)
- **Mount pattern:**

```ts
import { mount } from '@vue/test-utils'
import Component from './Component.vue'

describe('Component', () => {
    it('renders', () => {
        const wrapper = mount(Component, {
            props: { variant: 'default' },
        })
        expect(wrapper.find('button').exists()).toBe(true)
    })
})
```

---

## Build & Exports

The UI package uses Vite library mode with multiple entry points:

| Entry | Export Path | Contents |
|-------|-------------|----------|
| `index` | `brutx-ui-vue` | Main components and utilities |
| `calendar` | `brutx-ui-vue/calendar` | Calendar component + v-calendar |
| `submit-button` | `brutx-ui-vue/submit-button` | SubmitButton component |
| `hooks` | `brutx-ui-vue/hooks` | Composables/hooks |
| `brutalism-plugin` | `brutx-ui-vue/brutalism-plugin` | Tailwind CSS plugin |
| `styles.css` | `brutx-ui-vue/styles.css` | Global CSS with design tokens |

Externalized dependencies (not bundled): `vue`, `tailwindcss`, `reka-ui`, `@vueuse/*`, `v-calendar`, `vee-validate`, `@vee-validate/*`

Output formats: ESM (`.mjs`) and CJS (`.cjs`) with type declarations (`.d.ts`)

---

## ESLint Rules

- `vue/multi-word-component-names`: **off** — single-word component names are allowed
- `vue/max-attributes-per-line`: **off**
- `vue/html-indent`: **off**
- `@typescript-eslint/no-unused-vars`: **warn** (args prefixed with `_` are ignored)
- `@typescript-eslint/no-explicit-any`: **warn**

---

## Security Requirements

1. **Path safety in CLI:** When working on `packages/cli/`, always normalize paths and validate with `isSafePath` to prevent directory traversal.
2. **No duplicate CSS tokens:** When updating `styles.css`, ensure CSS custom properties are not duplicated.
3. **No hardcoded secrets:** Never expose or log secrets, API keys, or tokens.

---

## Current Component Status

The Vue 3 port is in progress. Currently implemented:

| Component | File | Status |
|-----------|------|--------|
| Button | `src/components/Button.vue` | Implemented with full CVA variants |
| Calendar | `src/components/Calendar.vue` | Placeholder (Phase 3) |
| SubmitButton | `src/components/SubmitButton.vue` | Implemented |
| useToast | `src/composables/useToast.ts` | Implemented |

Components from the original React version that need Vue 3 ports:

Alert, AlertDialog, Avatar, Badge, Card, Checkbox, Combobox, Command, DashboardStats, Dialog, DropdownMenu, EmptyState, Form, Input, Label, Pagination, Popover, Progress, RadioGroup, ScrollArea, Select, Separator, Sheet, Skeleton, Slider, Spinner, Switch, Table, Tabs, Textarea, Toast, Toggle, ToggleGroup, Tooltip, SaaSPricing, BrutalistHero, PricingSection, AuthCard, DashboardShell, WaitlistPage

---

## Code Style

- **No comments** in code unless explicitly requested
- **No magic numbers** — use CSS custom properties or named constants
- **No hardcoded values** — reference design tokens via CSS variables
- **4-space indentation** in TypeScript and Vue SFC
- **Single quotes** for strings in TypeScript
- **PascalCase** for component file names (e.g., `Button.vue`, `SubmitButton.vue`)
- **kebab-case** for variant file names (e.g., `button-variants.ts`)
- **camelCase** for composable file names (e.g., `useToast.ts`)
