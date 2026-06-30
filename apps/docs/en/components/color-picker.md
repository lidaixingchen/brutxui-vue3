---
title: Color Picker
description: A neo-brutalist style color picker component supporting HEX/RGB/HSL formats, transparency, preset colors, and color history.
translated: true
---

# Color Picker

A neo-brutalist style color picker component built on reka-ui Popover. Supports HEX/RGB/HSL color formats, an alpha channel, a preset color palette, and locally stored color history.

## Demo

<ComponentPreview>
  <ColorPickerDemo />
</ComponentPreview>

The color picker provides a saturation/brightness selection area, a hue slider, an opacity slider, a HEX input, preset colors, and history.

## Installation

<InstallationTabs componentName="color-picker" />

## Usage

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import { ColorPicker } from 'brutx-ui-vue'

const color = ref(null)
</script>

<template>
    <ColorPicker v-model="color" placeholder="Select color" />
</template>
```

### Specifying Color Format

Supports `hex` (default), `rgb`, and `hsl` formats. `modelValue` outputs in the corresponding format:

```vue
<script setup>
import { ref } from 'vue'
import { ColorPicker } from 'brutx-ui-vue'

const color = ref(null)
</script>

<template>
    <ColorPicker v-model="color" format="rgb" />
    <ColorPicker v-model="color" format="hsl" />
</template>
```

### Alpha Channel

When `showAlpha` is enabled, the panel displays an opacity slider and the output value includes the alpha channel:

```vue
<template>
    <ColorPicker v-model="color" :show-alpha="true" />
</template>
```

### Preset Colors

Includes the Tailwind CSS default color palette out of the box, or you can customize presets:

```vue
<script setup>
import { ref } from 'vue'
import { ColorPicker } from 'brutx-ui-vue'

const color = ref(null)
const presets = [
    '#FF6B6B',
    '#4ECDC4',
    '#FFE66D',
    '#EF476F',
    '#7FB069',
]
</script>

<template>
    <ColorPicker v-model="color" :presets="presets" :show-presets="true" />
</template>
```

Presets also support an object format with labels (optional `disabled` field to disable individual swatches):

```vue
<script setup>
const presets = [
    { label: 'Coral Red', value: '#FF6B6B' },
    { label: 'Mint Green', value: '#4ECDC4' },
    { label: 'Deprecated', value: '#999999', disabled: true },
]
</script>
```

### Color History

When `showHistory` is enabled, user-selected colors are automatically recorded to history, stored in localStorage by default:

```vue
<template>
    <ColorPicker
        v-model="color"
        :show-history="true"
        :history-max="20"
        history-storage-key="my-app-color-history"
    />
</template>
```

### Clearable

```vue
<template>
    <ColorPicker v-model="color" :clearable="true" />
</template>
```

### Disabled State

```vue
<template>
    <ColorPicker v-model="color" disabled />
</template>
```

### Sizes

| Size | Description |
|------|-------------|
| `sm` | Small size |
| `default` | Default size |
| `lg` | Large size |

```vue
<template>
    <ColorPicker v-model="color" size="sm" />
    <ColorPicker v-model="color" size="default" />
    <ColorPicker v-model="color" size="lg" />
</template>
```

## Data Types

| Format | Example | Description |
|--------|---------|-------------|
| `hex` | `#FF6B6B` / `#FF6B6B80` | Hexadecimal (two extra digits when alpha is included) |
| `rgb` | `rgb(255, 107, 107)` / `rgba(255, 107, 107, 0.5)` | RGB function notation |
| `hsl` | `hsl(0, 100%, 71%)` / `hsla(0, 100%, 71%, 0.5)` | HSL function notation |

## Composables

The `ColorPicker` component's popup panel triggering, color format normalization, clearing, and confirmation logic has been extracted into a standalone `useColorPicker` composable. It can be used independently when you need to build a fully custom trigger or color palette. It manages panel open/close state, display value synchronization with `modelValue`, normalization to the target format, and triggers `open` / `close` / `change` / `update:modelValue` events through the provided `emit`.

```ts
import { useColorPicker } from 'brutx-ui-vue'
import type { UseColorPickerOptions } from 'brutx-ui-vue'

const emit = defineEmits<{
    'update:modelValue': [value: string | null]
    'change': [value: string | null]
    'open': []
    'close': []
}>()

const {
    open,                  // Whether the panel is open
    displayValue,          // Current displayed value in the panel
    normalizedDisplay,     // Display string normalized to the target format
    swatchStyle,           // Inline style for the trigger swatch
    handlePanelUpdate,     // Panel value update callback
    handlePanelConfirm,    // Panel confirm callback
    handlePanelClear,      // Panel clear callback
    handleClearClick,      // Trigger clear button click callback
    handleTriggerKeydown,  // Trigger keyboard event callback
} = useColorPicker({
    modelValue,
    format: 'hex',
    showAlpha: false,
    disabled: false,
    emit,
})
```

### Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `MaybeRefOrGetter<string \| null>` | `null` | Currently selected color (supports v-model) |
| `format` | `MaybeRefOrGetter<'hex' \| 'rgb' \| 'hsl'>` | `'hex'` | Color format |
| `showAlpha` | `MaybeRefOrGetter<boolean>` | `false` | Whether to support the alpha channel |
| `disabled` | `MaybeRefOrGetter<boolean>` | `false` | Whether disabled |
| `emit` | `ColorPickerEmit` | — | Event emitter function (required, type matches the component's emits) |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `open` | `Ref<boolean>` | Whether the panel is open |
| `displayValue` | `Ref<string \| null>` | Current displayed value in the panel |
| `normalizedDisplay` | `ComputedRef<string \| null>` | Display string normalized by `format` (`null` if unparseable) |
| `swatchStyle` | `ComputedRef<{ backgroundColor: string }>` | Inline style for the trigger swatch |
| `handlePanelUpdate(value)` | `(value: string \| null) => void` | Called when panel value updates; syncs `displayValue` and triggers `update:modelValue` |
| `handlePanelConfirm(value)` | `(value: string \| null) => void` | Called on panel confirm; triggers `update:modelValue` / `change` and closes the panel |
| `handlePanelClear()` | `() => void` | Called on panel clear; triggers `update:modelValue(null)` / `change(null)` |
| `handleClearClick(event)` | `(event: MouseEvent) => void` | Trigger clear button click callback; stops event propagation and clears |
| `handleTriggerKeydown(event)` | `(event: KeyboardEvent) => void` | Trigger keyboard event callback; `Enter` / `Space` opens the panel (no response when disabled) |

> Note: `emit` must be a function conforming to the `ColorPickerEmit` signature (i.e., the return value of the component's `defineEmits`). Color parsing and formatting are provided by `parseColor` / `formatColor` from `@/lib/color`.

## Programmatic Control

`ColorPicker` exposes an `open` reactive ref via `defineExpose`, allowing the parent component to programmatically open or close the color panel. `open` is a `Ref<boolean>` that is two-way bound to the internal Popover, and can be read or written directly.

```vue
<script setup>
import { ref } from 'vue'
import { ColorPicker } from 'brutx-ui-vue'

const pickerRef = ref()
const color = ref(null)
</script>

<template>
    <ColorPicker ref="pickerRef" v-model="color" />

    <button @click="pickerRef?.open = true">Open Panel</button>
    <button @click="pickerRef?.open = false">Close Panel</button>
</template>
```

### Exposed API

| Method/Property | Type | Description |
|-----------------|------|-------------|
| `open` | `Ref<boolean>` | Panel open/close state; readable and writable; set to `true` to open, `false` to close |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string \| null` | `null` | Selected color value, supports v-model |
| `format` | `'hex' \| 'rgb' \| 'hsl'` | `'hex'` | Color format |
| `showAlpha` | `boolean` | `false` | Whether to support the alpha channel |
| `presets` | `string[] \| ColorPreset[]` | — | Preset color list |
| `showPresets` | `boolean` | `true` | Whether to show preset colors |
| `presetsLabel` | `string` | — | Preset area label text |
| `showHistory` | `boolean` | `true` | Whether to show color history |
| `historyMax` | `number` | `8` | Maximum number of history entries |
| `historyStorageKey` | `string` | `'brutx-color-history'` | localStorage key for history |
| `showInput` | `boolean` | `true` | Whether to show the input field |
| `placeholder` | `string` | — | Placeholder text |
| `disabled` | `boolean` | `false` | Disabled state |
| `clearable` | `boolean` | `false` | Whether clearable |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Input size |
| `name` | `string` | — | Form field name |
| `id` | `string` | — | Component ID |
| `ariaLabel` | `string` | — | Accessibility label |
| `open` | `boolean` | — | Whether the panel is open, supports v-model:open two-way binding |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string \| null` | Triggered when the color changes |
| `change` | `string \| null` | Triggered when the panel closes and the value changes; also triggered by confirm/clear operations |
| `open` | — | Triggered when the panel opens |
| `close` | — | Triggered when the panel closes |
| `update:open` | `boolean` | Triggered when the panel open/close state changes; used with v-model:open |

## Accessibility

### Trigger

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open the panel (no response when disabled) |
| `Escape` | Close the panel |

### Saturation/Brightness Area

| Key | Action |
|-----|--------|
| `Left` / `Right` | Adjust saturation (step 1, Shift step 10) |
| `Up` / `Down` | Adjust brightness (step 1, Shift step 10) |

### Hue Slider

| Key | Action |
|-----|--------|
| `Left` / `Right` | Adjust hue (step 1, Shift step 15) |

### Opacity Slider

| Key | Action |
|-----|--------|
| `Left` / `Right` | Adjust opacity (step 0.01, Shift step 0.1) |

## FAQ

**Q: What happens to the previous `modelValue` format when switching `format`?**

A: The component automatically normalizes the existing color value to the format corresponding to the current `format`. For example, when switching from `hex` to `rgb`, the previous `#FF6B6B` is automatically converted to `rgb(255, 107, 107)`. No manual format conversion is needed.

**Q: Where is color history stored? How do I clear it?**

A: Color history is stored in the browser's `localStorage` by default, with the key controlled by the `historyStorageKey` prop (default: `'brutx-color-history'`). It can be cleared via the browser developer tools' Application panel, or programmatically with `localStorage.removeItem('brutx-color-history')`. Setting a different `historyStorageKey` allows maintaining independent histories for different use cases.

**Q: How does the output format change when `showAlpha` is enabled?**

A: When the alpha channel is enabled, the output value includes alpha information. The `hex` format becomes 8 digits (e.g., `#FF6B6B80`), `rgb` becomes `rgba()`, and `hsl` becomes `hsla()`. When `showAlpha` is disabled, the output reverts to the standard format without opacity.
