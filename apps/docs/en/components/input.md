---
title: Input
description: Single-line text input with neobrutalist highlight border and custom placeholder.
translated: true
---

# Input

Neobrutalist-styled text input with variants, sizes, and v-model two-way binding.

## Demo

<ComponentPreview>
  <InputDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="input" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const value = ref('')
</script>

<template>
    <Input v-model="value" placeholder="Enter your name..." />
</template>
```

### With Label

```vue
<script setup>
import { ref } from 'vue'
import { Input, Label } from 'brutx-ui-vue'

const email = ref('')
</script>

<template>
    <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input id="email" v-model="email" type="email" placeholder="you@example.com" />
    </div>
</template>
```

### Disabled State

```vue
<script setup>
import { Input } from 'brutx-ui-vue'
</script>

<template>
    <Input disabled placeholder="Disabled input" />
</template>
```

### Readonly State

Set a readonly input via the `readonly` prop. In readonly state, the input is not editable but remains focusable for text selection. The cursor style is `cursor-default`, and opacity is not reduced (unlike `disabled`).

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const value = ref('Readonly content, selectable and copyable but not editable')
</script>

<template>
    <Input v-model="value" readonly />
</template>
```

### Clearable

Add a clear button that appears on hover when the input has a value.

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const value = ref('Clear me!')
</script>

<template>
    <Input v-model="value" clearable @clear="value = ''" />
</template>
```

### Password Toggle

Show a password visibility toggle button for password inputs.

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const password = ref('')
</script>

<template>
    <Input v-model="password" type="password" show-password placeholder="Enter password" />
</template>
```

### Word Limit

Show character count when `show-word-limit` and `maxlength` are both set.

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const value = ref('')
</script>

<template>
    <Input v-model="value" maxlength="100" show-word-limit placeholder="Max 100 characters" />
</template>
```

### Icons And Addons

Prefer the built-in `prefixIcon`, `suffixIcon`, `prepend`, and `append` APIs on `Input` for input adornments. `InputAdornment` remains only as a compatibility entry; new code should use `Input` directly.

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'
import { Search } from '@lucide/vue'

const url = ref('')
</script>

<template>
    <Input :prefix-icon="Search" placeholder="Search projects" />

    <Input v-model="url" placeholder="Enter URL">
        <template #prepend>https://</template>
        <template #append>.com</template>
    </Input>
</template>
```

## Variants

| Variant | Description |
|---------|-------------|
| `default` | Standard border |
| `error` | Error border with primary shadow on focus |
| `success` | Success border with secondary shadow on focus |

## Sizes

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| `sm` | `h-9` | `px-3 py-1` | `text-sm` |
| `default` | `h-11` | `px-4 py-2` | `text-base` |
| `lg` | `h-14` | `px-5 py-3` | `text-lg` |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `HTMLInputType` 1 | `'text'` | Input type |
| `modelValue` | `string` | — | v-model binding value |
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Input variant |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Input size |
| `disabled` | `boolean` | `false` | Whether disabled |
| `readonly` | `boolean` | `false` | Whether readonly |
| `placeholder` | `string` | — | Placeholder text |
| `maxlength` | `number` | — | Maximum input length |
| `clearable` | `boolean` | `false` | Show clear button on hover |
| `showPassword` | `boolean` | `false` | Show password toggle button (for `type="password"`) |
| `showWordLimit` | `boolean` | `false` | Show word count (requires `maxlength`) |
| `prefixIcon` | `Component` | — | Prefix icon |
| `suffixIcon` | `Component` | — | Suffix icon |
| `errorMessage` | `string` | — | Error message text, only displayed when `variant="error"`, uses `role="alert"` for screen reader announcement |
| `ariaLabel` | `string` | — | ARIA label |
| `ariaLabelledby` | `string` | — | ARIA label reference ID |
| `ariaDescribedby` | `string` | — | ARIA description reference ID |
| `ariaInvalid` | `boolean` | — | ARIA invalid state |
| `ariaRequired` | `boolean` | — | ARIA required state |
| `class` | `string` | — | Custom CSS class |

> 1 `HTMLInputType` is a union of all standard types supported by `HTMLInputElement.type`: `'button' | 'checkbox' | 'color' | 'date' | 'datetime-local' | 'email' | 'file' | 'hidden' | 'image' | 'month' | 'number' | 'password' | 'radio' | 'range' | 'reset' | 'search' | 'submit' | 'tel' | 'text' | 'time' | 'url' | 'week'`

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | Triggered when value changes |
| `clear` | — | Triggered when clear button is clicked |

## Slots

| Slot | Description |
| --- | --- |
| `prepend` | Content before the input (e.g., URL protocol) |
| `append` | Content after the input (e.g., domain) |

## Exposed Methods (defineExpose)

Access the component instance via `ref` to call the following methods:

| Method | Description |
|--------|-------------|
| `focus()` | Focus the input |
| `blur()` | Remove focus |
| `select()` | Select all text in the input |

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const inputRef = ref(null)
function handleFocus() {
    inputRef.value?.focus()
}
</script>

<template>
    <Input ref="inputRef" placeholder="Click button to focus" />
    <button @click="handleFocus">Focus Input</button>
</template>
```

## Accessibility

Enhance input accessibility with ARIA attributes for assistive technologies (e.g. screen readers):

```vue
<script setup>
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const email = ref('')
</script>

<template>
    <Input
        v-model="email"
        type="email"
        aria-label="Email address"
        aria-required="true"
        aria-invalid="false"
        placeholder="you@example.com"
    />
</template>
```
