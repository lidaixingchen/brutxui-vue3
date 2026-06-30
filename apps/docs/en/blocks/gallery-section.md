---
title: Gallery Section
description: Neo-brutalist gallery display section with carousel component and image cards.
translated: true
---

# Gallery Section

A neo-brutalist gallery display section featuring a carousel component and image cards.

## Demo

<ComponentPreview>
  <GallerySectionDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="gallery-section" />

## Usage

```vue
<script setup>
import GallerySection from '@/components/ui/gallery-section/GallerySection.vue'

const items = [
    {
        src: '/images/photo1.jpg',
        alt: 'Photo 1',
        caption: 'Mountain landscape',
    },
    {
        src: '/images/photo2.jpg',
        alt: 'Photo 2',
        caption: 'Ocean sunset',
    },
    {
        src: '/images/photo3.jpg',
        alt: 'Photo 3',
    },
]

function handleItemClick(index) {
    console.log('Item clicked:', index)
}
</script>

<template>
    <GallerySection
        title="Gallery"
        :items="items"
        @item-click="handleItemClick"
    />
</template>
```

## Data Types

```ts
interface GalleryItem {
    src: string
    alt: string
    caption?: string
}
```

## Props

### GallerySection

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `gallerySection.defaultTitle` | Section title |
| `items` | `GalleryItem[]` | `[]` | Image list |
| `class` | `string` | — | Custom style class |

## Events

| Event | Payload | Description |
| ---- | ---- | ---- |
| `itemClick` | `[index: number]` | Triggered when an image is clicked |

## Slots

| Slot | Scope | Description |
| ---- | ---- | ---- |
| `header` | — | Custom title area |
| `default` | — | Custom main content area (replaces carousel) |
| `footer` | — | Bottom content |

## Accessibility

- **Keyboard**: Supports `Tab` to focus the carousel, left/right arrow keys to switch images
- **ARIA attributes**: Carousel uses `role="region"` and `aria-roledescription="carousel"`
- **Focus management**: Focus stays on the control when the carousel switches
- **Motion reduction**: Respects `prefers-reduced-motion` system setting, automatically disables or simplifies carousel animations
