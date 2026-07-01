---
title: Carousel
description: High-performance carousel component based on Embla Carousel, supporting autoplay, looping, dot navigation, and neo-brutalist visual style.
translated: true
---

# Carousel

A touch-friendly carousel powered by Embla Carousel, featuring smooth physics-based swipe inertia, suitable for image galleries, product showcases, feature introductions, and more.

## Demo

<ComponentPreview>
  <CarouselDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="carousel" />

## Usage

```vue
<script setup>
import { Carousel, CarouselItem } from 'brutx-ui-vue'
</script>

<template>
    <Carousel :loop="true" :autoplay="true" :autoplay-delay="3000" size="md">
        <CarouselItem>
            <div class="w-full h-full flex items-center justify-center bg-brutal-primary border-3 border-brutal">
                Slide 1
            </div>
        </CarouselItem>
        <CarouselItem>
            <div class="w-full h-full flex items-center justify-center bg-brutal-secondary border-3 border-brutal">
                Slide 2
            </div>
        </CarouselItem>
    </Carousel>
</template>
```

## Sizes

| Size | Description |
|------|------|
| `sm` | Small size |
| `md` | Medium size |
| `lg` | Large size |
| `full` | Full-screen height |
| `default` | Default size |

## Sub-components

| Component | Description |
|------|------|
| `Carousel` | Carousel container, manages scroll logic and navigation controls |
| `CarouselItem` | Single slide container |
| `CarouselEnhanced` | Enhanced carousel with thumbnails, autoplay indicators, and parallax effects |

## Composables

The internal logic of the `Carousel` component has been extracted into a standalone `useCarousel` composable, which can be used independently to build fully custom carousel UIs. It wraps `embla-carousel-vue` with built-in autoplay, loop control, selected index tracking, and automatically respects the `prefers-reduced-motion` system preference (stops autoplay and disables transition animations when reduced motion is enabled).

```ts
import { useCarousel } from 'brutx-ui-vue'
import type { UseCarouselOptions } from 'brutx-ui-vue'

const options: UseCarouselOptions = {
    loop: true,
    autoplay: true,
    autoplayDelay: 3000,
}

const {
    emblaRef,        // Ref to bind to the carousel container
    selectedIndex,   // Currently selected slide index
    scrollSnaps,     // All scroll snap points
    canScrollPrev,   // Whether scrolling backward is possible
    canScrollNext,   // Whether scrolling forward is possible
    scrollPrev,      // Scroll to the previous slide
    scrollNext,      // Scroll to the next slide
    scrollTo,        // Scroll to a specific index
    startAutoplay,   // Start autoplay
    stopAutoplay,    // Stop autoplay
} = useCarousel(options)
```

### Options

| Prop | Type | Default | Description |
|------|------|--------|------|
| `loop` | `MaybeRefOrGetter<boolean \| undefined>` | `false` | Whether to enable loop scrolling |
| `autoplay` | `MaybeRefOrGetter<boolean \| undefined>` | `false` | Whether to enable autoplay |
| `autoplayDelay` | `MaybeRefOrGetter<number \| undefined>` | `3000` | Autoplay interval in milliseconds |

### Return Values

| Prop | Type | Description |
|------|------|------|
| `emblaRef` | `Ref<HTMLElement \| undefined>` | Ref to bind to the carousel container (pass to the container element in `<template>`) |
| `selectedIndex` | `Ref<number>` | Currently selected slide index |
| `scrollSnaps` | `Ref<number[]>` | All scrollable snap positions |
| `canScrollPrev` | `ComputedRef<boolean>` | Whether scrolling backward is possible (in non-loop mode, `false` when at the first slide) |
| `canScrollNext` | `ComputedRef<boolean>` | Whether scrolling forward is possible (in non-loop mode, `false` when at the last slide) |
| `scrollPrev()` | `() => void` | Scroll to the previous slide |
| `scrollNext()` | `() => void` | Scroll to the next slide |
| `scrollTo(index)` | `(index: number) => void` | Scroll to the specified index |
| `startAutoplay()` | `() => void` | Start autoplay (controlled by `autoplay` option and reduced motion preference) |
| `stopAutoplay()` | `() => void` | Stop autoplay |

> Note: `useCarousel` registers Embla events internally in `onMounted` and cleans up listeners and timers in `onUnmounted`. It must be called at the top level of `setup`.

## Programmatic Control

Carousel exposes a set of methods and state via `defineExpose`, allowing you to actively control the carousel's scrolling and read its current state from the parent component through a component `ref`, without needing to take over the Embla instance yourself.

```vue
<script setup>
import { ref } from 'vue'
import { Carousel, CarouselItem } from 'brutx-ui-vue'

const carouselRef = ref()
</script>

<template>
    <Carousel ref="carouselRef" :loop="true">
        <CarouselItem v-for="i in 5" :key="i">
            <div class="w-full h-full flex items-center justify-center">Slide {{ i }}</div>
        </CarouselItem>
    </Carousel>

    <div class="flex gap-2 mt-4">
        <button @click="carouselRef?.scrollPrev()">Previous</button>
        <button @click="carouselRef?.scrollNext()">Next</button>
        <button @click="carouselRef?.scrollTo(0)">Go to first</button>
    </div>
</template>
```

### Exposed API

| Method/Property | Type | Description |
|-----------|------|------|
| `scrollPrev` | `() => void` | Scroll to the previous slide |
| `scrollNext` | `() => void` | Scroll to the next slide |
| `scrollTo` | `(index: number) => void` | Scroll to the slide at the specified index |
| `selectedIndex` | `ComputedRef<number>` | Currently selected slide index (read-only reactive) |
| `canScrollPrev` | `ComputedRef<boolean>` | Whether scrolling backward is possible; always `true` when `loop` is enabled (read-only reactive) |
| `canScrollNext` | `ComputedRef<boolean>` | Whether scrolling forward is possible; always `true` when `loop` is enabled (read-only reactive) |

> Note: `selectedIndex`, `canScrollPrev`, and `canScrollNext` are reactive `ComputedRef` values. They auto-unwrap when used directly in `<template>`; in `<script setup>`, access them via `.value`.

## Props

### Carousel

| Prop | Type | Default | Description |
|------|------|--------|------|
| `loop` | `boolean` | `false` | Whether to enable loop scrolling |
| `autoplay` | `boolean` | `false` | Whether to enable autoplay |
| `autoplayDelay` | `number` | `3000` | Autoplay interval in milliseconds |
| `showArrows` | `boolean` | `true` | Whether to show left/right navigation arrows |
| `showDots` | `boolean` | `true` | Whether to show bottom dot navigation |
| `size` | `'sm' \| 'md' \| 'lg' \| 'full' \| 'default'` | `'default'` | Carousel container height preset |
| `class` | `string` | — | Root node custom style class |

### CarouselItem

| Prop | Type | Default | Description |
|------|------|--------|------|
| `class` | `string` | — | Single slide container custom style class |

## Slots

### Carousel

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Default slot for placing `CarouselItem` components |

### CarouselItem

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Default slot for placing slide content |

## CarouselEnhanced

`CarouselEnhanced` extends `Carousel` with **thumbnail navigation**, **autoplay indicators** (progress bar / dots / fraction), and **parallax animation** effects, suitable for image galleries, product showcases, and other scenarios requiring richer interaction.

### Demo

<ComponentPreview>
  <CarouselEnhancedDemo />
</ComponentPreview>

### Usage

```vue
<script setup>
import { CarouselEnhanced, CarouselItem } from 'brutx-ui-vue'
</script>

<template>
    <CarouselEnhanced
        :loop="true"
        :autoplay="true"
        :autoplay-delay="3000"
        size="md"
        :thumbnails="{ show: true, position: 'bottom', size: 'sm', gap: 8, highlightCurrent: true }"
        :autoplay-indicator="{ type: 'progress', position: 'top', pauseOnHover: true }"
        :parallax="{ enabled: true, scale: 1.05, opacity: true, duration: 400 }"
    >
        <CarouselItem v-for="slide in slides" :key="slide.label">
            <div class="w-full h-full flex items-center justify-center">{{ slide.label }}</div>
        </CarouselItem>
    </CarouselEnhanced>
</template>
```

### Base Props

Inherits all Props from `Carousel` (`loop`/`autoplay`/`autoplayDelay`/`showArrows`/`showDots`/`size`/`class`). The following are enhanced-exclusive Props:

| Prop | Type | Default | Description |
|------|------|--------|------|
| `thumbnails` | `CarouselThumbnails` | `{ show: false, position: 'bottom', size: 'sm', gap: 8, highlightCurrent: true }` | Thumbnail navigation config |
| `autoplayIndicator` | `AutoplayIndicator` | — | Autoplay indicator config |
| `parallax` | `ParallaxEffect` | — | Parallax animation config |

### CarouselThumbnails

| Prop | Type | Default | Description |
|------|------|--------|------|
| `show` | `boolean` | `false` | Whether to show thumbnails |
| `position` | `'bottom' \| 'left' \| 'right'` | `'bottom'` | Thumbnail position |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Thumbnail size |
| `gap` | `number` | `8` | Thumbnail gap in pixels |
| `highlightCurrent` | `boolean` | `true` | Whether to highlight the current thumbnail |

### AutoplayIndicator

| Prop | Type | Default | Description |
|------|------|--------|------|
| `type` | `'progress' \| 'dots' \| 'fraction'` | —(required) | Indicator type: progress bar / dots / fraction |
| `position` | `'top' \| 'bottom'` | — | Indicator position |
| `pauseOnHover` | `boolean` | — | Pause autoplay on mouse hover |

### ParallaxEffect

| Prop | Type | Default | Description |
|------|------|--------|------|
| `enabled` | `boolean` | `false` | Whether to enable parallax animation |
| `scale` | `number` | `1.1` | Slide scale ratio |
| `opacity` | `boolean` | `false` | Whether to enable opacity transition |
| `duration` | `number` | `300` | Animation duration in milliseconds |
| `easing` | `string` | `'ease-out'` | CSS easing function |

### Exposed API

`CarouselEnhanced` exposes the same methods and state as `Carousel` via `defineExpose`, plus autoplay control:

| Method/Property | Type | Description |
|-----------|------|------|
| `scrollPrev` | `() => void` | Scroll to the previous slide |
| `scrollNext` | `() => void` | Scroll to the next slide |
| `scrollTo` | `(index: number) => void` | Scroll to the slide at the specified index |
| `selectedIndex` | `ComputedRef<number>` | Currently selected slide index (read-only reactive) |
| `canScrollPrev` | `ComputedRef<boolean>` | Whether scrolling backward is possible |
| `canScrollNext` | `ComputedRef<boolean>` | Whether scrolling forward is possible |
| `startAutoplay` | `() => void` | Start autoplay |
| `stopAutoplay` | `() => void` | Stop autoplay |

### Slots

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Default slot for placing `CarouselItem` components |
| `thumbnail` | `{ index: number, scrollTo: (index: number) => void }` | Custom thumbnail rendering; uses default numbered thumbnails when not provided |

## Accessibility

- **ARIA attributes**: Left/right arrow buttons have `aria-label`; dot navigation buttons have `aria-label`
- **Focus management**: Keyboard focus management is natively supported by Embla
- **Motion degradation**: The component respects the `prefers-reduced-motion` system setting. When the user enables "reduce motion" (monitored by the internal `useCarousel` composable via `useReducedMotion`):
  - **Stops autoplay**: `autoplay` no longer triggers, and existing timers are cleared
  - **Disables transition animations**: Via `emblaApi.reInit({ duration: 0 })`, slide transitions jump directly without swipe inertia
  - **Real-time response**: Changes take effect immediately without remounting the component; restoring default settings restores transition duration and resumes playback when `autoplay` is enabled

The hover-to-pause / leave-to-resume interaction logic is preserved in motion degradation mode, but since autoplay is already stopped, the hover behavior has no additional side effects.

## FAQ

**Q: Why doesn't the arrow button state change after enabling `loop`?**

A: When `loop` is set to `true`, `canScrollPrev` and `canScrollNext` are always `true` because you can always continue scrolling in loop mode. This is expected behavior, and the arrow buttons remain always enabled.

**Q: Autoplay doesn't work on certain devices. What's the cause?**

A: The component automatically respects the system's "reduce motion" preference. If the user has enabled "reduce motion" in their system settings, autoplay will be disabled. Additionally, autoplay pauses when the page is not visible and resumes when the page becomes active again.

**Q: How do I execute custom logic when the carousel transitions?**

A: After obtaining the component instance via `ref`, you can watch for changes to `selectedIndex`. You can also use the `useCarousel` composable to build your own carousel UI, which exposes the full Embla event interface for registering `select`, `scroll`, and other event callbacks.
