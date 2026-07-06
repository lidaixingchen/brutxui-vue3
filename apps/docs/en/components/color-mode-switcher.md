---
title: ColorModeSwitcher
description: A color mode switcher component supporting icon, button, and select display modes, with switching between light, dark, and system modes.
translated: true
---

# ColorModeSwitcher

A Neo-Brutalism style color mode switcher component, built on the `useTheme()` composable, offering three display modes.

## Demo

<ComponentPreview>
    <ColorModeSwitcherDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="color-mode-switcher" />

## Usage

### Icon Mode (default)

Click the icon to cycle through light / dark / system modes.

```vue
<script setup>
import { ColorModeSwitcher } from 'brutx-ui-vue'
</script>

<template>
    <ColorModeSwitcher />
</template>
```

### Button Mode

A combined button displaying an icon and text label. Click to cycle through modes.

```vue
<template>
    <ColorModeSwitcher display="button" />
</template>
```

### Select Mode

A dropdown selector based on the `Select` component, allowing direct selection of the target mode.

```vue
<template>
    <ColorModeSwitcher display="select" />
</template>
```

### Hiding the System Option

Control whether the "system" option is displayed via the `showSystem` prop. When set to `false`, cycling only occurs between light and dark modes.

```vue
<template>
    <ColorModeSwitcher :show-system="false" />
</template>
```

## Variants

| Variant | Description |
|---------|-------------|
| `icon` | Icon mode, displays only the icon corresponding to the current mode |
| `button` | Button mode, displays a combined button with icon and text label |
| `select` | Select mode, a dropdown selector based on the Select component |

## Composables

`ColorModeSwitcher` internally uses the `useTheme()` composable to retrieve and switch the current color mode. Production apps should provide a parent theme context via `provideTheme()`; the built-in shared singleton is only a compatibility fallback. Tests, multi-app pages, and hot-reload boundaries can call `destroyBrutxFallbacks()` to clear theme/toast/message fallback state together.

The color mode is persisted to `localStorage` (key: `brutx-color-mode`). When `system` is selected, it follows the system preference and listens for changes to the `prefers-color-scheme` media query.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `display` | `'icon' \| 'button' \| 'select'` | `'icon'` | Display mode: icon, button, or select |
| `showSystem` | `boolean` | `true` | Whether to show the "system" option |
| `class` | `string` | `undefined` | Custom CSS class |

## Accessibility

- **Keyboard interaction**: Supports `Enter` / `Space` to trigger switching
- **ARIA attributes**: The icon button includes a text description of the current mode
