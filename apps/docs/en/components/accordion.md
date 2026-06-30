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
| `interactive` | Shadow scale-up and shift on hover for a stronger interactive feel |

```vue
<template>
    <AccordionItem value="item" variant="interactive">
        <AccordionTrigger>Interactive Accordion Item</AccordionTrigger>
        <AccordionContent>Hover to see! There's a hover offset effect.</AccordionContent>
    </AccordionItem>
</template>
```

### Content Area Styling

`AccordionContent` styling automatically inherits the `variant` of its parent `AccordionItem` (synchronized via `provide`/`inject`, no manual specification needed). All variants share the base classes `border-t-3 border-brutal p-6 bg-brutal-bg text-brutal-fg`, with variant-specific differences applied as follows:

| Variant | Content Area Difference | Visual Effect |
| ------ | ---------------- | ---------- |
| `default` | (no additional styles) | Black thick separator line at top + default background |
| `flat` | `bg-brutal-muted/30` | Background replaced with semi-transparent muted color, matching the flat style |
| `ghost` | `border-transparent` | Top border transparent, overall more minimal and lightweight |
| `interactive` | `hover:bg-brutal-muted/20` | Slight highlight on hover in the content area, enhancing interactive feedback |

> Note: The variant applies across all three layers -- `AccordionItem` (container), `AccordionTrigger` (trigger), and `AccordionContent` (content area) -- to maintain visual consistency.

## Sub-components

| Component | Description |
| ------ | ------ |
| `Accordion` | Root container, manages expand state and mode |
| `AccordionItem` | Single panel item, contains trigger and content |
| `AccordionTrigger` | Panel trigger, click to toggle expand/collapse |
| `AccordionContent` | Panel content area, shown when expanded |

## Props

### Accordion

| Prop | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `type` | `'single' \| 'multiple'` | — | Expand mode, single or multiple selection |
| `collapsible` | `boolean` | `false` | Whether all items can be closed in `type="single"` mode |
| `disabled` | `boolean` | `false` | Whether to disable the entire accordion |
| `modelValue` | `string \| string[]` | — | Currently selected panel value, supports `v-model` two-way binding |
| `defaultValue` | `string \| string[]` | — | Default selected value in uncontrolled mode |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | Reading direction |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Accordion layout direction |
| `unmountOnHide` | `boolean` | `true` | Whether to unmount content DOM when closed |
| `class` | `string` | — | Custom class name |

### AccordionItem

| Prop | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `value` | `string` | — | Unique identifier value (required) |
| `variant` | `'default' \| 'flat' \| 'ghost' \| 'interactive'` | `'default'` | Visual style variant |
| `disabled` | `boolean` | `false` | Whether to disable this item |
| `class` | `string` | — | Custom class name |

### AccordionTrigger

| Prop | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'lg'` | Size of the expand/collapse icon |
| `class` | `string` | — | Custom class name |

### AccordionContent

| Prop | Type | Default | Description |
| ------ | ------ | ------ | ------ |
| `forceMount` | `boolean` | — | Force mount content, used with external animation libraries to control animations |
| `class` | `string` | — | Custom class name |

## Events

| Event | Payload | Description |
| ------ | ------ | ------ |
| `update:modelValue` | `value: string \| string[] \| undefined` | Triggered when expand state changes, supports `v-model` |

## Slots

| Slot | Scope | Description |
| ------ | ------ | ------ |
| `Accordion#default` | — | Accordion content, typically contains `AccordionItem` |
| `AccordionItem#default` | — | Panel item content, typically contains `AccordionTrigger` and `AccordionContent` |
| `AccordionTrigger#default` | — | Trigger text content |
| `AccordionTrigger#icon` | — | Custom expand/collapse icon, defaults to `ChevronDown` |
| `AccordionContent#default` | — | Content displayed when the panel is expanded |

## Accessibility

- **Keyboard operation**: Supports `Space` / `Enter` to trigger expand/collapse, arrow keys to navigate between panels
- **ARIA attributes**: Automatically manages `aria-expanded`, `aria-controls`, `role="region"`, etc.
- **Focus management**: Tab key focuses the trigger, focus order matches panel order
