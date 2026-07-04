---
title: Watermark
description: Watermark tiling component designed to cover sensitive areas with text/images, featuring robust built-in anti-tampering guards.
---

# Watermark

Overlay repetitive text or image watermark layers onto host containers. Designed with security precautions, the component intercepts style changes (e.g. `display: none`) or physical DOM node removal, automatically reconstructing pure watermark nodes in real-time.

## Preview

<ComponentPreview>
  <WatermarkDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="watermark" />

## Usage

### Basic Text Watermark

Wrap sensitive content within `<Watermark>`.

```vue
<script setup>
import { Watermark } from 'brutx-ui-vue'
</script>

<template>
    <Watermark content="CONFIDENTIAL INFO">
        <div class="confidential-doc">
            <h3>Internal Documents</h3>
            <p>Agreement details...</p>
        </div>
    </Watermark>
</template>
```

### Multi-line & Styling Customization

Pass an array to render multi-line text, and customize font sizing, angles, and gap grids.

```vue
<template>
    <Watermark
        :content="['CONFIDENTIAL', 'DEPT 01']"
        :rotate="-15"
        :gap="[120, 120]"
        :font="{ color: 'rgba(239, 68, 68, 0.12)', fontSize: 16, fontWeight: 'bold' }"
    >
        <div class="content-box">
            <p>Sensitive data details...</p>
        </div>
    </Watermark>
</template>
```

## Props

### Watermark

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | `number` | `120` | Single watermark box width |
| `height` | `number` | `64` | Single watermark box height |
| `rotate` | `number` | `-22` | Counter-clockwise angle rotation degrees |
| `zIndex` | `number` | `9` | Z-index layer depth |
| `image` | `string` | `undefined` | Source Image URL (Image takes precedence over text content) |
| `content` | `string \| string[]` | `''` | Text content (Supports array of strings for multi-lines) |
| `gap` | `[number, number]` | `[100, 100]` | Mesh grid gaps (gapX, gapY) |
| `offset` | `[number, number]` | `[0, 0]` | Canvas start-point alignment offsets (offsetX, offsetY) |
| `font` | `WatermarkFont` | *(See below)* | Text rendering font styles |

### WatermarkFont Type Definitions

```typescript
interface WatermarkFont {
    color?: string       // Color, defaults to 'rgba(0, 0, 0, 0.15)'
    fontSize?: number    // Font size, defaults to 14
    fontWeight?: string  // Font weight, defaults to 'normal'
    fontStyle?: string   // Font style, defaults to 'normal'
    fontFamily?: string  // Font family, defaults to 'sans-serif'
}
```

## Security Features

- **JSDOM SVG Fallback**: Automatically switches to drawing pure inline vector SVG watermarks if the renderer fails to initialize 2D Canvas contexts (e.g. under headless test setups), maintaining page structure validity.
- **Anti-tamper Guard**: Listens to changes using `MutationObserver` on the target nodes. Any external tampering of style strings or DOM element deletion will be reverted, rebuilding a pristine watermark layout inside 50ms.
