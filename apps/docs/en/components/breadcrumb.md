---
title: Breadcrumb
description: Breadcrumb navigation component for displaying the current page's path hierarchy, helping users quickly navigate back to parent levels.
translated: true
---

# Breadcrumb

A neo-brutalist breadcrumb navigation component built on Reka UI's breadcrumb primitives, suitable for displaying multi-level page trees, especially as a standard navigation element in complex nested scenarios such as admin dashboards.

## Demo

<ComponentPreview>
  <BreadcrumbDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="breadcrumb" />

## Usage

```vue
<script setup>
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis
} from 'brutx-ui-vue'
</script>

<template>
    <Breadcrumb>
        <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbLink href="/components">Components</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
            </BreadcrumbItem>
        </BreadcrumbList>
    </Breadcrumb>
</template>
```

### Collapsed Ellipsis

When there are many page levels, use `BreadcrumbEllipsis` to collapse less important intermediate pages.

```vue
<template>
    <Breadcrumb>
        <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <!-- Collapsed ellipsis button -->
                <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbPage>Current Page</BreadcrumbPage>
            </BreadcrumbItem>
        </BreadcrumbList>
    </Breadcrumb>
</template>
```

## Sub-components

| Component | Description |
|------|------|
| `Breadcrumb` | Root container |
| `BreadcrumbList` | Breadcrumb list container |
| `BreadcrumbItem` | Single breadcrumb item container |
| `BreadcrumbLink` | Clickable link item |
| `BreadcrumbPage` | Current page indicator (non-clickable) |
| `BreadcrumbSeparator` | Separator, renders a forward slash `/` by default |
| `BreadcrumbEllipsis` | Ellipsis button for collapsing intermediate levels |

## Props

### Breadcrumb

| Prop | Type | Default | Description |
|------|------|--------|------|
| `class` | `string` | — | Custom style class |

### BreadcrumbList

| Prop | Type | Default | Description |
|------|------|--------|------|
| `class` | `string` | — | Custom style class |

### BreadcrumbItem

| Prop | Type | Default | Description |
|------|------|--------|------|
| `class` | `string` | — | Custom style class |

### BreadcrumbLink

| Prop | Type | Default | Description |
|------|------|--------|------|
| `as` | `string` | `'a'` | Rendered HTML tag, such as `'a'`, `'button'`, etc. |
| `asChild` | `boolean` | `false` | Whether to enable Reka UI's asChild, for use with Vue-Router's `<router-link>` rendering |
| `class` | `string` | — | Custom style class |

### BreadcrumbPage

| Prop | Type | Default | Description |
|------|------|--------|------|
| `class` | `string` | — | Custom style class |

### BreadcrumbSeparator

| Prop | Type | Default | Description |
|------|------|--------|------|
| `class` | `string` | — | Custom style class |

### BreadcrumbEllipsis

| Prop | Type | Default | Description |
|------|------|--------|------|
| `iconSize` | `IconSize` | `'default'` | Icon size, supports `IconSize` enum values |
| `class` | `string` | — | Custom style class |

## Slots

### BreadcrumbSeparator

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Renders a forward slash `/` by default; you can place a custom small icon component inside |

### BreadcrumbEllipsis

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Renders the `MoreHorizontal` icon by default; you can place a custom ellipsis icon component inside |

## Accessibility

- **Keyboard operation**: Link items support `Tab` key navigation and `Enter` key activation
- **ARIA attributes**: Automatically adds `aria-label="Breadcrumb"` to the navigation container and `aria-current="page"` to identify the current page
- **Semantic structure**: Wrapped in a `<nav>` element with an `<ol>` list structure conforming to the WAI-ARIA breadcrumb specification
