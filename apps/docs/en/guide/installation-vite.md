---
title: Installation (Vite)
description: Install and configure BrutxUI in a Vite + Vue 3 project
translated: true
---

# Installation (Vite)

Set up BrutxUI in a new or existing Vite + Vue 3 project.

## Prerequisites

- **Node.js** 22.0+ (for running `brutx-vue` CLI)
- **Vue** 3.5+
- **Tailwind CSS** 4.3+

Examples below use pnpm; you can also use npm, yarn, or bun.

## Choosing Your Adoption Model

Choose the installation approach that best aligns with your team's code ownership and maintenance goals:
- **Model A: npm Package Model (Out-of-the-Box)**: Install `brutx-ui-vue` and import styles. Dependency updates and semantic versions are managed cleanly via your package manager.
- **Model B: CLI Source Delivery Model (Full Ownership)**: Use `npx brutx-vue init` to scaffold components and design tokens directly into your project's codebase, ideal for deep customization without package lock-in.

---

## Model A: Quick Setup via npm

If you prefer adopting BrutxUI as a standard package:

### 1. Install the Package
```bash
pnpm add brutx-ui-vue
```

### 2. Import Components and Styles
<<< @/.vitepress/examples/installation-modes.ts#npm-installation{ts}

### 3. Import Styles in Entry File (`src/main.ts`)
```ts
import { createApp } from 'vue'
import App from './App.vue'
import 'brutx-ui-vue/style.css'

createApp(App).mount('#app')
```

### 4. Use Components in Vue SFCs
```vue
<script setup lang="ts">
import { Button } from 'brutx-ui-vue'
</script>

<template>
  <Button variant="primary">Hello BrutxUI</Button>
</template>
```

---

## Model B: CLI Source Delivery

If you want component source files directly in your repository:

### Step 1: Create a Vite Project & Configure Tailwind

If you do not have an existing project, create one first:

```bash
pnpm create vite my-app --template vue-ts
cd my-app
```

## Step 2: Install Tailwind CSS

Install Tailwind CSS 4.x and the Vite plugin:

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

Add the Tailwind CSS plugin and configure path aliases in `vite.config.ts`:

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

Add Tailwind import to `src/style.css`:

```css
@import 'tailwindcss';
```

## Step 3: Initialize BrutxUI

Run the init command to generate configuration and inject Neo-Brutalist design tokens:

```bash
npx brutx-vue@latest init
```

This command will:

- Automatically detect your project framework and Tailwind version;
- Install base dependencies (`reka-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@lucide/vue`);
- Generate the `cn()` utility function with Brutalist color extensions in `src/lib/utils.ts`;
- Create the `components.json` project configuration file;
- Inject `--brutal-*` CSS custom properties and `@theme` utilities into your stylesheet (with optional split to a dedicated `brutx-tokens.css`).

## Step 4: Add Components

Add only the components you need:

```bash
npx brutx-vue@latest add button
npx brutx-vue@latest add card dialog
npx brutx-vue@latest add input label checkbox
```

Or add all components at once:

```bash
npx brutx-vue@latest add --all
```

## Step 5: Use Components

Import installed components via local project paths:

<<< @/.vitepress/examples/installation-modes.ts#cli-installation{ts}

Or use them inside your Vue SFCs:

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/components/ui/card'
</script>

<template>
    <Card variant="default">
        <CardHeader>
            <CardTitle>Hello BrutxUI</CardTitle>
        </CardHeader>
        <CardContent>
            <Button variant="primary" size="default">
                Get Started
            </Button>
        </CardContent>
    </Card>
</template>
```

> [!TIP]
> You can also import directly from the component file:  
> `import Button from '@/components/ui/button/Button.vue'`

## Configure Language (Optional)

BrutxUI displays Chinese text by default. If you need to switch to English or other locales:

- **Option A (Package install)**: Install `pnpm add brutx-ui-vue` and configure `BrutxUIPlugin` in `main.ts`:
  ```ts
  import { createApp } from 'vue'
  import App from './App.vue'
  import { BrutxUIPlugin, en } from 'brutx-ui-vue'
  import './style.css'

  const app = createApp(App)
  app.use(BrutxUIPlugin, { locale: en })
  app.mount('#app')
  ```
- **Option B (Source mode injection)**: Inject the locale object at the root `App.vue` using `provideLocale`.

See the [Internationalization](/en/guide/locale) guide for more language configuration options.
