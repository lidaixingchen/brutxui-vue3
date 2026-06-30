---
title: Switch
description: Toggle switch component for quick true/false boolean state switching.
translated: true
---

# Switch

Neobrutalist-styled toggle switch built on reka-ui's Switch primitive, with v-model support.

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

### With Label

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const notifications = ref(true)
</script>

<template>
    <div class="flex items-center justify-between">
        <Label for="notifications">Email notifications</Label>
        <Switch v-model="notifications" />
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
| `modelValue` | `boolean` | — | Current value, supports `v-model` |
| `disabled` | `boolean` | `false` | Whether disabled |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger'` | `'default'` | Color variant |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size |
| `ariaLabel` | `string` | Locale default (`switch.toggle`) | Accessibility label text |
| `class` | `string` | — | Custom style class |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `boolean` | Triggered when value changes |

## Accessibility

- **Keyboard**: Supports `Space` / `Enter` to toggle switch state
- **ARIA attributes**: Automatically manages `role="switch"` and `aria-checked`; provides `aria-label` via locale by default
- **Focus management**: Focusable via Tab key, uses `--brutal-ring` token for visible focus ring
