---
title: Breadcrumb
description: Breadcrumb navigation component for displaying the current page's path hierarchy, helping users quickly navigate back to parent levels.
translated: true
---

# Breadcrumb

A neo-brutalist breadcrumb navigation component built on Reka UI's breadcrumb primitives, suitable for displaying multi-level page trees, especially as a standard navigation element in complex nested scenarios such as admin dashboards.

Default links render as solid labels with a full border, background, and hard shadow. Hover changes the background; pressing moves the text and border together toward the shadow and hides it. The current page uses an accent fill with a smaller hard shadow. The `folder` variant retains its open-bottom tab appearance and flat surface, with background feedback on hover.

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

When there are many page levels, use `BreadcrumbEllipsis` to collapse less important intermediate pages. It is a **purely presentational ellipsis indicator** (`role="presentation"`, no interactive semantics); wrap it with a `DropdownMenu` or similar trigger if click-to-expand behavior is needed.

```vue
<template>
    <Breadcrumb>
        <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <!-- Collapsed ellipsis indicator (presentational, non-interactive) -->
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
| `BreadcrumbEllipsis` | Ellipsis indicator (presentational) for collapsing intermediate levels |

## API Reference

<span id="breadcrumb-1"></span>
<span id="breadcrumblist"></span>
<span id="breadcrumbitem"></span>
<span id="breadcrumblink"></span>
<span id="breadcrumbpage"></span>
<span id="breadcrumbseparator"></span>
<span id="breadcrumbellipsis"></span>
<span id="breadcrumbseparator-1"></span>
<span id="breadcrumbellipsis-1"></span>

<ComponentApi name="breadcrumb" />

## Accessibility

- **Keyboard operation**: Link items support `Tab` key navigation and `Enter` key activation
- **ARIA attributes**: Automatically adds `aria-label="Breadcrumb"` to the navigation container and `aria-current="page"` to identify the current page
- **Semantic structure**: Wrapped in a `<nav>` element with an `<ol>` list structure conforming to the WAI-ARIA breadcrumb specification
