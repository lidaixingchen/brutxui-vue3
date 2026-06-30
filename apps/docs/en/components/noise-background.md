---
title: NoiseBackground
description: A noise texture background component based on SVG feTurbulence filter, supporting animation effects and various configurations.
translated: true
---

# NoiseBackground

A Neo-Brutalism style noise texture background component that uses the SVG `<feTurbulence>` filter to generate noise effects. Suitable for card backgrounds, page decorations, retro-style designs, and more.

## Demo

<ComponentPreview>
    <NoiseBackgroundDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="noise-background" />

## Usage

```vue
<script setup>
import { NoiseBackground } from 'brutx-ui-vue'
</script>

<template>
    <NoiseBackground :opacity="0.3">
        <div class="p-8">
            <h2>Content with noise background</h2>
            <p>Noise texture adds character to the design.</p>
        </div>
    </NoiseBackground>
</template>
```

### Animation Effects

```vue
<template>
    <NoiseBackground
        :opacity="0.5"
        animated
        :animation-duration="3"
        :animation-range="0.3"
    >
        <div class="p-8 text-center">
            <h2>Animated noise background</h2>
        </div>
    </NoiseBackground>
</template>
```

### Custom Noise Types

```vue
<template>
    <!-- Fractal noise (default) -->
    <NoiseBackground type="fractalNoise" :frequency="0.65" :opacity="0.6">
        <div class="p-4">Fractal noise</div>
    </NoiseBackground>

    <!-- Turbulence -->
    <NoiseBackground type="turbulence" :frequency="0.05" :opacity="0.6">
        <div class="p-4">Turbulence effect</div>
    </NoiseBackground>
</template>
```

### Rounded Variants

```vue
<template>
    <NoiseBackground rounded="default" :opacity="0.3">
        <div class="p-6">Rounded card</div>
    </NoiseBackground>

    <NoiseBackground rounded="lg" :opacity="0.3">
        <div class="p-6">Large rounded card</div>
    </NoiseBackground>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'fractalNoise' \| 'turbulence'` | `'fractalNoise'` | Noise type |
| `frequency` | `number` | `0.65` | Noise frequency (0-1) |
| `octaves` | `number` | `3` | Number of noise octaves (higher = more complex) |
| `opacity` | `number` | `0.5` | Noise opacity (0-1) |
| `animated` | `boolean` | `false` | Whether to enable animation effects |
| `animationDuration` | `number` | `8` | Animation cycle duration (seconds) |
| `animationRange` | `number` | `0.1` | Animation frequency variation range |
| `rounded` | `'none' \| 'default' \| 'lg' \| 'full'` | `'none'` | Rounded variant |
| `class` | `string` | — | Custom CSS class |

## Slots

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | — | Nested content displayed above the noise background |

## Noise Type Reference

| Type | Description | Use Cases |
|------|-------------|-----------|
| `fractalNoise` | Fractal noise, soft and natural | General backgrounds, card decorations |
| `turbulence` | Turbulence effect, more pronounced texture | Special effects, artistic styles |

## Accessibility

- **Reduced motion**: The component respects the `prefers-reduced-motion` system setting. When the user enables "Reduce motion" (detected via `useReducedMotion` listening for `prefers-reduced-motion: reduce`):
  - **Animation frames stop**: `startAnimation` returns immediately without starting the `requestAnimationFrame` loop; if the animation is already running, it is stopped via `cancelAnimationFrame`.
  - **Single-frame static rendering retained**: The SVG `<feTurbulence>` still renders one static frame of noise using the initial `frequency` value. The background texture does not disappear entirely; it simply stops changing over time.
  - **Real-time response**: The component automatically switches when the preference changes. If the default is restored and `animated` is `true`, the animation restarts.
- This mechanism ensures the component does not continuously consume CPU resources on low-performance devices or for users sensitive to motion.

## Customization

### Rounded Variant CSS Classes

| Variable | CSS Class |
|----------|-----------|
| `none` | `rounded-none` |
| `default` | `rounded-brutal` |
| `lg` | `rounded-brutal-lg` |
| `full` | `rounded-full` |

## FAQ

**Q: What is the technical implementation of this component?**

A: The component uses the SVG `<feTurbulence>` filter to generate noise (best performance). Animation is achieved by periodically modifying the `baseFrequency` attribute via JavaScript. The component uses Vue refs to reference SVG elements, avoiding direct DOM manipulation. It supports SSR environments (animation only starts on the client side), and automatically cleans up animation frames when the component is unmounted to prevent memory leaks.

**Q: Are there any caveats when using this component?**

A: Please note the following:
- SVG filters may have performance issues on some low-end devices; consider providing a fallback.
- In animation mode, CPU resources are continuously consumed; use with caution in scenarios with many instances.
- A higher `frequency` value produces denser noise; a lower value produces sparser noise.
- A higher `octaves` value produces richer noise detail, but also increases performance overhead.
