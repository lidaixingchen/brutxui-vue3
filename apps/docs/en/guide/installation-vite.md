---
title: Installation (Vite)
description: Install and configure BrutxUI in a Vite + Vue 3 project
translated: true
---

# Installation (Vite)

Set up BrutxUI in a new or existing Vite + Vue 3 project.

## Prerequisites

- **Node.js** 22.0+ (for running the `brutx-vue` CLI)
- **Vue** 3.5+
- **Tailwind CSS** 4.3+

The examples use pnpm, but npm, yarn, and bun are also supported. `brutx-vue init` detects the package manager from the lockfile, or you can pass `--package-manager` explicitly.

## Step 1: Create a Vite Project

If you don't have a project yet, create one first:

```bash
pnpm create vite my-app --template vue-ts
cd my-app
```

## Step 2: Install Tailwind CSS

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

Add the Tailwind import to `src/style.css`:

```css
@import 'tailwindcss';
```

## Step 3: Initialize BrutxUI

Run the init command to inject CSS custom properties and styles:

```bash
npx brutx-vue@latest init
```

This command will:

- Install required dependencies (`reka-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@lucide/vue`)
- Inject `--brutal-*` CSS custom properties into your stylesheet
- Create the `cn()` utility function
- Add BrutxUI styles (including Tailwind utility class layers) to your `style.css` (the existing `import './style.css'` in `main.ts` will automatically load these styles)

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

Import and use components in your Vue files:

```vue
<script setup>
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
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

## Configure Language (Optional)

BrutxUI displays Chinese text by default. To switch to English or another language, configure `BrutxUIPlugin` in `main.ts`:

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { BrutxUIPlugin, en } from 'brutx-ui-vue'
import './style.css'

const app = createApp(App)
app.use(BrutxUIPlugin, { locale: en })
app.mount('#app')
```

See the [Internationalization](/en/guide/locale) guide for more language configuration options.
