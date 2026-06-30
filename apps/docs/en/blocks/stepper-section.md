---
title: Stepper Section
description: Step navigation section with a horizontal stepper, content card, and prev/next navigation buttons.
translated: true
---

# Stepper Section

A neo-brutalist step navigation section featuring a horizontal Stepper, content card, and Previous/Next buttons.

## Demo

<ComponentPreview>
  <StepperSectionDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="stepper-section" />

## Usage

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import StepperSection from '@/components/ui/stepper-section/StepperSection.vue'
import type { StepperStepItem } from '@/components/ui/stepper-section/StepperSection.vue'

const currentStep = ref(0)

const steps: StepperStepItem[] = [
    { title: 'Account', description: 'Create your account' },
    { title: 'Profile', description: 'Set up your profile' },
    { title: 'Complete', description: 'Review and finish' },
]

function handleStepClick(index: number) {
    console.log('Step:', index)
}
</script>

<template>
    <StepperSection
        title="Setup Wizard"
        :steps="steps"
        v-model="currentStep"
        @step-click="handleStepClick"
    />
</template>
```

### Custom Step Content

Customize the content area of each step via the default slot, rendering the corresponding content based on the `currentStep` value:

```vue
<script setup>
import { ref } from 'vue'
import StepperSection from '@/components/ui/stepper-section/StepperSection.vue'

const currentStep = ref(0)

const steps = [
    { title: 'Personal Info', description: 'Your basic information' },
    { title: 'Preferences', description: 'Customize your experience' },
    { title: 'Confirmation', description: 'Review your choices' },
]
</script>

<template>
    <StepperSection
        :steps="steps"
        v-model="currentStep"
    >
        <template v-if="currentStep === 0">
            <p>Personal info form goes here</p>
        </template>
        <template v-if="currentStep === 1">
            <p>Preferences form goes here</p>
        </template>
        <template v-if="currentStep === 2">
            <p>Confirmation summary goes here</p>
        </template>
    </StepperSection>
</template>
```

## Data Types

### StepperStepItem

| Field | Type | Description |
| ---- | ---- | ---- |
| `title` | `string` | Step title |
| `description` | `string` | Optional, step description |

## Props

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `stepperSection.defaultTitle` | Section title text |
| `steps` | `StepperStepItem[]` | `[]` | Step list data |
| `modelValue` | `number` | `0` | Index of the currently active step, supports `v-model` two-way binding |
| `class` | `string` | — | Custom CSS class name |

## Events

| Event | Payload | Description |
| ---- | ---- | ---- |
| `step-click` | `[index: number]` | Triggered when a step title is clicked, payload is the step index |

## Slots

| Slot | Scope | Description |
| ---- | ---- | ---- |
| `header` | — | Replace/extend the section header |
| `default` | — | Step content area (inside the card) |
| `footer` | — | Replace/extend the section footer |

## Accessibility

- Stepper uses `role="navigation"` and `aria-label` to identify the step navigation area
- Each step node contains `aria-current="step"` to identify the current step
- Step nodes support keyboard navigation via `tabindex`
- Navigation buttons set `aria-disabled="true"` when disabled
