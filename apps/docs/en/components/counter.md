---
title: Counter
description: Number scrolling animation component based on requestAnimationFrame, supporting easing functions, prefixes, suffixes, and thousand separators. Ideal for displaying statistics.
translated: true
---

# Counter

Pure native `requestAnimationFrame`-driven number easing animation with no third-party animation library dependency. Works great with Hero sections and Dashboard statistics displays.

## Demo

<ComponentPreview>
  <CounterDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="counter" />

## Usage

```vue
<script setup>
import { Counter } from 'brutx-ui-vue'
import { ref } from 'vue'

const counterRef = ref()
</script>

<template>
    <!-- Basic usage -->
    <Counter :to="12800" suffix="+" size="lg" />

    <!-- Decimal point -->
    <Counter :to="99.9" :decimals="1" suffix="%" />

    <!-- Manual control -->
    <Counter ref="counterRef" :to="500" :auto-start="false" />
    <button @click="counterRef.play()">Start</button>
</template>
```

### Custom Component Prefix/Suffix

```vue
<script setup>
import { Counter } from 'brutx-ui-vue'
import { DollarSign, Percent } from 'lucide-vue-next'
</script>

<template>
    <!-- Use component as prefix -->
    <Counter :to="12800" :prefix-component="DollarSign" />

    <!-- Use text as suffix -->
    <Counter :to="99.9" :decimals="1" suffix="%" />

    <!-- Mixed: component prefix + text suffix -->
    <Counter :to="500" :prefix-component="DollarSign" suffix="万" :animate-suffix="false" />
</template>
```

## Variants

`variant` only affects the number text color, making it easy to highlight statistics on different backgrounds. `accent` is a bright yellow that has low contrast on light backgrounds; use it on dark or colored backgrounds.

| Variant | Description |
|------|------|
| `default` | Standard foreground text |
| `primary` | Primary (coral) text |
| `accent` | Accent (yellow) text |
| `success` | Success (green) text |
| `danger` | Destructive (red) text |

```vue
<script setup>
import { Counter } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-wrap items-end gap-6">
        <Counter :to="128" variant="default" size="lg" />
        <Counter :to="128" variant="primary" size="lg" />
        <Counter :to="128" variant="accent" size="lg" />
        <Counter :to="128" variant="success" size="lg" />
        <Counter :to="128" variant="danger" size="lg" />
    </div>
</template>
```

## Sizes

| Size | Description |
|------|------|
| `sm` | Small font size |
| `md` | Default font size |
| `lg` | Large font size |
| `xl` | Extra large font size |

## Programmatic Control

Counter exposes the following methods via `defineExpose`, allowing parent components to call them through ref:

```vue
<script setup>
import { ref } from 'vue'
import { Counter } from 'brutx-ui-vue'

const counterRef = ref()
</script>

<template>
    <Counter ref="counterRef" :to="500" :auto-start="false" />
    <button @click="counterRef?.play()">Start</button>
    <button @click="counterRef?.stop()">Stop</button>
</template>
```


## API Reference

<span id="exposed-api"></span>

<ComponentApi name="counter" />

## Accessibility

- **ARIA Attributes**: Number content is accessible to screen readers
