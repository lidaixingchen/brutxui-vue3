---
title: Manual Installation
description: Manually install and configure the BrutxUI component library
translated: true
---

# Manual Installation

Set up BrutxUI manually without the CLI, ideal for projects requiring complete control over installation steps, directory layouts, and dependency versions.

## Prerequisites

- **Node.js**: The version supported by your Vue/Tailwind toolchain; 22.0+ if running `brutx-vue` CLI later
- **Vue** 3.5+
- **Tailwind CSS** 4.3+

## Step 1: Install Dependencies

Install the core packages required by BrutxUI:

```bash
pnpm add reka-ui class-variance-authority clsx tailwind-merge @lucide/vue
```

| Package | Purpose |
| :--- | :--- |
| `reka-ui` | Accessible headless UI primitives (dialogs, menus, overlays) |
| `class-variance-authority` | CVA component variant styling engine |
| `clsx` | Conditional class joining |
| `tailwind-merge` | Merge Tailwind utility classes without conflicts |
| `@lucide/vue` | Official icon library |

### Optional Dependencies (Install on Demand)

If using specific advanced components, install their corresponding dependencies:

```bash
# Form validation (Form)
pnpm add vee-validate @vee-validate/zod zod

# Calendar components (Calendar, YearPicker)
pnpm add v-calendar

# Virtual scrolling and large tables (VirtualScroll, DataTable)
pnpm add @tanstack/vue-virtual

# Carousel slider (Carousel)
pnpm add embla-carousel-vue

# Syntax highlighted code blocks (CodeBlock)
pnpm add prismjs @types/prismjs
```

## Step 2: Create cn() Utility and Focus Constants

Create `src/lib/utils.ts`. Because BrutxUI features a dedicated Neo-Brutalist palette and Z-Index scale, you must extend `tailwind-merge` via `extendTailwindMerge` to ensure custom color classes (like `bg-brutal-primary` and `bg-red-500`) override each other correctly:

```ts
import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const BRUTAL_COLOR_NAMES = [
    'brutal-accent',
    'brutal-accent-foreground',
    'brutal-accent-subtle',
    'brutal-bg',
    'brutal-black',
    'brutal-destructive',
    'brutal-destructive-foreground',
    'brutal-destructive-subtle',
    'brutal-fg',
    'brutal-info',
    'brutal-info-foreground',
    'brutal-info-subtle',
    'brutal-muted',
    'brutal-muted-foreground',
    'brutal-overlay',
    'brutal-overlay-subtle',
    'brutal-placeholder',
    'brutal-primary',
    'brutal-primary-foreground',
    'brutal-primary-subtle',
    'brutal-ring',
    'brutal-secondary',
    'brutal-secondary-foreground',
    'brutal-secondary-subtle',
    'brutal-status-error',
    'brutal-status-error-foreground',
    'brutal-status-info',
    'brutal-status-info-foreground',
    'brutal-status-success',
    'brutal-status-success-foreground',
    'brutal-status-warning',
    'brutal-status-warning-foreground',
    'brutal-success',
    'brutal-success-foreground',
    'brutal-success-subtle',
    'brutal-yellow',
] as const

const BRUTAL_Z_INDEX_NAMES = [
    'dialog',
    'dropdown',
    'header',
    'loading',
    'modal',
    'notification',
    'popover',
    'sticky',
    'toast',
    'tooltip',
] as const

const customTwMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            'bg-color': [{ bg: [...BRUTAL_COLOR_NAMES] }],
            'text-color': [{ text: [...BRUTAL_COLOR_NAMES] }],
            'border-color': [{ border: [...BRUTAL_COLOR_NAMES] }],
            'ring-color': [{ ring: [...BRUTAL_COLOR_NAMES] }],
            z: [{ z: [...BRUTAL_Z_INDEX_NAMES] }],
        },
    },
})

export function cn(...inputs: ClassValue[]): string {
    return customTwMerge(clsx(inputs))
}

/**
 * Global Neo-Brutalist keyboard navigation focus ring
 */
export const FOCUS_RING_CLASSES =
    'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-brutal-ring focus-visible:ring-offset-0'
```

## Step 3: Configure Tailwind CSS 4

Install Tailwind CSS 4.x and the Vite plugin:

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

Register the plugin in `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
```

## Step 4: Inject Tailwind v4 @theme and Design Tokens

Tailwind CSS v4 replaces traditional JavaScript config files with pure CSS `@theme` directives. **Tokens must be registered via `@theme`** for the compiler to generate utilities such as `bg-brutal-primary` and `text-brutal-fg`.

Add the following to your main CSS file (e.g., `src/style.css`):

```css
@import 'tailwindcss';

@theme {
    /* Dynamic color mapping: runtime CSS variables support dark mode and presets */
    --color-brutal-bg: var(--brutal-bg, #ffffff);
    --color-brutal-fg: var(--brutal-fg, #000000);
    --color-brutal-primary: var(--brutal-primary, #FF6B6B);
    --color-brutal-primary-foreground: var(--brutal-primary-foreground, #000000);
    --color-brutal-secondary: var(--brutal-secondary, #4ECDC4);
    --color-brutal-secondary-foreground: var(--brutal-secondary-foreground, #000000);
    --color-brutal-accent: var(--brutal-accent, #FFE66D);
    --color-brutal-accent-foreground: var(--brutal-accent-foreground, #000000);
    --color-brutal-destructive: var(--brutal-destructive, #EF476F);
    --color-brutal-destructive-foreground: var(--brutal-destructive-foreground, #000000);
    --color-brutal-success: var(--brutal-success, #7FB069);
    --color-brutal-success-foreground: var(--brutal-success-foreground, #000000);
    --color-brutal-muted: var(--brutal-muted, #f3f4f6);
    --color-brutal-muted-foreground: var(--brutal-muted-foreground, #4B5563);
    --color-brutal-ring: var(--brutal-ring, #000000);
    --color-brutal-info: var(--brutal-info, #4A90D9);
    --color-brutal-info-foreground: var(--brutal-info-foreground, #000000);
    --color-brutal-overlay: var(--brutal-overlay, rgba(0, 0, 0, 0.5));
    --color-brutal-placeholder: var(--brutal-placeholder, #6e7788);

    /* Brutalist border width and radius */
    --border-width-3: var(--brutal-border-width, 3px);
    --radius-brutal: var(--brutal-radius, 0px);

    /* Brutalist solid shadows */
    --shadow-brutal: var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-shadow-color, #000000);
    --shadow-brutal-sm: calc(var(--brutal-shadow-offset-x, 4px) / 2) calc(var(--brutal-shadow-offset-y, 4px) / 2) 0px 0px var(--brutal-shadow-color, #000000);
    --shadow-brutal-lg: calc(var(--brutal-shadow-offset-x, 4px) * 1.5) calc(var(--brutal-shadow-offset-y, 4px) * 1.5) 0px 0px var(--brutal-shadow-color, #000000);
    --shadow-brutal-xl: calc(var(--brutal-shadow-offset-x, 4px) * 2) calc(var(--brutal-shadow-offset-y, 4px) * 2) 0px 0px var(--brutal-shadow-color, #000000);
    --shadow-brutal-primary: var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-primary, #FF6B6B);
    --shadow-brutal-secondary: var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-secondary, #4ECDC4);
}

@layer base {
    :root {
        --brutal-border-width: 3px;
        --brutal-border-color: #000000;
        --brutal-shadow-offset-x: 4px;
        --brutal-shadow-offset-y: 4px;
        --brutal-shadow-color: #000000;
        --brutal-radius: 0px;
        --brutal-bg: #ffffff;
        --brutal-fg: #000000;
        --brutal-primary: #FF6B6B;
        --brutal-primary-foreground: #000000;
        --brutal-secondary: #4ECDC4;
        --brutal-secondary-foreground: #000000;
        --brutal-accent: #FFE66D;
        --brutal-accent-foreground: #000000;
        --brutal-destructive: #EF476F;
        --brutal-destructive-foreground: #000000;
        --brutal-success: #7FB069;
        --brutal-success-foreground: #000000;
        --brutal-muted: #f3f4f6;
        --brutal-muted-foreground: #4B5563;
        --brutal-ring: #000000;
        --brutal-info: #4A90D9;
        --brutal-info-foreground: #000000;
        --brutal-overlay: rgba(0, 0, 0, 0.5);
        --brutal-placeholder: #6e7788;
    }

    .dark {
        --brutal-border-width: 3px;
        --brutal-border-color: #ffffff;
        --brutal-shadow-offset-x: 4px;
        --brutal-shadow-offset-y: 4px;
        --brutal-shadow-color: #ffffff;
        --brutal-radius: 0px;
        --brutal-bg: #141414;
        --brutal-fg: #ffffff;
        --brutal-primary: #FF6B6B;
        --brutal-primary-foreground: #000000;
        --brutal-secondary: #4ECDC4;
        --brutal-secondary-foreground: #000000;
        --brutal-accent: #FFE66D;
        --brutal-accent-foreground: #000000;
        --brutal-destructive: #EF476F;
        --brutal-destructive-foreground: #000000;
        --brutal-success: #7FB069;
        --brutal-success-foreground: #000000;
        --brutal-muted: #1e1e1e;
        --brutal-muted-foreground: #9CA3AF;
        --brutal-ring: #ffffff;
        --brutal-info: #3B82F6;
        --brutal-info-foreground: #ffffff;
        --brutal-overlay: rgba(0, 0, 0, 0.7);
        --brutal-placeholder: #767e8c;
    }
}

@layer utilities {
    .border-3 {
        border-width: var(--brutal-border-width, 3px);
    }

    .border-brutal {
        border-color: var(--brutal-border-color, #000000);
        border-style: solid;
    }

    .border-brutal-dashed {
        border-color: var(--brutal-border-color, #000000);
        border-style: dashed;
    }
}
```

## Step 5: Copy Component Files

Copy the required component folder (containing `[ComponentName].vue`, `[name]-variants.ts`, and `index.ts`) into your project under `src/components/ui/<component-name>/`.

Use them in your page:

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>

<template>
    <Button variant="primary">
        Hello BrutxUI
    </Button>
</template>
```
