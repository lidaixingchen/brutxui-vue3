---
title: Descriptions
description: Display read-only information in key-value pairs, commonly used in detail pages.
---

# Descriptions

Display read-only information in key-value pairs. Commonly used in detail pages, profile pages, and data display scenarios.

## Preview

<ComponentPreview>
  <DescriptionsDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="descriptions" />

## Usage

```vue
<script setup>
import { Descriptions, DescriptionsItem } from 'brutx-ui-vue'
</script>

<template>
    <Descriptions title="User Information" :column="2">
        <DescriptionsItem label="Name">John Doe</DescriptionsItem>
        <DescriptionsItem label="Email">john@example.com</DescriptionsItem>
        <DescriptionsItem label="Phone">+1 234 567 890</DescriptionsItem>
        <DescriptionsItem label="Address">123 Main St, City</DescriptionsItem>
    </Descriptions>
</template>
```

### With Border

```vue
<script setup>
import { Descriptions, DescriptionsItem } from 'brutx-ui-vue'
</script>

<template>
    <Descriptions title="Order Details" border>
        <DescriptionsItem label="Order ID">ORD-2024-001</DescriptionsItem>
        <DescriptionsItem label="Date">2024-01-15</DescriptionsItem>
        <DescriptionsItem label="Status">Completed</DescriptionsItem>
        <DescriptionsItem label="Amount">$299.99</DescriptionsItem>
        <DescriptionsItem label="Note" :span="2">Express shipping requested</DescriptionsItem>
    </Descriptions>
</template>
```

### Vertical Direction

```vue
<script setup>
import { Descriptions, DescriptionsItem } from 'brutx-ui-vue'
</script>

<template>
    <Descriptions title="Product Info" direction="vertical" border>
        <DescriptionsItem label="Name">Brutal Keyboard</DescriptionsItem>
        <DescriptionsItem label="Brand">BrutxUI</DescriptionsItem>
        <DescriptionsItem label="Price">$149.99</DescriptionsItem>
    </Descriptions>
</template>
```

### Different Sizes

```vue
<script setup>
import { Descriptions, DescriptionsItem } from 'brutx-ui-vue'
</script>

<template>
    <Descriptions size="sm" border>
        <DescriptionsItem label="Small">Content</DescriptionsItem>
    </Descriptions>

    <Descriptions size="default" border>
        <DescriptionsItem label="Default">Content</DescriptionsItem>
    </Descriptions>

    <Descriptions size="lg" border>
        <DescriptionsItem label="Large">Content</DescriptionsItem>
    </Descriptions>
</template>
```

## Sub-components

| Component | Description |
| --- | --- |
| `Descriptions` | Root container component |
| `DescriptionsItem` | Single description item (label + content) |

## API Reference

<span id="descriptions-1"></span>
<span id="descriptionsitem"></span>
<span id="descriptions-2"></span>
<span id="descriptionsitem-1"></span>

<ComponentApi name="descriptions" />

## Accessibility

- Uses semantic HTML structure
- Border mode uses table-like layout for screen reader compatibility
- Labels are associated with their values via visual grouping
