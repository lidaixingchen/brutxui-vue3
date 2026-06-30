---
title: Textarea
description: Multi-line text input area with auto-resize or fixed row height and hard border styling.
translated: true
---

# Textarea

Neobrutalist-styled multi-line text input with variants, sizes, and v-model.

## Demo

<ComponentPreview>
  <TextareaDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="textarea" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { Textarea } from 'brutx-ui-vue'

const message = ref('')
</script>

<template>
    <Textarea v-model="message" placeholder="Type your message here..." />
</template>
```

### With Label

```vue
<script setup>
import { ref } from 'vue'
import { Textarea, Label } from 'brutx-ui-vue'

const bio = ref('')
</script>

<template>
    <div class="space-y-2">
        <Label for="bio">Bio</Label>
        <Textarea id="bio" v-model="bio" placeholder="Tell us about yourself..." />
    </div>
</template>
```

### Disabled State

```vue
<script setup>
import { Textarea } from 'brutx-ui-vue'
</script>

<template>
    <Textarea disabled placeholder="Disabled textarea" />
</template>
```

### Readonly State

Set a readonly textarea via the `readonly` prop. In readonly state, the textarea is not editable but remains focusable for text selection. The cursor style is `cursor-default`, and opacity is not reduced (unlike `disabled`).

```vue
<script setup>
import { ref } from 'vue'
import { Textarea } from 'brutx-ui-vue'

const content = ref('This is readonly content. Users can select and copy text but cannot modify it. Suitable for displaying agreement terms, history records, etc.')
</script>

<template>
    <Textarea v-model="content" readonly />
</template>
```

## Variants

| Variant | Description |
| --- | --- |
| `default` | Standard border |
| `error` | Destructive border with primary focus shadow |
| `success` | Success border with secondary focus shadow |

Set different border styles via the `variant` prop:

```vue
<template>
    <Textarea variant="default" placeholder="Default variant" />
    <Textarea variant="error" placeholder="Error variant" />
    <Textarea variant="success" placeholder="Success variant" />
</template>
```

## Sizes

| Size | Padding | Font Size |
| --- | --- | --- |
| `sm` | `px-3 py-2` | `text-sm` |
| `default` | `px-4 py-3` | `text-base` |
| `lg` | `px-5 py-4` | `text-lg` |

Set different sizes via the `size` prop:

```vue
<template>
    <Textarea size="sm" placeholder="Small size" />
    <Textarea size="default" placeholder="Default size" />
    <Textarea size="lg" placeholder="Large size" />
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | — | Binding value, supports v-model |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Border style variant |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size |
| `disabled` | `boolean` | `false` | Whether disabled |
| `readonly` | `boolean` | `false` | Whether readonly (not editable but selectable/copyable, cursor is `cursor-default`, opacity not reduced) |
| `placeholder` | `string` | Internationalized fallback text | Placeholder text |
| `errorMessage` | `string` | — | Error message text, only displayed when `variant="error"`, uses `role="alert"` for screen reader announcement |
| `ariaLabel` | `string` | — | Accessibility label |
| `ariaLabelledby` | `string` | — | Associated label element ID |
| `ariaDescribedby` | `string` | — | Description element ID |
| `ariaInvalid` | `boolean` | — | Whether marked as invalid |
| `ariaRequired` | `boolean` | — | Whether marked as required |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | Triggered when value changes |

## Exposed Methods (defineExpose)

Access the component instance via `ref` to call the following methods:

| Method | Description |
|--------|-------------|
| `focus()` | Focus the textarea |
| `blur()` | Remove focus |
| `select()` | Select all text in the textarea |

## Accessibility

- **ARIA attributes**: Supports `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-invalid`, `aria-required` attributes for assistive technologies (e.g. screen readers)

```vue
<script setup>
import { ref } from 'vue'
import { Textarea } from 'brutx-ui-vue'

const bio = ref('')
</script>

<template>
    <Textarea
        v-model="bio"
        aria-label="Bio"
        aria-required="true"
        aria-invalid="false"
        placeholder="Enter your bio..."
    />
</template>
```

## Customization

Textarea defaults to `resize-none`. To allow resizing, override with a custom class:

```vue
<script setup>
import { Textarea } from 'brutx-ui-vue'
</script>

<template>
    <Textarea class="resize-y" placeholder="Resizable textarea" />
</template>
```
