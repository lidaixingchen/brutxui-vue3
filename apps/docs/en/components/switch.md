---
title: Switch
description: Toggle switch component for quick true/false boolean state switching.
translated: true
---

# Switch

A mechanical toggle switch built on reka-ui's Switch primitive, featuring 3D tactile keycaps, stamped guide track recesses, and industrial status markings, with v-model support.

## Demo

<ComponentPreview>
  <SwitchDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="switch" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const enabled = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Switch v-model="enabled" />
        <Label>Airplane mode</Label>
    </div>
</template>
```

### Industrial Marking Labels (I / O Marks)

Enable `showLabels` to render high-contrast monospace industrial markings (`I` / `O`) inside the track. Marked with `aria-hidden` for zero screen reader clutter.

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const power = ref(true)
</script>

<template>
    <div class="flex items-center gap-3">
        <Switch v-model="power" show-labels />
        <Label>Main Equipment Power</Label>
    </div>
</template>
```

### Mechanical Shape

Supports standard mechanical `slider` and industrial `rocker` switch shapes, orthogonally decoupled from the color `variant`.

```vue
<script setup>
import { ref } from 'vue'
import { Switch } from 'brutx-ui-vue'

const val1 = ref(false)
const val2 = ref(true)
</script>

<template>
    <div class="flex items-center gap-4">
        <Switch v-model="val1" shape="slider" variant="primary" />
        <Switch v-model="val2" shape="rocker" variant="accent" show-labels />
    </div>
</template>
```

### Disabled State

```vue
<template>
    <Switch disabled />
</template>
```

### Custom Accessibility Label

Switch provides `aria-label` via locale by default, ensuring screen readers can read it correctly. When a more specific description is needed, customize it through the `ariaLabel` prop. Falls back to `t('switch.toggle')` when not provided.

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const sync = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Switch v-model="sync" aria-label="Auto-sync data" />
        <Label>Auto sync</Label>
    </div>
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `boolean \| null` | — | Current value, supports `v-model` (controlled mode) |
| `defaultValue` | `boolean` | — | Initial checked state in uncontrolled mode |
| `defaultChecked` | `boolean` | — | Alias for `defaultValue` (initial checked state in uncontrolled mode) |
| `disabled` | `boolean` | `false` | Whether disabled |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger'` | `'default'` | Color variant |
| `shape` | `'slider' \| 'rocker'` | `'slider'` | Mechanical shape variant |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size |
| `showLabels` | `boolean` | `false` | Whether to show industrial I/O markings inside the track |
| `ariaLabel` | `string` | Locale default (`switch.toggle`) | Accessibility label text |
| `sound` | `boolean` | `false` | Explicitly enable mechanical relay click sound on toggle |
| `class` | `string` | `undefined` | Custom style class |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `(value: boolean)` | Triggered when value changes |

## Accessibility

- **Keyboard**: Supports `Space` / `Enter` to toggle switch state
- **ARIA attributes**: Automatically manages `role="switch"` and `aria-checked`; provides `aria-label` via locale by default
- **Focus management**: Focusable via Tab key, uses `--brutal-ring` token for visible focus ring
- **Label isolation**: `showLabels` markings carry `aria-hidden="true"`, preventing screen reader pollution

