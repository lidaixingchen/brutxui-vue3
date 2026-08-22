---
title: ImageCard
description: Polaroid-style image card with a solid hard-edged frame and hard shadow, built-in aspect ratio locking and a high-contrast label footer.
---

# ImageCard

A polaroid-style image display card: the image area locks its geometry with a fixed aspect ratio, while the label footer renders as a solid theme-colored band separated by a thick black rule. The whole card lifts on hover with a hard, blur-free shadow, following the library's unified interaction language.

## Preview

<ComponentPreview>
  <ImageCardDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="image-card" />

## Usage

### Basic Usage

```vue
<script setup>
import { ImageCard } from 'brutx-ui-vue'
</script>

<template>
    <ImageCard
        class="max-w-xs"
        src="/images/field-record.jpg"
        alt="Field record photo"
        title="Field Record 001"
        description="The whole card lifts on hover with a hard shadow."
    />
</template>
```

### Aspect Ratio & Footer Accent

`aspect` locks the image geometry; `accent` picks the footer color family.

```vue
<template>
    <ImageCard
        src="/images/archive.jpg"
        alt="Archived material"
        aspect="square"
        accent="destructive"
        title="Aspect Square"
    />
</template>
```

### Custom Footer Slot

The default slot replaces the title/description structure for free-form footer content.

```vue
<template>
    <ImageCard src="/images/archive.jpg" alt="Archived material">
        <div class="flex items-center justify-between font-mono text-xs font-bold uppercase">
            <span>Archive / 1998</span>
            <span>[ CONFIDENTIAL ]</span>
        </div>
    </ImageCard>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | *(required)* | Image source URL |
| `alt` | `string` | `''` | Alternative text; an empty string marks the image as decorative |
| `aspect` | `'4/3' \| 'video' \| 'square'` | `undefined` | Image area aspect ratio; `video` is 16:9 |
| `accent` | `'primary' \| 'secondary' \| 'accent' \| 'destructive' \| 'success' \| 'info' \| 'muted'` | `undefined` | Footer color family |
| `title` | `string` | `undefined` | Footer title in monospace uppercase |
| `description` | `string` | `undefined` | Footer description text |
| `class` | `ClassValue` | `undefined` | Custom CSS class name |

## Slots

| Slot | Description |
|------|-------------|
| `default` | Replaces the footer's default title/description structure |

::: tip Frameless-footer mode
When neither `title` nor `description` is provided and no default slot content exists, `<figcaption>` is skipped and the component degrades to a pure framed image.
:::

## Accessibility

- **Alternative text**: informative images must provide `alt`; pass an empty string for purely decorative images so screen readers skip them.
- **Semantic structure**: the root is a `<figure>` and the footer a `<figcaption>`, preserving native image/caption semantics.
- **Motion degradation**: the hover lift transition is the only animation and follows the global reduced-motion policy.
