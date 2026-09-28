---
title: Accordion
description: Accordion component for displaying and collapsing content in a vertically stacked list.
translated: true
---

# Accordion

A collapsible panel list suitable for displaying FAQ sections, detailed terms, or step-by-step information. Built on Radix Vue headless primitives, it supports multiple neo-brutalist visual variants.

## Demo

<ComponentPreview>
  <AccordionDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="accordion" />

## Usage

```vue
<script setup>
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from 'brutx-ui-vue'
</script>

<template>
    <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
            <AccordionTrigger>Panel Title 1</AccordionTrigger>
            <AccordionContent>
                Accordion content 1 goes here.
            </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
            <AccordionTrigger>Panel Title 2</AccordionTrigger>
            <AccordionContent>
                Accordion content 2 goes here.
            </AccordionContent>
        </AccordionItem>
    </Accordion>
</template>
```

## Variants

Use the `variant` prop on `AccordionItem` to set different neo-brutalist styles:

| Variant | Description |
| ------ | ------ |
| `default` | Default with thick black border and solid shadow offset at the bottom-right |
| `flat` | Thick black border only, no shadow effects |
| `ghost` | Transparent background, no border or shadow, minimal presentation |
| `interactive` | Enhanced shadow and highlight on hover while the header and panel stay in place |

```vue
<template>
    <AccordionItem value="item" variant="interactive">
        <AccordionTrigger>Interactive Accordion Item</AccordionTrigger>
        <AccordionContent>Hover enhances the shadow; the header stays in place when expanded.</AccordionContent>
    </AccordionItem>
</template>
```

### Content Area Styling

`AccordionContent` styling automatically inherits the `variant` of its parent `AccordionItem` (synchronized via `provide`/`inject`, no manual specification needed). All variants share the base classes `border-t-3 p-6 bg-brutal-bg text-brutal-fg`, with the border color declared explicitly per variant (avoiding unreliable overrides when both base and variant carry a border-color class), then variant-specific differences are applied as follows:

| Variant | Content Area Difference | Visual Effect |
| ------ | ---------------- | ---------- |
| `default` | `border-brutal` | Black thick separator line at top + default background |
| `flat` | `border-brutal bg-brutal-muted/30` | Background replaced with semi-transparent muted color, matching the flat style |
| `ghost` | `border-transparent` | Top border transparent, overall more minimal and lightweight |
| `interactive` | `border-brutal hover:bg-brutal-muted/20` | Slight highlight on hover in the content area, enhancing interactive feedback |

> Note: The variant applies across all three layers -- `AccordionItem` (container), `AccordionTrigger` (trigger), and `AccordionContent` (content area) -- to maintain visual consistency.

## Sub-components

| Component | Description |
| ------ | ------ |
| `Accordion` | Root container, manages expand state and mode |
| `AccordionItem` | Single panel item, contains trigger and content |
| `AccordionTrigger` | Panel trigger, click to toggle expand/collapse |
| `AccordionContent` | Panel content area, shown when expanded |

## API Reference

<span id="accordion-1"></span>
<span id="accordionitem"></span>
<span id="accordiontrigger"></span>
<span id="accordioncontent"></span>

<ComponentApi name="accordion" />

## Accessibility

- **Keyboard operation**: Supports `Space` / `Enter` to trigger expand/collapse, arrow keys to navigate between panels
- **ARIA attributes**: Automatically manages `aria-expanded`, `aria-controls`, `role="region"`, etc.
- **Focus management**: Tab key focuses the trigger, focus order matches panel order
