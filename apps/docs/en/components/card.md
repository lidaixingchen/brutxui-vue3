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
| `class` | `string` | — | Custom CSS class |

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
- **Content organization**: The `CardHeader`, `CardContent`, and `CardFooter` sub-components provide a clear content structure, making it easier for assistive technologies to understand the page layout
