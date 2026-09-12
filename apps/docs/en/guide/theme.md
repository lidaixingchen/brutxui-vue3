---
title: Themes & Tokens
description: Understand BrutxUI's CSS variable tokens, presets, and pattern utilities
---

# Themes & Tokens

BrutxUI uses CSS custom properties (design tokens) to control every visual aspect of the neo-brutalist system. Customizing your design system is as simple as overriding a CSS variable.

For interactive visual tuning before copying CSS variables, check out the [Theme Playground](/en/guide/theme-playground). It features live component matrices, contrast checks, and token coverage inspection.

> **Contrast Notice**: Background/foreground pairs such as `--brutal-primary` and `--brutal-primary-foreground` are used for active/selected compact text (e.g. calendar active dates at 10px bold), requiring a ratio ≥ 4.5:1 (WCAG AA). When creating custom themes, verify your contrast pairings in the [Theme Playground](/en/guide/theme-playground).

---

## CSS Variables (Design Tokens)

All foundational design tokens are prefixed with `--brutal-` and defined uniformly across `:root` and `.dark`:

| Token | Light Mode | Dark Mode | Usage |
|-------|-------|------|---------|
| `--brutal-border-width` | `3px` | `3px` | Border width for all components |
| `--brutal-border-color` | `#000000` | `#ffffff` | Border color |
| `--brutal-shadow-offset-x` | `4px` | `4px` | Horizontal shadow offset |
| `--brutal-shadow-offset-y` | `4px` | `4px` | Vertical shadow offset |
| `--brutal-shadow-color` | `#000000` | `#ffffff` | Shadow color |
| `--brutal-radius` | `0px` | `0px` | Border radius for rounded elements |
| `--brutal-bg` | `#ffffff` | `#141414` | Surface canvas background color |
| `--brutal-fg` | `#000000` | `#ffffff` | Foreground (body text) color |
| `--brutal-primary` | `#FF6B6B` | `#FF6B6B` | Primary color (Coral red) |
| `--brutal-primary-foreground` | `#000000` | `#000000` | Primary foreground text (High-contrast black) |
| `--brutal-secondary` | `#4ECDC4` | `#4ECDC4` | Secondary color (Mint teal) |
| `--brutal-secondary-foreground` | `#000000` | `#000000` | Secondary foreground text (High-contrast black) |
| `--brutal-accent` | `#FFE66D` | `#FFE66D` | Accent color (Yellow) |
| `--brutal-accent-foreground` | `#000000` | `#000000` | Accent foreground text (High-contrast black) |
| `--brutal-destructive` | `#EF476F` | `#EF476F` | Destructive / error color |
| `--brutal-destructive-foreground` | `#000000` | `#000000` | Destructive foreground text (High-contrast black) |
| `--brutal-success` | `#7FB069` | `#7FB069` | Success color |
| `--brutal-success-foreground` | `#000000` | `#000000` | Success foreground text (High-contrast black) |
| `--brutal-muted` | `#f3f4f6` | `#1e1e1e` | Muted background |
| `--brutal-muted-foreground` | `#4B5563` | `#9CA3AF` | Muted text color |
| `--brutal-ring` | `#000000` | `#ffffff` | Focus ring color |
| `--brutal-info` | `#4A90D9` | `#3B82F6` | Informational color |
| `--brutal-info-foreground` | `#000000` | `#000000` | Info foreground text (High-contrast black) |
| `--brutal-status-success` | `#22c55e` | `#22c55e` | Success indicator color |
| `--brutal-status-success-foreground` | `#000000` | `#000000` | Success indicator text color |
| `--brutal-status-warning` | `#FFE66D` | `#FFE66D` | Warning indicator color |
| `--brutal-status-warning-foreground` | `#000000` | `#000000` | Warning indicator text color |
| `--brutal-status-info` | `#3b82f6` | `#3b82f6` | Information indicator color |
| `--brutal-status-info-foreground` | `#000000` | `#000000` | Information indicator text color |
| `--brutal-status-error` | `#EF476F` | `#EF476F` | Error indicator color |
| `--brutal-status-error-foreground` | `#000000` | `#000000` | Error indicator text color |
| `--brutal-overlay` | `rgba(0, 0, 0, 0.5)` | `rgba(0, 0, 0, 0.7)` | Modal backdrop overlay |
| `--brutal-overlay-subtle` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.05)` | Subtle drag / sheet backdrop overlay |
| `--brutal-placeholder` | `#6e7788` | `#767e8c` | Input placeholder color |
| `--brutal-black` | `#000000` | `#000000` | Brand pure black |
| `--brutal-yellow` | `#FFE66D` | `#FFE66D` | Brand pure yellow |

---

## Theme Presets

BrutxUI provides 4 built-in theme presets. Activate them by applying the corresponding class on the root or container element:

### Classic (Default Baseline)

The signature BrutxUI aesthetic: heavy borders, hard shadows, zero border radius, and high-saturation clashing accents. Classic is the built-in global default defined on `:root` and `.dark`, requiring no extra class names.

```html
<!-- Default is Classic style; toggle dark mode via .dark -->
<html class="dark">
    ...
</html>
```

### Pastel

Softer and friendlier. 2px borders, 3px reduced shadows, 8px rounded corners, and delicate pastel shades.

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
    --brutal-primary-foreground: #1e1e24;
    --brutal-secondary: #c5ded9;
    --brutal-secondary-foreground: #1e1e24;
    --brutal-accent: #fbe3b5;
    --brutal-accent-foreground: #1e1e24;
    --brutal-destructive: #f3b0b0;
    --brutal-destructive-foreground: #1e1e24;
    --brutal-success: #cce2cb;
    --brutal-success-foreground: #1e1e24;
    --brutal-muted: #eae8e1;
    --brutal-muted-foreground: #5e5e6b;
    --brutal-ring: #1e1e24;
    --brutal-info: #a8c8e8;
    --brutal-info-foreground: #1e1e24;
    --brutal-overlay: rgba(0, 0, 0, 0.4);
    --brutal-placeholder: #74717c;
}
.dark .theme-pastel, .theme-pastel.dark {
    --brutal-border-width: 2px;
    --brutal-border-color: #66667c;
    --brutal-shadow-offset-x: 3px;
    --brutal-shadow-offset-y: 3px;
    --brutal-shadow-color: #66667c;
    --brutal-radius: 8px;
    --brutal-bg: #16161e;
    --brutal-fg: #f0f0f5;
    --brutal-primary: #e8988a;
    --brutal-primary-foreground: #16161e;
    --brutal-secondary: #e0b8b0;
    --brutal-secondary-foreground: #16161e;
    --brutal-accent: #9ac4b6;
    --brutal-accent-foreground: #16161e;
    --brutal-destructive: #db6e60;
    --brutal-destructive-foreground: #16161e;
    --brutal-success: #7cbfa0;
    --brutal-success-foreground: #16161e;
    --brutal-muted: #20202c;
    --brutal-muted-foreground: #9898b0;
    --brutal-ring: #9ac4b6;
    --brutal-info: #88b8e6;
    --brutal-info-foreground: #16161e;
    --brutal-overlay: rgba(0, 0, 0, 0.6);
    --brutal-placeholder: #7e7e90;
}
```

### Mono

Maximum monochrome contrast. 4px heavy borders, 5px deep shadows, and pure grayscale palette.

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
    --brutal-primary-foreground: #ffffff;
    --brutal-secondary: #ffffff;
    --brutal-secondary-foreground: #000000;
    --brutal-accent: #707070;
    --brutal-accent-foreground: #ffffff;
    --brutal-destructive: #333333;
    --brutal-destructive-foreground: #ffffff;
    --brutal-success: #dddddd;
    --brutal-success-foreground: #000000;
    --brutal-muted: #f0f0f0;
    --brutal-muted-foreground: #555555;
    --brutal-ring: #000000;
    --brutal-info: #666666;
    --brutal-info-foreground: #ffffff;
    --brutal-overlay: rgba(0, 0, 0, 0.5);
    --brutal-placeholder: #767676;
}
.dark .theme-mono, .theme-mono.dark {
    --brutal-border-width: 4px;
    --brutal-border-color: #ffffff;
    --brutal-shadow-offset-x: 5px;
    --brutal-shadow-offset-y: 5px;
    --brutal-shadow-color: #ffffff;
    --brutal-radius: 0px;
    --brutal-bg: #000000;
    --brutal-fg: #ffffff;
    --brutal-primary: #ffffff;
    --brutal-primary-foreground: #000000;
    --brutal-secondary: #000000;
    --brutal-secondary-foreground: #ffffff;
    --brutal-accent: #888888;
    --brutal-accent-foreground: #000000;
    --brutal-destructive: #cccccc;
    --brutal-destructive-foreground: #000000;
    --brutal-success: #222222;
    --brutal-success-foreground: #ffffff;
    --brutal-muted: #1a1a1a;
    --brutal-muted-foreground: #aaaaaa;
    --brutal-ring: #ffffff;
    --brutal-info: #999999;
    --brutal-info-foreground: #000000;
    --brutal-overlay: rgba(0, 0, 0, 0.7);
    --brutal-placeholder: #777777;
}
```

### Warm (Warm Brutalism)

Earthy warm palette with organic retro tactility. Espresso borders, burnt orange, and warm cream surfaces with 4px softened corners.

```css
.theme-warm {
    --brutal-border-width: 3px;
    --brutal-border-color: #5c3d2e;
    --brutal-shadow-offset-x: 4px;
    --brutal-shadow-offset-y: 4px;
    --brutal-shadow-color: #5c3d2e;
    --brutal-radius: 4px;
    --brutal-bg: #fff8f0;
    --brutal-fg: #2d1810;
    --brutal-primary: #e8722a;
    --brutal-primary-foreground: #2d1810;
    --brutal-secondary: #856a44;
    --brutal-secondary-foreground: #fff8f0;
    --brutal-accent: #f2c078;
    --brutal-accent-foreground: #2d1810;
    --brutal-destructive: #c0392b;
    --brutal-destructive-foreground: #fff8f0;
    --brutal-success: #82943e;
    --brutal-success-foreground: #2d1810;
    --brutal-muted: #f5ede3;
    --brutal-muted-foreground: #6b5b4f;
    --brutal-ring: #e8722a;
    --brutal-info: #d4956a;
    --brutal-info-foreground: #2d1810;
    --brutal-overlay: rgba(45, 24, 16, 0.5);
    --brutal-placeholder: #846f5b;
}
.dark .theme-warm, .theme-warm.dark {
    --brutal-border-width: 3px;
    --brutal-border-color: #c4a882;
    --brutal-shadow-offset-x: 4px;
    --brutal-shadow-offset-y: 4px;
    --brutal-shadow-color: #c4a882;
    --brutal-radius: 4px;
    --brutal-bg: #1a1410;
    --brutal-fg: #f5e6d3;
    --brutal-primary: #f59e4c;
    --brutal-primary-foreground: #1a1410;
    --brutal-secondary: #b8956a;
    --brutal-secondary-foreground: #1a1410;
    --brutal-accent: #ffd89b;
    --brutal-accent-foreground: #1a1410;
    --brutal-destructive: #e74c3c;
    --brutal-destructive-foreground: #1a1410;
    --brutal-success: #a3b556;
    --brutal-success-foreground: #1a1410;
    --brutal-muted: #2a2018;
    --brutal-muted-foreground: #b8a898;
    --brutal-ring: #f59e4c;
    --brutal-info: #e0a97e;
    --brutal-info-foreground: #1a1410;
    --brutal-overlay: rgba(0, 0, 0, 0.7);
    --brutal-placeholder: #8e7c6d;
}
```

---

## Custom Tokens

Override tokens at the `:root` level for global changes:

```css
:root {
    --brutal-primary: #8B5CF6;
    --brutal-secondary: #06B6D4;
    --brutal-radius: 4px;
}
```

Or scope them to specific subtrees:

```css
.sidebar {
    --brutal-primary: #8B5CF6;
    --brutal-border-width: 2px;
}
```

You can also customize values in the [Theme Playground](/en/guide/theme-playground) and export ready-to-use CSS directly.

---

## Tailwind Utilities

BrutxUI registers utility classes referencing design token variables:

### Borders and Radius

| Utility | Maps to | Description |
| :--- | :--- | :--- |
| `border-3` | `border-width: var(--brutal-border-width)` | Standard neo-brutalist border width |
| `border-brutal` | `border-color: var(--brutal-border-color)` | Primary border stroke color |
| `rounded-brutal` | `border-radius: var(--brutal-radius)` | Physical border radius |

### Shadows

| Utility | Description |
| :--- | :--- |
| `shadow-brutal` | Standard 1x hard drop shadow |
| `shadow-brutal-sm` | 0.5x subtle compact hard shadow |
| `shadow-brutal-lg` | 1.5x deepened hard shadow |
| `shadow-brutal-xl` | 2x extra-large hard shadow |
| `shadow-brutal-primary` | Primary color hard shadow |
| `shadow-brutal-secondary` | Secondary color hard shadow |
| `shadow-brutal-destructive` | Destructive status hard shadow |
| `shadow-brutal-stacked` | Multi-layered sandwich rainbow hard shadow |
| `shadow-brutal-inset` | Stamped recessed inset groove shadow |

### Colors and Subtle Derivations

| Utility | Target Variable / Mechanism |
| :--- | :--- |
| `bg-brutal-bg` / `text-brutal-fg` | Canvas background & body typography foreground |
| `bg-brutal-primary` / `text-brutal-primary-foreground` | Brand primary color & readable text |
| `bg-brutal-secondary` / `text-brutal-secondary-foreground` | Secondary color & readable text |
| `bg-brutal-accent` / `text-brutal-accent-foreground` | Accent highlight color & readable text |
| `bg-brutal-destructive` / `text-brutal-destructive-foreground` | Destructive error color & readable text |
| `bg-brutal-success` / `text-brutal-success-foreground` | Success color & readable text |
| `bg-brutal-info` / `text-brutal-info-foreground` | Informational color & readable text |
| `bg-brutal-muted` / `text-brutal-muted-foreground` | Secondary muted surface & text |
| `text-brutal-placeholder` | Placeholder gray text |
| `ring-brutal-ring` | Interactive focus ring color |
| `bg-brutal-*-subtle` | Subtle derived background (e.g. `bg-brutal-primary-subtle`, automatically blended with theme canvas) |

### Pattern Utilities

Add authentic industrial neo-brutalist textures to cards, banners, or page backgrounds:

| Utility | Description |
| :--- | :--- |
| `bg-pattern-dots` | Halftone dot matrix: newsprint & screenprint patterns |
| `bg-pattern-grid` | Blueprint grid: millimetric coordinate paper & CAD drafting |
| `bg-pattern-hazard` | Hazard stripes: industrial safety warning posts & heavy machinery |
| `bg-pattern-hatch` | Fine hatch stripes: cross-sectional engineering hatch & header fills |
| `bg-pattern-scanlines` | CRT scanlines: retro terminal phosphorescent scan glow |

---

## Dark Mode

BrutxUI supports dark mode via the `.dark` class. When applied to `<html>` or container elements, all CSS variables automatically switch to their dark mode counterparts.

```html
<html class="dark">
    <!-- Dark mode active -->
</html>
```

---

## useTheme Composable

BrutxUI provides the `useTheme` composable to manage themes and dark mode dynamically at runtime.

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
|---|---|---|
| `theme` | `Ref<'classic' \| 'pastel' \| 'mono' \| 'warm'>` | Active theme name (reactive) |
| `colorMode` | `Ref<'light' \| 'dark' \| 'system'>` | Active color mode setting (reactive) |
| `resolvedColorMode` | `ComputedRef<'light' \| 'dark'>` | Actual resolved mode (resolves system preference) |
| `isSystemDark` | `Ref<boolean>` | Whether system prefers dark mode |
| `setTheme(name)` | `(name: ThemeName) => void` | Changes theme preset, updates DOM class & persists to localStorage |
| `setCustomVariable(name, value)` | `(name: \`--${string}\`, value: string) => void` | Sets custom CSS variable via `document.documentElement.style.setProperty` |
| `removeCustomVariable(name)` | `(name: \`--${string}\`) => void` | Removes custom inline CSS variable |
| `toggleColorMode()` | `() => void` | Cycles through light → dark → system |
| `applyColorMode(mode)` | `(mode: ColorMode) => void` | Explicitly applies specified color mode |
| `initTheme()` | `() => void` | Restores preference from localStorage or follows system |
| `destroy()` | `() => void` | Disposes matchMedia event listeners |

### Example

Restore preferences at application launch:

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { useTheme } from 'brutx-ui-vue'

const { initTheme } = useTheme()
initTheme()

createApp(App).mount('#app')
```

Switch presets and color modes within components:

```vue
<script setup lang="ts">
import { SelectValue } from 'reka-ui'
import { useTheme, Select, SelectTrigger, SelectContent, SelectItem, Button } from 'brutx-ui-vue'
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
    <div class="flex items-center gap-3">
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
    </div>
</template>
```

### Dynamic Runtime Token Customization

`setCustomVariable` and `removeCustomVariable` dynamically write or clean CSS variables on `document.documentElement.style` at runtime, enabling live brand color pickers and border adjustments without recompiling CSS.

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
            <Button variant="default" size="sm" @click="applyPrimary">Apply Primary</Button>
        </div>
        <div class="flex items-center gap-2">
            <Input v-model="borderWidth" size="sm" class="w-40" placeholder="Border Width (e.g. 5px)" />
            <Button variant="default" size="sm" @click="applyBorderWidth">Apply Border</Button>
        </div>
        <Button variant="outline" size="sm" @click="reset">Reset Defaults</Button>
    </div>
</template>
```

---

## ColorModeSwitcher Component

BrutxUI ships a built-in `ColorModeSwitcher` component with three display options:

```vue
<script setup>
import { ColorModeSwitcher } from 'brutx-ui-vue'
</script>

<template>
    <!-- Icon mode (default) -->
    <ColorModeSwitcher />

    <!-- Button toggle mode -->
    <ColorModeSwitcher display="button" />

    <!-- Select dropdown mode -->
    <ColorModeSwitcher display="select" />

    <!-- Hide "system" option -->
    <ColorModeSwitcher :show-system="false" />
</template>
```

### Props

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `display` | `'icon' \| 'button' \| 'select'` | `'icon'` | Display presentation mode |
| `showSystem` | `boolean` | `true` | Whether to display the "system" preference option |
