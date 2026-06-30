---
title: Hardcore Input
description: Form validation input with 8-bit retro sound effects, emoji feedback, and physical shake, integrated with the Form system.
translated: true
---

# Hardcore Input

The ultimate form input validator. Synthesizes 8-bit retro electronic sound effects on the fly via Web Audio API (zero audio dependencies), while triggering neobrutalist emoji bounces and physical shake on validation state changes.

## Demo

<ComponentPreview>
  <HardcoreInputDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="hardcore-input" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { HardcoreInput } from 'brutx-ui-vue'

const value = ref('')

const minLength = (val) => val.length >= 5 || 'At least 5 characters required'
const hasNumber = (val) => /\d/.test(val) || 'Must contain a number'
</script>

<template>
    <HardcoreInput
        v-model="value"
        placeholder="Enter content..."
        :rules="[minLength, hasNumber]"
        validate-on="blur"
    />
</template>
```

### Validation Trigger Modes

| Mode | Description |
|------|-------------|
| `blur` | Validate on blur (default) |
| `input` | Validate in real-time on every input |
| `submit` | Validate when `validate()` is called externally |

### Sound System

Uses Web Audio API via the `useAudioEngine` composable to synthesize three sound effects:

| Sound | Waveform | Description |
|-------|----------|-------------|
| `type` | Triangle | Typing sound with 50ms throttle |
| `success` | Sine | Validation passed, rising frequency |
| `fail` | Square | Validation failed, falling frequency |

Sound can be disabled via the `sound` prop.

### Visual Feedback

- **Success**: Input border changes to `--brutal-success` color, cool emoji SVG appears on the right
- **Error**: Input border changes to `--brutal-destructive` color, angry emoji SVG appears on the right, input shakes with animation
- **Default**: No additional feedback

### Form Integration

HardcoreInput integrates with the Form system. When placed inside a `FormField`, it automatically syncs validation state:

```vue
<Form v-slot="{ handleSubmit }">
    <FormField v-slot="{ componentField }" name="username">
        <FormItem>
            <FormLabel>Username</FormLabel>
            <HardcoreInput v-bind="componentField" :rules="[minLength]" />
            <FormMessage />
        </FormItem>
    </FormField>
</Form>
```

## Composables

### useFormFieldValidation

The internal validation state machine of `HardcoreInput` has been extracted as a standalone `useFormFieldValidation` composable. It can be reused in any custom form control to share the same validation logic (rule evaluation, state machine transitions, error message management, trigger timing control). It does not depend on vee-validate and is suitable for scenarios where the Form system cannot be used or lightweight inline validation is needed.

```ts
import { useFormFieldValidation } from 'brutx-ui-vue'
import type { UseFormFieldValidationOptions, ValidationRule, ValidateOn } from 'brutx-ui-vue'

// Validation rules: return true for pass, return string for error message
const minLength: ValidationRule<string> = (val) => val.length >= 5 || 'At least 5 characters required'
const hasNumber: ValidationRule<string> = (val) => /\d/.test(val) || 'Must contain a number'

const {
    validationState,        // Current validation state
    errorMessage,           // Current error message
    validate,               // Trigger validation manually
    reset,                  // Reset to default state
    shouldValidateOnInput,  // Whether to validate on input
    shouldValidateOnBlur,   // Whether to validate on blur
} = useFormFieldValidation({
    rules: [minLength, hasNumber],
    validateOn: 'blur',
    defaultErrorMessage: 'Validation failed',
    onValidationChange: (state, message) => {
        // State change callback, can be used for side effects like sound and shake
    },
})
```

#### UseFormFieldValidationOptions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rules` | `MaybeRefOrGetter<ValidationRule<TValue>[]>` | `[]` | Array of validation rules; when empty, `validate` always returns `true` and sets state to `default` |
| `validateOn` | `MaybeRefOrGetter<'input' \| 'blur' \| 'submit'>` | `'submit'` | Validation trigger timing (only affects `shouldValidateOnInput` / `shouldValidateOnBlur` determination; the caller must invoke `validate` in the corresponding event) |
| `defaultErrorMessage` | `MaybeRefOrGetter<string>` | `'Invalid value'` | Default error message when a rule returns `false` |
| `onValidationChange` | `(state: ValidationState, message?: string) => void` | — | Callback on validation state change (only triggered when state actually changes, avoiding duplicates) |

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `validationState` | `Ref<'default' \| 'success' \| 'error'>` | Current validation state (reactive) |
| `errorMessage` | `Ref<string>` | Current error message (reactive, empty string when no error) |
| `validate(value)` | `(value: TValue) => boolean` | Validates the given value; returns `true` on pass, `false` on failure and writes to `errorMessage` |
| `reset()` | `() => void` | Resets to `default` state and clears error message |
| `shouldValidateOnInput()` | `() => boolean` | Whether configured to validate on input |
| `shouldValidateOnBlur()` | `() => boolean` | Whether configured to validate on blur |

#### ValidationRule

```ts
type ValidationRule<TValue> = (value: TValue) => boolean | string
```

A rule function receives the current value. Return `true` to pass, return `string` to fail with that string as the error message, return `false` to fail using `defaultErrorMessage`.

#### Usage Example

Reuse the same validation logic in a custom input control:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useFormFieldValidation } from 'brutx-ui-vue'

const value = ref('')
const { validationState, errorMessage, validate, shouldValidateOnBlur } = useFormFieldValidation({
    rules: [(v) => v.length >= 3 || 'At least 3 characters'],
    validateOn: 'blur',
})

function onBlur() {
    if (shouldValidateOnBlur()) validate(value.value)
}
</script>

<template>
    <input
        v-model="value"
        @blur="onBlur"
        :aria-invalid="validationState === 'error'"
        :class="{
            'border-brutal-success': validationState === 'success',
            'border-brutal-destructive': validationState === 'error',
        }"
    />
    <p v-if="errorMessage" class="text-brutal-destructive text-sm">{{ errorMessage }}</p>
</template>
```

> Note: `useFormFieldValidation` is not bound to a specific control. All timing checks (`shouldValidateOnInput` / `shouldValidateOnBlur`) only return boolean values, and the caller decides in which event to invoke `validate`. For the `submit` timing, the caller must explicitly invoke `validate` externally (e.g. on form submission).

## Programmatic Control

| Name | Description |
|------|-------------|
| `validate()` | Trigger validation manually |
| `validationState` | Current validation state |
| `errorMessage` | Current error message |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `undefined` | v-model binding value |
| `sound` | `boolean` | `true` | Whether to enable 8-bit retro sound effects |
| `rules` | `Array<(val: string) => boolean \| string>` | `[]` | List of validation rule functions |
| `shakeOnError` | `boolean` | `true` | Whether to trigger input shake on error |
| `type` | `string` | `'text'` | HTML input type attribute |
| `placeholder` | `string` | `undefined` | Placeholder text |
| `disabled` | `boolean` | `false` | Whether disabled |
| `readonly` | `boolean` | `false` | Whether readonly |
| `validateOn` | `'input' \| 'blur' \| 'submit'` | `'blur'` | Validation trigger timing |
| `class` | `string` | `undefined` | External class override |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@update:modelValue` | `(value: string)` | v-model update event |
| `@validation-change` | `(state: ValidationState, message?: string)` | Validation state change event, only triggered when state actually changes |

## Slots

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | — | Additional content to the right of the input (e.g. icons, emoji area overlay) |

## Accessibility

- Input has `:aria-invalid` and `:aria-describedby` set
- Error message has `aria-live="polite"`
- Shake and bounce animations are disabled when user prefers `prefers-reduced-motion: reduce`
