---
title: Theme & Tokens
description: Learn about BrutxUI's CSS variable tokens and theme preset system
translated: true
---

# Theme & Tokens

BrutxUI uses CSS custom properties (design tokens) to control every visual aspect of the neobrutalist system. This makes customization as simple as overriding a single variable.

If you'd like to visually tweak values first and then copy the complete CSS variables, use the [Theme Playground](/en/guide/theme-playground). It displays a product preview, component matrix, contrast checks, and token coverage.

## CSS Variables

All tokens are prefixed with `--brutal-` and defined at the `:root` level:

| Token | Light Mode | Dark Mode | Purpose |
|-------|-------|------|---------|
| `--brutal-border-width` | `3px` | `3px` | Border width for all components |
| `--brutal-border-color` | `#000000` | `#ffffff` | Border color |
| `--brutal-shadow-offset-x` | `4px` | `4px` | Shadow horizontal offset |
| `--brutal-shadow-offset-y` | `4px` | `4px` | Shadow vertical offset |
| `--brutal-shadow-color` | `#000000` | `#ffffff` | Shadow color |
| `--brutal-radius` | `0px` | `0px` | Border radius for rounded elements |
| `--brutal-bg` | `#ffffff` | `#141414` | Background color |
| `--brutal-fg` | `#000000` | `#ffffff` | Foreground (text) color |
| `--brutal-primary` | `#FF6B6B` | `#FF6B6B` | Primary color (coral) |
| `--brutal-secondary` | `#4ECDC4` | `#4ECDC4` | Secondary color (mint teal) |
| `--brutal-accent` | `#FFE66D` | `#FFE66D` | Accent color (yellow) |
| `--brutal-destructive` | `#EF476F` | `#EF476F` | Danger/error color |
| `--brutal-success` | `#7FB069` | `#7FB069` | Success color |
| `--brutal-muted` | `#f3f4f6` | `#1e1e1e` | Muted background |
| `--brutal-muted-foreground` | `#4B5563` | `#9CA3AF` | Muted text color |
| `--brutal-ring` | `#000000` | `#ffffff` | Focus ring color |
| `--brutal-pressed-offset` | `2px` | `2px` | Y-axis offset for pressed state |
| `--brutal-info` | `#4A90D9` | `#3B82F6` | Info color |
| `--brutal-overlay` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` | Overlay background |
| `--brutal-placeholder` | `#9CA3AF` | `#6B7280` | Placeholder text color |
| `--brutal-primary-foreground` | `#FFFFFF` | — | Primary color foreground text |
| `--brutal-secondary-foreground` | `#FFFFFF` | — | Secondary color foreground text |
| `--brutal-accent-foreground` | `#2D1810` | — | Accent color foreground text |
| `--brutal-destructive-foreground` | `#FFFFFF` | — | Destructive color foreground text |
| `--brutal-success-foreground` | `#FFFFFF` | — | Success color foreground text |
| `--brutal-info-foreground` | `#FFFFFF` | — | Info color foreground text |

## Theme Presets

### Classic (Default)

The iconic BrutxUI style. Thick borders, hard shadows, zero border radius, vibrant colors.

```css
.theme-classic {
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
    --brutal-info: #4A90D9;
    --brutal-overlay: rgba(0, 0, 0, 0.5);
    --brutal-placeholder: #9CA3AF;
}
.dark .theme-classic, .theme-classic.dark {
    --brutal-border-color: #ffffff;
    --brutal-shadow-color: #ffffff;
    --brutal-bg: #141414;
    --brutal-fg: #ffffff;
    --brutal-muted-foreground: #9CA3AF;
    --brutal-ring: #ffffff;
    --brutal-info: #3B82F6;
    --brutal-overlay: rgba(0, 0, 0, 0.7);
    --brutal-placeholder: #6B7280;
}
```

### Pastel

A softer, friendlier style. Thinner borders, smaller shadows, rounded corners, muted tones.

```css
.theme-pastel {
    --brutal-border-width: 2px;
    --brutal-border-color: #1e1e24;
    --brutal-shadow-offset-x: 3px;
    --brutal-shadow-offset-y: 3px;
    --brutal-shadow-color: #1e1e24;
    --brutal-radius: 8px;
    --brutal-bg: #faf9f6;
    --brutal-fg: #1e1e24;
    --brutal-primary: #d6c6e1;
    --brutal-secondary: #c5ded9;
    --brutal-accent: #fbe3b5;
    --brutal-destructive: #f3b0b0;
    --brutal-success: #cce2cb;
    --brutal-muted: #eae8e1;
    --brutal-muted-foreground: #6b6b78;
    --brutal-ring: #1e1e24;
    --brutal-info: #a8c8e8;
    --brutal-overlay: rgba(0, 0, 0, 0.4);
    --brutal-placeholder: #b0aeb5;
}
.dark .theme-pastel, .theme-pastel.dark {
    --brutal-border-color: #e5e5e5;
    --brutal-shadow-color: #e5e5e5;
    --brutal-bg: #18171c;
    --brutal-fg: #e5e5e5;
    --brutal-primary: #8a739b;
    --brutal-secondary: #6e8e88;
    --brutal-accent: #b28e56;
    --brutal-destructive: #9b5a5a;
    --brutal-success: #678465;
    --brutal-muted: #27252f;
    --brutal-muted-foreground: #8a8a99;
    --brutal-ring: #e5e5e5;
    --brutal-info: #5a7a9b;
    --brutal-overlay: rgba(0, 0, 0, 0.7);
    --brutal-placeholder: #5a5866;
}
```

### Mono

Maximum contrast. Extra-thick borders, larger shadows, grayscale palette.

```css
.theme-mono {
    --brutal-border-width: 4px;
    --brutal-border-color: #000000;
    --brutal-shadow-offset-x: 5px;
    --brutal-shadow-offset-y: 5px;
    --brutal-shadow-color: #000000;
    --brutal-radius: 0px;
    --brutal-bg: #ffffff;
    --brutal-fg: #000000;
    --brutal-primary: #000000;
    --brutal-secondary: #ffffff;
    --brutal-accent: #7a7a7a;
    --brutal-destructive: #333333;
    --brutal-success: #dddddd;
    --brutal-muted: #f0f0f0;
    --brutal-muted-foreground: #555555;
    --brutal-ring: #000000;
    --brutal-info: #666666;
    --brutal-overlay: rgba(0, 0, 0, 0.5);
    --brutal-placeholder: #888888;
}
.dark .theme-mono, .theme-mono.dark {
    --brutal-border-color: #ffffff;
    --brutal-shadow-color: #ffffff;
    --brutal-bg: #000000;
    --brutal-fg: #ffffff;
    --brutal-primary: #ffffff;
    --brutal-secondary: #000000;
    --brutal-accent: #888888;
    --brutal-destructive: #cccccc;
    --brutal-success: #222222;
    --brutal-muted: #1a1a1a;
    --brutal-muted-foreground: #aaaaaa;
    --brutal-ring: #ffffff;
    --brutal-info: #999999;
    --brutal-overlay: rgba(0, 0, 0, 0.7);
    --brutal-placeholder: #777777;
}
```

### Warm

Warm neobrutalism blends raw aesthetics with warm visuals. Orange, brown, beige, and cream tones dominate, with slight border radius softening the hard edges.

```css
.theme-warm {
    --brutal-border-width: 3px;
    --brutal-border-color: #5C3D2E;
    --brutal-shadow-offset-x: 4px;
    --brutal-shadow-offset-y: 4px;
    --brutal-shadow-color: #5C3D2E;
    --brutal-radius: 4px;
    --brutal-bg: #FFF8F0;
    --brutal-fg: #2D1810;
    --brutal-primary: #E8722A;
    --brutal-primary-foreground: #FFFFFF;
    --brutal-secondary: #8B6F47;
    --brutal-secondary-foreground: #FFFFFF;
    --brutal-accent: #F2C078;
    --brutal-accent-foreground: #2D1810;
    --brutal-destructive: #C0392B;
    --brutal-destructive-foreground: #FFFFFF;
    --brutal-success: #7B8B3A;
    --brutal-success-foreground: #FFFFFF;
    --brutal-muted: #F5EDE3;
    --brutal-muted-foreground: #6B5B4F;
    --brutal-ring: #E8722A;
    --brutal-info: #D4956A;
    --brutal-info-foreground: #FFFFFF;
    --brutal-overlay: rgba(45, 24, 16, 0.5);
    --brutal-placeholder: #B8A898;
}
.dark .theme-warm, .theme-warm.dark {
    --brutal-border-color: #C4A882;
    --brutal-shadow-color: #C4A882;
    --brutal-bg: #1A1410;
    --brutal-fg: #F5E6D3;
    --brutal-primary: #F59E4C;
    --brutal-primary-foreground: #1A1410;
    --brutal-secondary: #B8956A;
    --brutal-secondary-foreground: #1A1410;
    --brutal-accent: #FFD89B;
    --brutal-accent-foreground: #1A1410;
    --brutal-destructive: #E74C3C;
    --brutal-destructive-foreground: #FFFFFF;
    --brutal-success: #A3B556;
    --brutal-success-foreground: #1A1410;
    --brutal-muted: #2A2018;
    --brutal-muted-foreground: #B8A898;
    --brutal-ring: #F59E4C;
    --brutal-info: #E8B88A;
    --brutal-info-foreground: #1A1410;
    --brutal-overlay: rgba(0, 0, 0, 0.7);
    --brutal-placeholder: #6B5B4F;
}
```

## Custom Tokens

Override tokens at the `:root` level for global changes:

```css
:root {
    --brutal-primary: #8B5CF6;
    --brutal-secondary: #06B6D4;
    --brutal-radius: 4px;
}
```

Or scope overrides to a specific area:

```css
.sidebar {
    --brutal-primary: #8B5CF6;
    --brutal-border-width: 2px;
}
```

You can also use the [Theme Playground](/en/guide/theme-playground) to select a base theme and adjust tokens, then copy the generated `.theme-custom` CSS into your project.

## Tailwind Utilities

BrutxUI registers the following Tailwind utility classes that reference CSS variables:

### Border

| Utility | Maps To |
|---------|---------|
| `border-3` | `border-width: var(--brutal-border-width)` |
| `border-brutal` | `border-color: var(--brutal-border-color)` |
| `rounded-brutal` | `border-radius: var(--brutal-radius)` |

### Shadow

| Utility | Maps To |
|---------|---------|
| `shadow-brutal` | Full offset shadow |
| `shadow-brutal-sm` | Half offset shadow |
| `shadow-brutal-lg` | 1.5x offset shadow |
| `shadow-brutal-xl` | 2x offset shadow |
| `shadow-brutal-primary` | Primary color shadow |
| `shadow-brutal-secondary` | Secondary color shadow |

### Color

| Utility | Maps To |
|---------|---------|
| `bg-brutal-bg` | `var(--brutal-bg)` |
| `text-brutal-fg` | `var(--brutal-fg)` |
| `bg-brutal-primary` | `var(--brutal-primary)` |
| `bg-brutal-secondary` | `var(--brutal-secondary)` |
| `bg-brutal-accent` | `var(--brutal-accent)` |
| `bg-brutal-destructive` | `var(--brutal-destructive)` |
| `bg-brutal-success` | `var(--brutal-success)` |
| `bg-brutal-info` | `var(--brutal-info)` |
| `bg-brutal-muted` | `var(--brutal-muted)` |
| `text-brutal-muted-foreground` | `var(--brutal-muted-foreground)` |
| `text-brutal-placeholder` | `var(--brutal-placeholder)` |
| `bg-brutal-placeholder` | `var(--brutal-placeholder)` |
| `ring-brutal-ring` | `var(--brutal-ring)` |

## Dark Mode

BrutxUI supports dark mode via the `.dark` class. When the `dark` class is applied to the `<html>` or `<body>` element, all CSS variables automatically switch to their dark mode values.

```html
<html class="dark">
    <!-- Dark mode active -->
</html>
```

Toggle dark mode programmatically:

```vue
<script setup>
import { ref } from 'vue'

const isDark = ref(false)

function toggleDark() {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
}
</script>

<template>
    <button @click="toggleDark">Toggle Dark Mode</button>
</template>
```

Theme presets also support dark mode via the `.dark .theme-pastel` or `.theme-pastel.dark` selectors.

## useTheme Composable

BrutxUI provides the `useTheme` composable for switching themes and dark mode at runtime.

```ts
import { useTheme } from 'brutx-ui-vue'

const {
    theme,
    colorMode,
    resolvedColorMode,
    isSystemDark,
    setTheme,
    setCustomVariable,
    removeCustomVariable,
    toggleColorMode,
    applyColorMode,
    initTheme,
} = useTheme()
```

### API

| Property/Method | Type | Description |
|-----------|------|------|
| `theme` | `Ref<'classic' \| 'pastel' \| 'mono' \| 'warm'>` | Current theme name (reactive) |
| `colorMode` | `Ref<'light' \| 'dark' \| 'system'>` | Current color mode (reactive) |
| `resolvedColorMode` | `ComputedRef<'light' \| 'dark'>` | Actually applied color mode (resolved value when in system mode) |
| `isSystemDark` | `Ref<boolean>` | Whether the system is currently in dark mode |
| `setTheme(name)` | `(name: ThemeName) => void` | Switch theme, updating DOM class and localStorage simultaneously |
| `setCustomVariable(name, value)` | `(name: \`--${string}\`, value: string) => void` | Set a custom CSS variable via `document.documentElement.style.setProperty` (added in Batch 8.3) |
| `removeCustomVariable(name)` | `(name: \`--${string}\`) => void` | Remove a custom CSS variable (added in Batch 8.3) |
| `toggleColorMode()` | `() => void` | Cycle through light -> dark -> system |
| `applyColorMode(mode)` | `(mode: ColorMode) => void` | Set a specific color mode |
| `initTheme()` | `() => void` | Restore user preferences from localStorage, or follow system preferences |
| `destroy()` | `() => void` | Clean up matchMedia listeners (called automatically on component unmount) |

### Usage Examples

Call `initTheme` at the app entry point to restore the user's last selection:

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { useTheme } from 'brutx-ui-vue'

const { initTheme } = useTheme()
initTheme()

createApp(App).mount('#app')
```

Switch themes and dark mode within a component:

```vue
<script setup lang="ts">
import { useTheme, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Button } from 'brutx-ui-vue'
import type { AcceptableValue } from 'reka-ui'

const { theme, colorMode, setTheme, toggleColorMode } = useTheme()

const themes = [
    { value: 'classic', label: 'Classic' },
    { value: 'pastel', label: 'Pastel' },
    { value: 'mono', label: 'Mono' },
    { value: 'warm', label: 'Warm' },
]

function handleThemeChange(value: AcceptableValue) {
    if (typeof value === 'string') setTheme(value)
}
</script>

<template>
    <Select :model-value="theme" @update:model-value="handleThemeChange">
        <SelectTrigger size="sm" class="w-auto min-w-[8rem]">
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            <SelectItem v-for="t in themes" :key="t.value" :value="t.value">
                {{ t.label }}
            </SelectItem>
        </SelectContent>
    </Select>
    <Button variant="default" size="sm" @click="toggleColorMode">
        {{ colorMode === 'light' ? 'Light' : colorMode === 'dark' ? 'Dark' : 'System' }}
    </Button>
</template>
```

### Runtime Theme Customization

`setCustomVariable` and `removeCustomVariable` are used to dynamically write or clear any CSS variable at runtime (written to `document.documentElement` inline styles). They are ideal for scenarios like "user-defined primary color", "brand color live preview", or "runtime border width adjustment" without rebuilding CSS.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useTheme, Button, Input } from 'brutx-ui-vue'

const { setCustomVariable, removeCustomVariable } = useTheme()

const primaryColor = ref('#8B5CF6')
const borderWidth = ref('3px')

function applyPrimary() {
    setCustomVariable('--brutal-primary', primaryColor.value)
}

function applyBorderWidth() {
    setCustomVariable('--brutal-border-width', borderWidth.value)
}

function reset() {
    removeCustomVariable('--brutal-primary')
    removeCustomVariable('--brutal-border-width')
}
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
            <Input v-model="primaryColor" size="sm" class="w-40" placeholder="Primary (e.g. #8B5CF6)" />
            <Button variant="primary" size="sm" @click="applyPrimary">Apply Primary</Button>
        </div>
        <div class="flex items-center gap-2">
            <Input v-model="borderWidth" size="sm" class="w-40" placeholder="Border width (e.g. 5px)" />
            <Button variant="default" size="sm" @click="applyBorderWidth">Apply Border</Button>
        </div>
        <Button variant="default" size="sm" @click="reset">Reset to Default</Button>
    </div>
</template>
```

> Notes:
>
> - `setCustomVariable` directly calls `document.documentElement.style.setProperty`, so it will override variables with the same name defined in preset themes and `:root`. In SSR environments (`typeof document === 'undefined'`), the function safely skips execution.
> - `removeCustomVariable` calls `removeProperty`, which only removes inline-style variables with the same name and does not affect variables defined via CSS in stylesheets. Therefore, after "resetting to default", the value falls back to the current theme preset.
> - The `name` parameter must start with `--` (enforced at compile time via the template literal type `\`--${string}\``), otherwise a compile-time error will occur.

## ColorModeSwitcher Component

BrutxUI provides an out-of-the-box `ColorModeSwitcher` component with three display modes.

```vue
<script setup>
import { ColorModeSwitcher } from 'brutx-ui-vue'
</script>

<template>
    <!-- Icon mode (default) -->
    <ColorModeSwitcher />

    <!-- Button mode -->
    <ColorModeSwitcher display="button" />

    <!-- Dropdown select mode -->
    <ColorModeSwitcher display="select" />

    <!-- Hide the "system" option -->
    <ColorModeSwitcher :show-system="false" />
</template>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `display` | `'icon' \| 'button' \| 'select'` | `'icon'` | Display mode |
| `showSystem` | `boolean` | `true` | Whether to show the "system" option |

## CSS Animation Presets

BrutxUI provides 13 neobrutalist-style animation utility classes with support for the `prefers-reduced-motion` accessibility setting.

| Class | Effect | Duration |
| --- | --- | --- |
| `animate-brutal-shake` | Left-right shake | 0.3s |
| `animate-brutal-bounce` | Bounce | 0.5s |
| `animate-brutal-pulse` | Pulse scale | 0.8s |
| `animate-brutal-flip` | Horizontal flip | 0.4s |
| `animate-brutal-slide-up` | Slide in from below | 0.3s |
| `animate-brutal-slide-down` | Slide in from above | 0.3s |
| `animate-brutal-slide-left` | Slide in from right | 0.3s |
| `animate-brutal-slide-right` | Slide in from left | 0.3s |
| `animate-brutal-pop` | Pop and enlarge | 0.2s |
| `animate-brutal-rotate` | Rotate 360deg | 0.6s |
| `animate-brutal-swing` | Pendulum swing | 0.5s |
| `animate-brutal-jello` | Jello wobble | 0.5s |
| `animate-brutal-heartbeat` | Heartbeat | 1s |

### Delay and Repeat

```html
<div class="animate-brutal-bounce animation-delay-200 animation-infinite">
    Bounce infinitely after 200ms delay
</div>
```

| Class | Description |
| --- | --- |
| `animation-delay-100` | 100ms delay |
| `animation-delay-200` | 200ms delay |
| `animation-delay-300` | 300ms delay |
| `animation-delay-500` | 500ms delay |
| `animation-once` | Play only once |
| `animation-infinite` | Loop infinitely |

## useAnimation Composable

CSS animation preset classes can be used directly in `<template>`, but when animation class names need to be dynamically toggled based on state, or when you want to uniformly respect the system-level `prefers-reduced-motion` preference, you can use the `useAnimation` composable to handle animation degradation in JavaScript.

`useAnimation` accepts an animation class name (supports `ref` / `getter` / static string) and returns the resolved animation class along with the reduced-motion preference. When the user's system has `prefers-reduced-motion: reduce` enabled, `animationClass` automatically becomes an empty string, thereby disabling the animation.

```ts
import { useAnimation } from 'brutx-ui-vue'

const { animationClass, prefersReduced } = useAnimation('animate-brutal-bounce')
// When prefersReduced=true, animationClass is an empty string
```

### API

| Property | Type | Description |
|------|------|------|
| `animationClass` | `ComputedRef<string>` | Resolved animation class name; empty string when reduced motion is enabled |
| `prefersReduced` | `Ref<boolean>` | Whether the system has `prefers-reduced-motion: reduce` enabled |

### Parameters

| Parameter | Type | Default | Description |
|------|------|--------|------|
| `animationClass` | `MaybeRefOrGetter<string>` | `''` | The animation class name to apply; supports `ref` / `getter` / static string |

### Usage Examples

Dynamically switch animation classes based on component state while automatically respecting reduced-motion preferences:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnimation } from 'brutx-ui-vue'

const shake = ref(false)
const animationName = computed(() => shake.value ? 'animate-brutal-shake' : 'animate-brutal-pulse')
const { animationClass } = useAnimation(animationName)

function trigger() {
    shake.value = !shake.value
}
</script>

<template>
    <div :class="animationClass">
        Animation area
    </div>
    <button @click="trigger">Toggle Animation</button>
</template>
```

> Tip: `useAnimation` is internally based on `useReducedMotion`, which subscribes to `matchMedia('(prefers-reduced-motion: reduce)')` on `onMounted` and automatically cleans up the listener on `onUnmounted`. It must be called at the top level of `setup` and cannot be called inside async callbacks or event handlers.
