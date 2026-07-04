---
title: Image
description: Neo-brutalist image component with lazy loading, fallback, and a full-featured preview viewer.
translated: true
---

# Image

Neo-brutalist image display component with IntersectionObserver lazy loading, fallback image support, and a full-screen preview modal featuring zoom, rotate, flip, and drag interactions — all wrapped in bold borders, hard shadows, and diagonal stripe placeholder backgrounds.

## Demo

<ComponentPreview>
  <ImageDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="image" />

## Usage

### Basic Usage

Pass `src` and `alt` to render an image. Use `fit` to control how the image fills its container:

```vue
<script setup>
import { Image } from 'brutx-ui-vue'
</script>

<template>
    <Image src="/photo.jpg" alt="Sample image" fit="cover" class="w-64 h-48" />
</template>
```

### Lazy Loading

Set `loading="lazy"` to defer image loading until the element enters the viewport via IntersectionObserver:

```vue
<template>
    <Image src="/large-photo.jpg" alt="Lazy loaded image" loading="lazy" class="w-full h-64" />
</template>
```

### Fallback Image

When the primary image fails to load, the component automatically switches to the `fallback` URL:

```vue
<template>
    <Image
        src="/broken-url.jpg"
        alt="Fallback demo"
        fallback="/fallback.jpg"
        class="w-64 h-48"
    />
</template>
```

### Image Preview

Enable `preview` and provide a `previewSrcList` to open a full-screen preview modal when clicking the image:

```vue
<script setup>
import { Image } from 'brutx-ui-vue'

const images = ['/photo1.jpg', '/photo2.jpg', '/photo3.jpg']
</script>

<template>
    <div class="flex gap-4">
        <Image
            v-for="img in images"
            :key="img"
            :src="img"
            :alt="img"
            :preview="true"
            :preview-src-list="images"
            class="w-32 h-32"
        />
    </div>
</template>
```

The preview modal supports the following interactions:
- Zoom in / zoom out (via toolbar buttons, step controlled by `zoomRate`)
- Rotate left / right by 90°
- Horizontal flip
- Mouse drag to pan the image
- `ArrowLeft` / `ArrowRight` to navigate between images
- `Escape` to close the preview
- Set `hideOnClickModal` to `true` to close by clicking the backdrop

### Custom Placeholder and Error Slots

Use the `placeholder` and `error` slots to customize loading and failure states:

```vue
<template>
    <Image src="/photo.jpg" alt="Custom slots example" class="w-64 h-48">
        <template #placeholder>
            <div class="absolute inset-0 flex items-center justify-center bg-brutal-muted">
                <span class="font-bold">Loading...</span>
            </div>
        </template>
        <template #error>
            <div class="absolute inset-0 flex items-center justify-center bg-brutal-destructive/10">
                <span class="text-brutal-destructive font-bold">Failed to load</span>
            </div>
        </template>
    </Image>
</template>
```

## Data Types

```ts
type ImageFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
```

| Value | Description |
|-------|-------------|
| `'fill'` | Stretches to fill the container without preserving aspect ratio |
| `'contain'` | Scales to fit within the container while preserving aspect ratio |
| `'cover'` | Scales to fill the container while preserving aspect ratio (may crop) |
| `'none'` | Preserves the original size |
| `'scale-down'` | Like `contain`, but never scales up beyond the original size |

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | — | Image URL (required) |
| `alt` | `string` | `''` | Alternative text |
| `fit` | `'fill' \| 'contain' \| 'cover' \| 'none' \| 'scale-down'` | `'cover'` | Image fill mode, maps to CSS `object-fit` |
| `previewSrcList` | `string[]` | `[]` | List of image URLs for the preview viewer; enables navigation between images |
| `initialIndex` | `number` | `0` | Initial image index when opening the preview |
| `hideOnClickModal` | `boolean` | `false` | Whether clicking the backdrop closes the preview |
| `zoomRate` | `number` | `1.2` | Multiplier applied per zoom step |
| `preview` | `boolean` | `false` | Whether to enable the full-screen preview viewer |
| `fallback` | `string` | — | Fallback image URL used when the primary image fails to load |
| `loading` | `'eager' \| 'lazy'` | `'eager'` | Loading strategy; `lazy` uses IntersectionObserver to defer loading until the element is visible |

## Events

| Event | Parameters | Description |
| --- | --- | --- |
| `load` | `event: Event` | Emitted when the image finishes loading successfully |
| `error` | `event: Event` | Emitted when the image fails to load (also fires if the fallback image fails) |
| `show` | — | Emitted when the preview modal opens |
| `close` | — | Emitted when the preview modal closes |
| `switch` | `index: number` | Emitted when switching images in the preview; the parameter is the new image index |

## Slots

| Slot | Scope | Description |
| --- | --- | --- |
| `placeholder` | — | Content displayed while the image is loading. Defaults to a diagonal stripe background with "Loading..." text |
| `error` | — | Content displayed when the image fails to load. Defaults to a red diagonal stripe background with "Failed to load" text |

## Accessibility

- **Keyboard Navigation**: The preview modal supports `Escape` to close and `ArrowLeft` / `ArrowRight` to navigate between images
- **ARIA Attributes**: Close, previous, and next buttons in the preview modal all include `aria-label` attributes. Always provide meaningful `alt` text for screen readers and when images fail to load
- **Focus Management**: The preview modal uses reka-ui's `FocusScope` component with `trapped` and `loop` modes, preventing focus from escaping the modal

## FAQ

**Q: The image doesn't appear when `loading="lazy"` is set?**

A: Lazy loading relies on IntersectionObserver, which requires the component container to have definite dimensions (set via `class` or a parent container). If the container has zero dimensions, the IntersectionObserver callback will never fire.

**Q: How do I navigate between images in the preview?**

A: You need to pass a `previewSrcList` array. Inside the preview modal, you can navigate using the arrow buttons or keyboard arrow keys. If the list contains one or zero items, the navigation buttons are hidden.

**Q: What happens if the `fallback` image also fails to load?**

A: When the fallback image also fails, the component enters its error state, displays the `error` slot content (or the default error placeholder), and emits the `error` event.
