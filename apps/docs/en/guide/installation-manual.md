---
title: Manual Installation
description: Manually install and configure the BrutxUI component library
translated: true
---

# Manual Installation

Set up BrutxUI manually without using the CLI, suitable for projects that need full control over the installation process.

## Prerequisites

- **Node.js**: Use the version supported by your Vue/Tailwind toolchain; if you later run the `brutx-vue` CLI, use 22.0+
- **Vue** 3.5+
- **Tailwind CSS** 4.3+

## Step 1: Install Dependencies

Install the required packages:

```bash
pnpm add reka-ui class-variance-authority clsx tailwind-merge @lucide/vue
```

| Package                    | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| `reka-ui`                  | Accessible headless primitives             |
| `class-variance-authority` | CVA variant system                         |
| `clsx`                     | Conditional class names                    |
| `tailwind-merge`           | Merge Tailwind classes to avoid conflicts  |
| `@lucide/vue`              | Icon library                               |

Optional dependencies:

```bash
pnpm add v-calendar vee-validate @vee-validate/zod zod
```

| Package             | Purpose                                |
| ------------------- | -------------------------------------- |
| `v-calendar`        | Calendar component                     |
| `vee-validate`      | Form validation                        |
| `@vee-validate/zod` | Zod schema adapter (Form component)    |
| `zod`               | Schema validation (Form component)     |

## Step 2: Create the cn() Utility Function

Create `src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
```

## Step 3: Configure Tailwind CSS

Install Tailwind CSS 4.x and the Vite plugin:

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

Add the Tailwind CSS plugin to `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
    ],
})
```

## Step 4: Import Styles

Add BrutxUI CSS custom properties to your main CSS file (e.g. `src/style.css`):

```css
@import 'tailwindcss';

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
        --brutal-secondary: #4ECDC4;
        --brutal-accent: #FFE66D;
        --brutal-destructive: #EF476F;
        --brutal-success: #7FB069;
        --brutal-muted: #f3f4f6;
        --brutal-muted-foreground: #4B5563;
        --brutal-ring: #000000;
        --brutal-pressed-offset: 2px;
        --brutal-info: #4A90D9;
        --brutal-overlay: rgba(0, 0, 0, 0.5);
        --brutal-placeholder: #9CA3AF;
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
        --brutal-secondary: #4ECDC4;
        --brutal-accent: #FFE66D;
        --brutal-destructive: #EF476F;
        --brutal-success: #7FB069;
        --brutal-muted: #1e1e1e;
        --brutal-muted-foreground: #9CA3AF;
        --brutal-ring: #ffffff;
        --brutal-pressed-offset: 2px;
        --brutal-info: #3B82F6;
        --brutal-overlay: rgba(0, 0, 0, 0.7);
        --brutal-placeholder: #6B7280;
    }
}

@layer utilities {
    .border-3 {
        border-width: var(--brutal-border-width, 3px);
    }

    .border-brutal {
        border-color: var(--brutal-border-color, #000000);
    }

    .shadow-brutal {
        box-shadow: var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-shadow-color, #000000);
    }

    .shadow-brutal-sm {
        box-shadow: calc(var(--brutal-shadow-offset-x, 4px) / 2) calc(var(--brutal-shadow-offset-y, 4px) / 2) 0px 0px var(--brutal-shadow-color, #000000);
    }

    .shadow-brutal-lg {
        box-shadow: calc(var(--brutal-shadow-offset-x, 4px) * 1.5) calc(var(--brutal-shadow-offset-y, 4px) * 1.5) 0px 0px var(--brutal-shadow-color, #000000);
    }

    .shadow-brutal-xl {
        box-shadow: calc(var(--brutal-shadow-offset-x, 4px) * 2) calc(var(--brutal-shadow-offset-y, 4px) * 2) 0px 0px var(--brutal-shadow-color, #000000);
    }

    .shadow-brutal-primary {
        box-shadow: var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-primary);
    }

    .shadow-brutal-secondary {
        box-shadow: var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-secondary);
    }
}
```

## Step 5: Copy Component Files

Copy the component files you need from `packages/ui/src/components/` to your project's `src/components/ui/` directory. Each component consists of:

- A `.vue` file (e.g. `Button.vue`)
- A corresponding variants file (e.g. `button-variants.ts`), if applicable

Make sure to update the import paths in the copied files to match your project structure. Components use relative imports (e.g. `../lib/utils`), so adjust them as needed.
