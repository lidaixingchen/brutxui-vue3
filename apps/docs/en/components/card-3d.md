---
title: Card3D
description: 3D floating card with physics-based rotation deflection and inverse shadow projection on mouse hover.
translated: true
---

# Card3D

A neo-brutalist 3D interactive card that captures pointer offset relative to the card center to produce smooth 3D rotation deflection, with the shadow layer shifting in the opposite direction for a solid three-dimensional feel.

## Demo

<ComponentPreview>
  <Card3DDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="card-3d" />

## Usage

```vue
<script setup>
import { Card3D } from 'brutx-ui-vue'
</script>

<template>
    <Card3D class="w-full max-w-sm">
        <div class="p-6">
            <h3 class="text-lg font-black mb-2">3D Floating Card</h3>
            <p class="text-sm">Move your mouse over the card to experience the 3D physics deflection effect.</p>
        </div>
    </Card3D>
</template>
```

## Variants

### Shadow Variants

| Variant | Description |
|------|------|
| `default` | Standard shadow offset |
| `lg` | Large shadow offset |
| `xl` | Extra-large shadow offset |

### Color Variants

Control the card background and text color via the `variant` prop.

| Variant | Description |
|------|------|
| `default` | Background-colored background, dark text |
| `primary` | Primary (coral red) background |
| `accent` | Accent (yellow) background |
| `muted` | Muted (gray) background |

```vue
<Card3D variant="primary" class="w-full max-w-sm">
    <div class="p-6">
        <h3 class="text-lg font-black mb-2">Primary Card</h3>
    </div>
</Card3D>
```

## Clickable

Setting `clickable` to `true` changes the card cursor to `pointer` and triggers a `click` event on click.

```vue
<script setup>
import { Card3D } from 'brutx-ui-vue'

function handleClick(event) {
    console.log('Card clicked', event)
}
</script>

<template>
    <Card3D clickable class="w-full max-w-sm" @click="handleClick">
        <div class="p-6">Click me</div>
    </Card3D>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `maxRotation` | `number` | `15` | Maximum deflection angle (degrees) |
| `perspective` | `number` | `1000` | 3D perspective depth (px) |
| `scale` | `number` | `1.02` | Scale ratio on hover |
| `shadowOffset` | `number` | `10` | Maximum shadow physical displacement in pixels (px) |
| `shadow` | `'default' \| 'lg' \| 'xl'` | `'default'` | Shadow size variant |
| `variant` | `'default' \| 'primary' \| 'accent' \| 'muted'` | `'default'` | Card background color variant |
| `disabled` | `boolean` | `false` | Disables 3D effect, card stays static |
| `clickable` | `boolean` | `false` | Enables click; when true, cursor is pointer and click events are triggered |
| `class` | `string` | — | External class override |

## Events

| Event | Payload | Description |
|------|------|------|
| `click` | `MouseEvent` | Triggered when the card is clicked, only when `clickable` is `true` and `disabled` is `false` |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Card content, supports any custom content |

## Accessibility

- The component sets `role="group"` and provides `aria-label` via i18n (Chinese: `"3D Interactive Card"`, English: `"3D Interactive Card"`)
- When the user prefers `prefers-reduced-motion: reduce`, the 3D deflection effect is automatically disabled
- The 3D effect can be fully disabled via the `disabled` prop
