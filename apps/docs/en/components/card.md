---
title: Card
description: Card container component with multiple padding options and composable header, title, description, and footer blocks.
translated: true
---

# Card

A neo-brutalist card container supporting 6 variants and composable sub-components for structured content presentation.

## Demo

<ComponentPreview>
  <CardDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="card" />

## Usage

```vue
<script setup>
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from 'brutx-ui-vue'
</script>

<template>
    <Card variant="default">
        <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Add a new payment method to your account.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Card content goes here.</p>
        </CardContent>
        <CardFooter>
            <Button variant="primary">Save</Button>
        </CardFooter>
    </Card>
</template>
```

## Variants

| Variant | Description |
|------|------|
| `default` | Standard shadow |
| `elevated` | Large shadow for emphasis |
| `flat` | No shadow |
| `interactive` | Shadow with hover lift effect and pointer cursor |
| `primary` | Primary color shadow and border |
| `secondary` | Secondary color shadow and border |

## Padding

| Padding | Value |
|--------|----|
| `none` | `p-0` |
| `sm` | `p-3` |
| `default` | `p-5` |
| `lg` | `p-8` |

## Template Recipes

Compose new card templates directly from the `Card` sub-components.

### Article Card

```vue
<Card variant="interactive" padding="none">
    <CardHeader>
        <Badge variant="accent" size="sm">Vue 3</Badge>
        <CardTitle>Getting Started with BrutxUI</CardTitle>
        <CardDescription>Build bold interfaces with composable primitives.</CardDescription>
    </CardHeader>
    <CardFooter>
        <Button variant="link">Read more</Button>
    </CardFooter>
</Card>
```

### File Card

```vue
<Card>
    <CardHeader>
        <CardTitle>report-2026.pdf</CardTitle>
        <CardDescription>PDF · 3.2 MB</CardDescription>
    </CardHeader>
    <CardFooter>
        <Button variant="outline" size="sm">Download</Button>
    </CardFooter>
</Card>
```

### Testimonial Card

```vue
<Card variant="elevated">
    <CardContent>
        <p class="font-bold">“This product changed our workflow.”</p>
    </CardContent>
    <CardFooter>
        <span class="text-sm font-black">Alex Chen · Product Manager</span>
    </CardFooter>
</Card>
```

## Sub-components

| Component | Description |
|------|------|
| `Card` | Root container, supports variant and padding props |
| `CardHeader` | Header area with bottom padding |
| `CardTitle` | Bold title text with letter spacing |
| `CardDescription` | Muted description text |
| `CardContent` | Main content area |
| `CardFooter` | Footer area with flex layout |

## Props

### Card

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'elevated' \| 'flat' \| 'interactive' \| 'primary' \| 'secondary'` | `'default'` | Card variant type |
| `padding` | `'none' \| 'sm' \| 'default' \| 'lg'` | `'default'` | Card padding |
| `interactive` | `boolean` | `false` | Whether clickable, adds `role="button"`, `tabindex="0"` and keyboard support |
| `class` | `string` | — | Custom CSS class |

### Card Events

| Event | Description |
| --- | --- |
| `activate` | Triggered when `interactive=true` (or `variant="interactive"`), fired on click or Enter/Space key press, returning the native `Event` object |

### CardTitle

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `'h3'` | Rendered HTML element |
| `class` | `string` | — | Custom CSS class |

### CardHeader / CardDescription / CardContent / CardFooter

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `class` | `string` | — | Custom CSS class |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Default slot for all components, used to insert content |

## Accessibility

- **Semantic structure**: `CardTitle` renders as an `h3` heading element by default, customizable to an appropriate heading level via the `as` prop
- **Interactive feedback**: The `interactive` variant provides hover effects; it is recommended to use it with keyboard focus styles
- **Clickable cards**: Setting the `interactive` prop (or using `variant="interactive"`) adds `role="button"` and `tabindex="0"` to the card, with Enter/Space key support to trigger the `activate` event (dispatching native event parameter)
- **Content organization**: The `CardHeader`, `CardContent`, and `CardFooter` sub-components provide a clear content structure, making it easier for assistive technologies to understand the page layout

### Clickable Card

Use the `interactive` prop to make a card clickable, automatically adding pointer cursor and hover lift effect:

```vue
<script setup>
import { Card, CardContent, CardTitle } from 'brutx-ui-vue'

function handleClick(event) {
    console.log('Card activated!', event)
}
</script>

<template>
    <Card interactive @activate="handleClick">
        <CardContent>
            <CardTitle>Click me!</CardTitle>
            <p>This card is interactive and supports keyboard navigation.</p>
        </CardContent>
    </Card>
</template>
```
