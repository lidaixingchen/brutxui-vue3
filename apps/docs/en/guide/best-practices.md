---
title: Best Practices
description: BrutxUI usage tips and design patterns.
translated: true
---

# Best Practices

This document provides usage tips for BrutxUI to help you build high-quality Neo-Brutalism applications.

---

## Blocks vs Components

### When to Use Components

Components are single-purpose UI primitives, suitable for:

- Standalone elements like buttons, inputs, and cards
- Scenarios requiring high customizability
- Building your own business components

```vue
<template>
  <Button variant="primary" @click="handleClick">
    Submit
  </Button>
</template>
```

### When to Use Blocks

Blocks are business snippets composed of multiple Components, suitable for:

- Quickly scaffolding pages
- Common UI patterns (pricing cards, login forms, dashboards)
- Reducing duplicate code

```vue
<template>
  <!-- Use a pre-built pricing card Block directly -->
  <SaaSPricing :plans="plans" />
</template>
```

**Selection Guide**:

| Scenario | Recommendation |
|------|------|
| Full style customization needed | Components |
| Rapid prototyping | Blocks |
| Learning component usage | Reference Block source code |
| Building reusable business components | Components + Composition |

---

## Style Management

### Prefer CSS Variables

```css
/* Recommended: use CSS variables */
.my-component {
  background: var(--brutal-primary);
  border: var(--brutal-border-width) solid var(--brutal-fg);
}

/* Avoid: hardcoded values */
.my-component {
  background: #ff6b6b;
  border: 3px solid #222;
}
```

### Use `cn()` to Merge Classes

Per the component development guide, always use `computed()` for dynamic class merging and never call `cn()` directly in templates:

```ts
import { computed } from 'vue'
import { cn } from 'brutx-ui-vue'
import { buttonVariants } from './button-variants'

// Use cn() inside computed()
const classes = computed(() => cn(
  buttonVariants({ variant: 'primary', size: 'md' }),
  props.class
))

// Avoid calling cn() in templates
// <div :class="cn(base, props.class)">
```

---

## TypeScript Best Practices

### Use Generics to Constrain Props

```ts
interface Props<T> {
  items: T[]
  keyExtractor: (item: T) => string
  renderItem: (item: T) => VNode
}

const props = defineProps<Props<User>>()
```

### Type-Safe Event Handling

```ts
// Explicitly type event payloads
function handleSort(column: string, direction: 'asc' | 'desc') {
  // ...
}

// Avoid any
function handleSort(...args: any[]) {
  // ...
}
```

---

## Accessibility

### Keyboard Navigation

Ensure all interactive components support keyboard operation:

- `Tab` / `Shift+Tab`: focus switching
- `Space` / `Enter`: activate / trigger
- `Escape`: close / cancel

### ARIA Attributes

```vue
<template>
  <Button
    :aria-expanded="isOpen"
    aria-haspopup="dialog"
    @click="toggle"
  >
    Open Panel
  </Button>
</template>
```

### Focus Management

```vue
<script setup>
import { ref, nextTick } from 'vue'

const inputRef = ref()

async function openDialog() {
  isOpen.value = true
  await nextTick()
  inputRef.value?.$el?.focus()
}
</script>
```

---

## Performance Optimization

### Import on Demand

```ts
// Import on demand
import { Button, Card } from 'brutx-ui-vue'

// Avoid full import
import * as BrutxUI from 'brutx-ui-vue'
```

### Virtual Scrolling

Use the VirtualScroll component for large data lists:

```vue
<template>
  <VirtualScroll
    :items="largeList"
    :item-height="48"
    :buffer="5"
  >
    <template #default="{ item }">
      <div>{{ item.name }}</div>
    </template>
  </VirtualScroll>
</template>
```

### Lazy-Load Components

```ts
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)
```

---

## Common Pitfalls

### 1. Loss of Reactivity

```ts
// Destructuring loses reactivity
const { value } = defineProps({ value: String })

// Use toRefs or access props directly
const props = defineProps({ value: String })
```

### 2. Multiple Event Bindings

```vue
<!-- Inline function creates a new reference on every render -->
<Button @click="() => handleClick(id)">Click</Button>

<!-- Use a named function -->
<Button @click="handleClick(id)">Click</Button>
```

### 3. Component Naming Conflicts

```vue
<!-- Using an HTML native tag name -->
<template>
  <button>Custom Button</button>
</template>

<!-- Use PascalCase -->
<template>
  <BrutalButton>Custom Button</BrutalButton>
</template>
```
