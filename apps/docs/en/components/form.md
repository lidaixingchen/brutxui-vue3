---
title: Form
description: A complete form field wrapper with integrated Vee-Validate and Zod schema validation support.
translated: true
---

# Form

A neo-brutalist style form system built on vee-validate, providing composable sub-components for structured form layout.

## Demo

<ComponentPreview>
  <FormDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="form" />

**Additional dependencies required:**

```bash
pnpm add vee-validate @vee-validate/zod zod
```

## Usage

```vue
<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from 'brutx-ui-vue/form'
import { Input, Button } from 'brutx-ui-vue'

const schema = toTypedSchema(z.object({
    username: z.string().min(2).max(50),
    email: z.string().email(),
}))

function onSubmit(values) {
    console.log('Form submitted:', values)
}
</script>

<template>
    <Form :validation-schema="schema" @submit="onSubmit">
        <FormField name="username" v-slot="{ componentField }">
            <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                    <Input v-bind="componentField" placeholder="Enter username" />
                </FormControl>
                <FormDescription>This is your public display name.</FormDescription>
                <FormMessage />
            </FormItem>
        </FormField>

        <FormField name="email" v-slot="{ componentField }">
            <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input v-bind="componentField" type="email" placeholder="you@example.com" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>

        <Button type="submit" variant="primary">Submit</Button>
    </Form>
</template>
```

### FormWizard Multi-step Form

A wizard-style form built on the `Stepper` component, supporting step validation, linear navigation, and custom step content.

```vue
<script setup>
import { ref } from 'vue'
import { FormWizard } from 'brutx-ui-vue/form'
import type { FormStep } from 'brutx-ui-vue/form'
import { Input } from 'brutx-ui-vue'

const values = ref({})

const steps = [
    { id: 'personal', title: 'Personal Info' },
    { id: 'address', title: 'Address' },
    { id: 'review', title: 'Review' },
]

function onComplete(finalValues) {
    console.log('Submitted:', finalValues)
}
</script>

<template>
    <FormWizard
        v-model="values"
        :steps="steps"
        @complete="onComplete"
    >
        <template #step-personal>
            <Input v-model="values.name" placeholder="Name" />
        </template>
        <template #step-address>
            <Input v-model="values.address" placeholder="Address" />
        </template>
        <template #step-review>
            <p>Review info: {{ values }}</p>
        </template>
    </FormWizard>
</template>
```

### FormConditional Conditional Fields

Dynamically show/hide field groups based on form values:

```vue
<template>
    <Form v-model="values">
        <FormField name="type" />

        <FormConditional :when="(v) => v.type === 'company'">
            <FormField name="companyName" />
            <FormField name="taxId" />
        </FormConditional>

        <FormConditional :when="(v) => v.type === 'personal'">
            <FormField name="idNumber" />
        </FormConditional>
    </Form>
</template>
```

## Sub-components

| Component | Description |
|-----------|-------------|
| `Form` | Root form component, integrates with vee-validate |
| `FormField` | Field wrapper that connects form state and provides field context |
| `FormItem` | Layout container for label, control, and message; generates unique IDs |
| `FormLabel` | Label with error state support, injects field context |
| `FormControl` | Input control wrapper that provides accessibility attributes via slot |
| `FormDescription` | Helper text below the input |
| `FormMessage` | Validation error message, injects field context |
| `FormWizard` | Multi-step wizard-style form |
| `FormConditional` | Dynamically shows/hides field groups based on form values |

## Data Types

### FormFieldContext

`FormField` provides `FormFieldContext` to child components via `provide/inject`:

```ts
interface FormFieldContext {
    name: ComputedRef<string>
    error: Ref<string | undefined>
    value: Ref<unknown>
    setValue: (value: unknown) => void
    setError: (message: string | undefined) => void
}
```

### FormItemContext

`FormItem` provides `FormItemContext` to child components via `provide/inject`:

```ts
interface FormItemContext {
    id: string
    formItemId: string
    formDescriptionId: string
    formMessageId: string
}
```

`FormControl`, `FormLabel`, and `FormMessage` all inject `FormFieldContext` and `FormItemContext`, providing direct access to field values and error states.

### FormStep

```ts
interface FormStep {
    id: string
    title: string
    description?: string
    icon?: Component
    validator?: (values: Record<string, unknown>) => ValidationResult
    optional?: boolean
}
```

### ValidationResult

```ts
interface ValidationResult {
    valid: boolean
    errors: Record<string, string>
}
```

## Composables

### useFormWizard

Access the wizard context within FormWizard child components:

```ts
const {
    currentStep,    // Ref<number> - Current step
    steps,          // ComputedRef<FormStep[]> - Step configuration
    values,         // ComputedRef<Record<string, unknown>> - Form data
    updateValues,   // (values: Record<string, unknown>) => void - Update form data
    nextStep,       // () => void - Go to next step
    previousStep,   // () => void - Go to previous step
    goToStep,       // (step: number) => void - Jump to a step
    complete,       // () => void - Complete the form
    getStepErrors,  // (step: number) => Record<string, string> | undefined - Get errors for a specific step
    isFirstStep,    // ComputedRef<boolean>
    isLastStep,     // ComputedRef<boolean>
    canGoNext,      // ComputedRef<boolean>
} = useFormWizard()
```

## Props

### Form

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `inline` | `boolean` | `false` | Inline form layout |
| `labelPosition` | `'left' \| 'right' \| 'top'` | `'right'` | Label position |
| `labelWidth` | `string \| number` | — | Label width |
| `scrollToError` | `boolean` | `false` | Scroll to first error field on validation failure |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Unified size for all form items |
| `class` | `string` | — | Custom CSS class |
| `initialValues` | `Record<string, unknown>` | — | Initial form values |
| `validationSchema` | `unknown` | — | Validation schema (supports vee-validate schema) |

### FormField

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | — (required) | Field name |

### FormItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

### FormLabel

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class (`text-brutal-destructive` is automatically added in error state) |

### FormControl

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

**Slot Props:** `FormControl` provides the following attributes via a scoped slot for binding to the inner input control:

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Unique ID associated with `FormItem` |
| `class` | `string` | CSS class |
| `aria-describedby` | `string` | IDs of describing elements (includes `FormDescription` and `FormMessage`) |
| `aria-invalid` | `boolean` | Whether the field has a validation error |

```vue
<FormControl v-slot="{ id, ariaDescribedby, ariaInvalid }">
    <Input :id="id" :aria-describedby="ariaDescribedby" :aria-invalid="ariaInvalid" />
</FormControl>
```

### FormDescription

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

### FormMessage

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

### FormWizard

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `FormStep[]` | — | Step configuration array (required) |
| `modelValue` | `Record<string, unknown>` | `{}` | Form data (v-model) |
| `initialStep` | `number` | `0` | Initial step index |
| `validateOnNext` | `boolean` | `true` | Whether to validate on next |
| `showIndicator` | `boolean` | `true` | Whether to show the step indicator |
| `linear` | `boolean` | `true` | Whether steps must be completed in order |
| `class` | `string` | — | Custom CSS class |

### FormConditional

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `when` | `(values: Record<string, unknown>) => boolean` | — | Condition evaluation function (required) |
| `class` | `string` | — | Custom CSS class |

## Events

### Form Events

| Event | Payload | Description |
| --- | --- | --- |
| `submit` | `Record<string, unknown>` | Triggered on form submission, contains all field values |

### FormWizard Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `Record<string, unknown>` | Form data update |
| `step-change` | `[step: number, previousStep: number]` | Step change |
| `complete` | `Record<string, unknown>` | Form completion |
| `validation-error` | `[step: number, errors: Record<string, string>]` | Validation failure |
| `navigation-blocked` | `[targetStep: number, blockedStep: number]` | Navigation blocked in linear mode |

## Exposed Methods (Form)

Access the Form component instance via `ref` to call the following methods:

| Method | Return Type | Description |
| --- | --- | --- |
| `validate()` | `Promise<boolean>` | Validate all fields, returns `true` if valid |
| `validateField(field)` | `Promise<boolean>` | Validate a single field |
| `resetFields()` | `void` | Reset all fields to initial values |
| `clearValidate(fields?)` | `void` | Clear validation errors for specified or all fields |
| `scrollToField(field)` | `void` | Scroll to the specified field |

```vue
<script setup>
import { ref } from 'vue'
import { Form } from 'brutx-ui-vue/form'

const formRef = ref(null)

async function handleSubmit() {
    const isValid = await formRef.value?.validate()
    if (isValid) {
        // Submit form
    }
}

function handleReset() {
    formRef.value?.resetFields()
}
</script>

<template>
    <Form ref="formRef" :scroll-to-error="true">
        <!-- Form fields -->
    </Form>
</template>
```

## Accessibility

### Form Structure

- `FormItem` automatically generates unique IDs, ensuring correct associations between `FormLabel`, `FormControl`, `FormDescription`, and `FormMessage`.
- `FormLabel` is associated with the corresponding input control via the `for` attribute.
- `FormControl` provides `id`, `aria-describedby`, and `aria-invalid` attributes via a scoped slot, which should be bound to the inner input control to ensure accessibility.

### Validation Errors

- On validation failure, `FormLabel` automatically adds the `text-brutal-destructive` style.
- `FormMessage` uses `role="alert"` to ensure screen readers announce error messages promptly.
- The `aria-invalid` attribute on the input control is automatically set to `true`.

### FormWizard Navigation

- The step indicator uses `role="tablist"` and `role="tab"` semantics.
- Supports keyboard navigation (Tab, Enter, Space).
- When `linear` mode is enabled, blocked steps are identified with `aria-disabled`.

## FAQ

**Q: Form validation is not triggered on submit. What's wrong?**

A: Make sure you have correctly installed and configured the `vee-validate` and `@vee-validate/zod` dependencies, and that `validationSchema` is passed to the `Form` component. Additionally, each field that needs validation must be wrapped in a `FormField`, and the `FormField`'s `name` attribute must match the field name in the schema.

**Q: How do I skip validation for certain steps in FormWizard?**

A: Set `optional: true` in the `steps` configuration to mark a step as optional. Optional steps do not trigger validation when advancing. For finer control, you can customize the validation logic in the step's `validator` function and return `{ valid: true, errors: {} }` to skip validation conditionally.

**Q: Why isn't the FormConditional condition function working?**

A: The `when` function of `FormConditional` receives the current form's complete value object as its argument. Make sure the field names are spelled correctly and the form values have been properly initialized via `v-model` or `initialValues`. If the condition depends on a field that hasn't been rendered yet or whose value is `undefined`, the condition evaluation may return unexpected results.
