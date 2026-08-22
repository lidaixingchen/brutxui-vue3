---
title: BrutalShape
description: Pure SVG vector totem decoration component with 22 shapes across burst stars, industrial seals, HUD crosshairs, 8-bit pixels and glyphs.
---

# BrutalShape

A neo-brutalist decorative totem library rendered as inline SVG, providing corner stickers, seal badges and HUD calibration visuals for host elements such as cards, headings and buttons. All shapes inherit `fill`/`stroke` injected at the root and reference semantic tokens by default, staying in sync with theme presets and dark mode automatically.

## Preview

<ComponentPreview>
  <BrutalShapeDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="brutal-shape" />

## Usage

### Basic Totem

Pick a shape via `name` and control the rendered edge length (px) with `size`.

```vue
<script setup>
import { BrutalShape } from 'brutx-ui-vue'
</script>

<template>
    <BrutalShape name="star-8" :size="44" />
</template>
```

### Color & Stroke Customization

`color` and `stroke` accept any CSS color value. Setting `color` to `transparent` with a thicker `strokeWidth` yields an outline variant.

```vue
<template>
    <!-- Solid fill + hard stroke -->
    <BrutalShape name="lightning" :size="48" color="var(--brutal-primary)" stroke="var(--brutal-primary)" />

    <!-- Outline variant -->
    <BrutalShape name="diamond" :size="48" color="transparent" stroke="var(--brutal-fg)" :stroke-width="6" />
</template>
```

### Corner Sticker

Combine with absolute positioning for a sticker-over-corner effect. The root already declares `pointer-events-none`, so host interactions stay untouched.

```vue
<template>
    <div class="relative border-3 border-brutal p-6">
        <BrutalShape
            name="seal-badge"
            :size="52"
            class="absolute -right-4 -top-4 rotate-12"
        />
        <h4>Limited Edition</h4>
    </div>
</template>
```

## Shape Catalog

| Category | Names |
|----------|-------|
| Burst Stars | `star-4` · `star-5` · `star-6` · `star-8` · `star-12` · `star-16` |
| Industrial Seals | `seal-saw-16` · `seal-cog-8` · `seal-scallop-8` · `seal-badge` |
| Crosshairs | `crosshair-plus` · `crosshair-target` · `crosshair-corner` |
| Pixel Icons | `pixel-burst` · `pixel-heart` · `pixel-spark` |
| Glyphs | `lightning` · `heart` · `skull` · `thumb` · `diamond` |

Unknown names are skipped with a console warning.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | *(required)* | Shape name, see the catalog above |
| `size` | `number \| string` | `32` | Rendered edge length in px; the viewBox is a 100-unit coordinate system scaled uniformly |
| `color` | `string` | `var(--brutal-accent)` | Fill color, wired to semantic tokens by default |
| `stroke` | `string` | `var(--brutal-fg)` | Stroke color |
| `strokeWidth` | `number \| string` | `3` | Stroke width in viewBox units |
| `decorative` | `boolean` | `true` | Decorative marker: hidden from screen readers (`aria-hidden`) when `true`; supply text alternatives on the parent for semantic use |

## Accessibility

- **Decorative semantics**: hidden from screen readers by default via `decorative`; pass `:decorative="false"` when the shape conveys meaning and provide a text alternative on the parent.
- **Interaction transparency**: the root is `pointer-events-none`; hover/click events fully fall through to the host element.
- **Motion agnostic**: the component renders static vector graphics; rotation/scaling transforms are controlled by consumers and respect the global reduced-motion policy.
