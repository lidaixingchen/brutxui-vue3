---
title: Slider
description: A sliding input component for continuous value range adjustment or drag input.
translated: true
---

# Slider

A neo-brutalist style slider built on top of reka-ui's Slider primitive, with v-model support.

## Demo

<ComponentPreview>
  <SliderDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="slider" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { Slider } from 'brutx-ui-vue'

const value = ref([50])
</script>

<template>
    <Slider v-model="value" :max="100" :step="1" />
</template>
```

### Range Slider

```vue
<script setup>
import { ref } from 'vue'
import { Slider } from 'brutx-ui-vue'

const range = ref([25, 75])
</script>

<template>
    <Slider v-model="range" :max="100" :step="1" />
</template>
```

### With Min/Max

```vue
<script setup>
import { ref } from 'vue'
import { Slider } from 'brutx-ui-vue'

const value = ref([500])
</script>

<template>
    <Slider v-model="value" :min="0" :max="1000" :step="50" />
</template>
```

### Disabled State

```vue
<template>
    <Slider v-model="value" disabled />
</template>
```

### Orientation

Use the `orientation` prop to switch between horizontal (`horizontal`) or vertical (`vertical`) layout. This prop is passed through to the reka-ui primitive. Vertical mode requires a height to be set on the container.

```vue
<template>
    <div class="h-48">
        <Slider v-model="value" orientation="vertical" />
    </div>
</template>
```

### Tick Marks

Pass a numeric array to the `marks` prop to render tick marks at the corresponding positions on the track.

```vue
<template>
    <Slider v-model="value" :marks="[0, 25, 50, 75, 100]" />
</template>
```

### Tooltip on Drag

Enable `showTooltip` to display the current value near the thumb when dragging or hovering.

```vue
<template>
    <Slider v-model="value" show-tooltip />
</template>
```

## API Reference

<ComponentApi name="slider" />

## Accessibility

- **Keyboard**: Supports arrow keys to adjust the value, `Home` / `End` to jump to min/max
- **ARIA Attributes**: Automatically manages `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-orientation`, etc.
- **Focus Management**: The slider can be focused via the Tab key

## Exposed Methods (defineExpose)

Use a component ref to call `setValue` and request a new slider value from the parent:

```vue
<script setup>
import { ref } from 'vue'
import { Slider } from 'brutx-ui-vue'

const sliderRef = ref(null)
const value = ref([50])

function resetToCenter() {
    sliderRef.value?.setValue([50])
}
</script>

<template>
    <Slider ref="sliderRef" v-model="value" />
    <button @click="resetToCenter">Reset</button>
</template>
```
