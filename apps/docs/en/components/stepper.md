---
title: Stepper
description: Multi-step progress indicator component supporting horizontal and vertical directions, with completed/active/upcoming states and clickable navigation, suitable for multi-step forms and wizard flows.
translated: true
---

# Stepper

A visual multi-step flow guidance component where completed steps display a check icon, active steps are highlighted and enlarged, and thick-bordered circular nodes with connecting lines showcase a neo-brutalist texture.

## Demo

<ComponentPreview>
  <StepperDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="stepper" />

## Usage

```vue
<script setup>
import { Stepper } from 'brutx-ui-vue'
import type { StepperStep } from 'brutx-ui-vue'
import { ref } from 'vue'

const steps: StepperStep[] = [
    { id: 1, title: 'Basic Info', description: 'Fill in account details' },
    { id: 2, title: 'Security', description: 'Set password' },
    { id: 3, title: 'Complete', description: 'Registration successful' },
]

const current = ref(0)
</script>

<template>
    <!-- Horizontal stepper -->
    <Stepper v-model="current" :steps="steps" orientation="horizontal" />

    <!-- Vertical stepper (supports content slots) -->
    <Stepper v-model="current" :steps="steps" orientation="vertical">
        <template #step-1>
            <p class="text-sm">Fill in step 1 content here...</p>
        </template>
        <template #step-2>
            <p class="text-sm">Fill in step 2 content here...</p>
        </template>
    </Stepper>

    <!-- Navigation buttons -->
    <button :disabled="current === 0" @click="current--">Previous</button>
    <button :disabled="current === steps.length - 1" @click="current++">Next</button>
</template>
```

### Non-clickable

Set `clickable` to `false` to disable click-to-jump on step nodes, making them display-only.

```vue
<Stepper v-model="current" :steps="steps" :clickable="false" />
```

## Variants

Control the color of the active step using the `variant` prop.

| Variant | Description |
|------|------|
| `default` | Default background color (`bg-brutal-bg`) |
| `primary` | Primary (coral) background |
| `accent` | Accent (yellow) background |

```vue
<Stepper v-model="current" :steps="steps" variant="accent" />
```

## Sizes

Control the step node size using the `size` prop.

| Size | Description |
|------|------|
| `sm` | Small node |
| `default` | Default node |
| `lg` | Large node |

```vue
<Stepper v-model="current" :steps="steps" size="lg" />
```

## Data Types

```ts
interface StepperStep {
    id: string | number   // Unique identifier (vertical slot name is step-{id})
    title: string         // Step title
    description?: string  // Optional subtitle
}
```

## Exported Types

```ts
import type { StepperStep } from 'brutx-ui-vue'
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `steps` | `StepperStep[]` | — | Step data list |
| `modelValue` | `number` | — | Current step index (0-based, v-model) |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Step node size |
| `variant` | `'default' \| 'primary' \| 'accent'` | `'default'` | Active step color variant |
| `clickable` | `boolean` | `true` | Whether clicking on step nodes is allowed |
| `class` | `string` | — | Custom style class |

## Events

| Event | Payload | Description |
|------|------|------|
| `update:modelValue` | `number` | Step change (v-model) |
| `step-click` | `number` | Triggered when a step node is clicked |

## Slots

In vertical mode, each step can inject content via the `#step-{id}` slot when active:

```html
<Stepper v-model="current" :steps="steps" orientation="vertical">
    <template #step-1>
        <!-- Content displayed when step 1 is active -->
    </template>
</Stepper>
```

## Accessibility

- **Keyboard**: Step buttons support arrow key navigation (`←`/`→` in horizontal mode, `↑`/`↓` in vertical mode), `Home`/`End` to jump to the first/last step, `Enter`/`Space` to click the currently focused step
- **Focus Management**: Step buttons can be focused via the Tab key

### Node State Reference

| State | Style | Condition |
|------|------|------|
| `completed` | Green background + checkmark icon | Index < current step |
| `active` | Variant background color + large shadow | Index = current step |
| `upcoming` | Default background color + semi-transparent | Index > current step |

## Exposed Methods (defineExpose)

Access the component instance via `ref` to call the following methods:

| Property/Method | Type | Description |
| --- | --- | --- |
| `currentStep` | `ComputedRef<number>` | Current step index (read-only) |
| `totalSteps` | `ComputedRef<number>` | Total number of steps (read-only) |
| `isFirstStep` | `ComputedRef<boolean>` | Whether it's the first step (read-only) |
| `isLastStep` | `ComputedRef<boolean>` | Whether it's the last step (read-only) |
| `goToStep` | `(index: number) => void` | Jump to a specific step |
| `nextStep` | `() => void` | Go forward one step |
| `previousStep` | `() => void` | Go back one step |
