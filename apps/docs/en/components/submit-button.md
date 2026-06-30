---
title: Submit Button
description: A submit button with built-in duplicate submission prevention and loading state switching.
translated: true
---

# Submit Button

A neo-brutalist style submit button with built-in loading and pending states, designed specifically for form submission. Renders as `<button type="submit">`, supports duplicate click prevention and i18n pending text.

## Demo

<ComponentPreview>
  <SubmitButtonDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="submit-button" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { SubmitButton } from 'brutx-ui-vue'

const isLoading = ref(false)

async function handleSubmit() {
    isLoading.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))
    isLoading.value = false
}
</script>

<template>
    <form @submit.prevent="handleSubmit">
        <SubmitButton :loading="isLoading" variant="primary">
            Save Changes
        </SubmitButton>
    </form>
</template>
```

### Usage with Forms

```vue
<script setup>
import { ref } from 'vue'
import { Form, SubmitButton } from 'brutx-ui-vue'

const isLoading = ref(false)

function onSubmit(values) {
    isLoading.value = true
    setTimeout(() => {
        isLoading.value = false
    }, 2000)
}
</script>

<template>
    <Form @submit="onSubmit">
        <SubmitButton :loading="isLoading" variant="primary">
            Sign In
        </SubmitButton>
    </Form>
</template>
```

### Pending Text

When loading, the button displays the value of the `pendingText` prop instead of the slot content:

```vue
<script setup>
import { SubmitButton } from 'brutx-ui-vue'
</script>

<template>
    <SubmitButton loading pending-text="Processing..." variant="primary">
        Pay Now
    </SubmitButton>
</template>
```

## Variants

| Variant | Description |
|---------|-------------|
| `default` | Standard background color |
| `primary` | Primary (coral) background |
| `secondary` | Secondary background |
| `accent` | Accent background |
| `danger` | Danger action background |
| `success` | Success state background |
| `outline` | Transparent background with border |
| `ghost` | Transparent background without border |
| `link` | Link style |

## Sizes

| Size | Description |
|------|-------------|
| `sm` | Small size |
| `default` | Default size |
| `lg` | Large size |
| `xl` | Extra large size |
| `icon` | Icon button size |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger' \| 'success' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | Color variant |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'icon'` | `'default'` | Size |
| `pendingText` | `string` | locale: `submitButton.submitting` | Pending text displayed during loading |
| `loading` | `boolean` | `false` | Whether in loading state |
| `disabled` | `boolean` | `false` | Whether disabled |
| `class` | `string` | — | Custom CSS class |

## Slots

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | — | Button content, displayed when `loading` is `false` |

## Accessibility

- **Keyboard**: Supports `Space` / `Enter` to trigger form submission
- **ARIA Attributes**: In loading state, the button is semantically disabled to prevent duplicate submissions
- **Focus Management**: Click events are blocked in `disabled` or `loading` state

## FAQ

**Q: How do I customize the display text during loading?**

A: Use the `pendingText` prop. If not set, the default i18n text `submitButton.submitting` is used.

**Q: What's the difference between `disabled` and `loading`?**

A: Both prevent clicks, but `loading` switches the button's display content to the pending text, while `disabled` only disables the button.
