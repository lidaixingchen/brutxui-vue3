---
title: FAQ
description: Frequently asked questions and answers about using BrutxUI.
translated: true
---

# FAQ

## Installation & Configuration

### Styles not working after installation?

Make sure you have imported the BrutxUI stylesheet in your project entry file:

```ts
// main.ts
import 'brutx-ui-vue/dist/style.css'
```

If installed via the CLI (`npx brutx-vue add`), styles are configured automatically.

### Conflicts with Tailwind CSS?

BrutxUI is built on top of Tailwind CSS. Ensure your project uses Tailwind version 4.3+. BrutxUI uses a CSS custom property (design token) system with `--brutal-*` prefixed variables to control styles, which does not interfere with Tailwind's configuration.

---

## Component Usage

### How to customize the theme?

Override CSS variables to customize the theme:

```css
:root {
  --brutal-primary: #ff6b6b;
  --brutal-secondary: #4ecdc4;
  --brutal-border-width: 3px;
  --brutal-shadow-offset-x: 4px;
  --brutal-shadow-offset-y: 4px;
}
```

See the [Theme Customization Guide](/en/guide/theme) for details.

### What theme presets are available?

BrutxUI includes four built-in theme presets:

| Preset | Description |
|------|------|
| Classic | Default theme with vibrant color contrast |
| Pastel | Soft pastel style |
| Mono | Black, white, and gray monochrome style |
| Warm | Warm-toned style |

Usage:

```vue
<template>
  <div class="theme-pastel">
    <Button>Pastel Style Button</Button>
  </div>
</template>
```

### Do components support internationalization?

Yes. Use the `useLocale` composable and `provideLocale` to switch languages:

```ts
import { provideLocale, enUS } from 'brutx-ui-vue'

// Provide the English language pack in the root component
provideLocale(enUS)
```

Get the current language in a component:

```ts
import { useLocale } from 'brutx-ui-vue'

const { locale, t } = useLocale()
// t('button.submit') to get localized text
```

---

## CLI Tools

### `npx brutx-vue add` throws an error?

Make sure you are running it in the project root directory and the project has been initialized (`components.json` exists). If not initialized, run:

```bash
npx brutx-vue init
```

If download fails due to network issues, try using a custom registry:

```bash
npx brutx-vue add button -r https://your-registry-url
```

### How do I check which components have updates available?

Run `npx brutx-vue@latest update --dry-run` to preview outdated components, or use `npx brutx-vue@latest diff` for detailed line-level diffs. Then run `npx brutx-vue@latest update` to apply updates.

### How do I remove an installed component?

Run `npx brutx-vue@latest remove <component>`. The CLI automatically detects orphaned files (composables / locales) no longer referenced by other components and prompts for cleanup. Use `--dry-run` to preview first.

### My project configuration seems broken. How do I diagnose it?

Run `npx brutx-vue@latest doctor` to check project health. It inspects 8 categories including config file, dependencies, CSS tokens, and utility functions. Add `--fix --yes` to auto-fix most common issues.

---

## Build & Deployment

### Bundle size too large?

BrutxUI supports tree-shaking with named imports. Make sure to use named imports instead of full imports:

```ts
// Named import (recommended)
import { Button, Card } from 'brutx-ui-vue'

// Full import (not recommended)
import * as BrutxUI from 'brutx-ui-vue'
```

### SSR rendering issues?

Some components depend on browser APIs (such as `window`, `document`). In SSR environments, wrap them with `<ClientOnly>`:

```vue
<template>
  <ClientOnly>
    <Carousel :autoplay="true">
      <CarouselItem>...</CarouselItem>
    </Carousel>
  </ClientOnly>
</template>
```

---

## Other Questions

### How to contribute?

Please read the [Contributing Guide](/en/guide/contributing).

### Where to report bugs?

Submit issues on [GitHub Issues](https://github.com/lidaixingchen/brutxui-vue3/issues). Please include:

1. Steps to reproduce
2. Expected behavior vs actual behavior
3. Environment information (Vue version, browser, operating system)
4. Minimal reproduction link (StackBlitz recommended)
