---
title: Feedback Form
description: Feedback form block with name, email, subject, and message fields.
translated: true
---

# Feedback Form

A Neo-Brutalist feedback form featuring a title, description, and complete form fields (name, email, subject, message) with a submit button.

## Demo

<ComponentPreview>
  <FeedbackFormDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="feedback-form" />

## Usage

```vue
<script setup>
import FeedbackForm from '@/components/ui/feedback-form/FeedbackForm.vue'

function handleSubmit(payload) {
    console.log('Feedback:', payload)
    // payload: { name, email, subject, message }
}
</script>

<template>
    <FeedbackForm
        title="Send Feedback"
        description="We'd love to hear from you."
        submit-text="Submit"
        @submit="handleSubmit"
    />
</template>
```

### Custom Text

```vue
<script setup>
import FeedbackForm from '@/components/ui/feedback-form/FeedbackForm.vue'
</script>

<template>
    <FeedbackForm
        title="Contact Us"
        description="Have a question? Reach out to our team."
        submit-text="Send Message"
        @submit="handleContact"
    />
</template>
```

### Loading State

The component blocks duplicate submissions in the same submit turn. To keep the form locked during an async request, set the controlled `loading` prop to `true` synchronously in the `submit` handler and reset it to `false` when the request finishes. If the handler does not take over `loading`, the internal duplicate guard releases on the next Vue update cycle.

```vue
<script setup>
import { ref } from 'vue'
import FeedbackForm from '@/components/ui/feedback-form/FeedbackForm.vue'

const loading = ref(false)

async function handleSubmit(payload) {
    loading.value = true
    try {
        await sendFeedback(payload)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <FeedbackForm :loading="loading" @submit="handleSubmit" />
</template>
```

### Success State

Set `success` to `true` to replace the form with the `Result` success state, displaying a success title, description, and confirm button. Clicking the confirm button triggers the `success-confirm` event; the caller decides the follow-up behavior (e.g., resetting the form, navigating away).

```vue
<script setup>
import { ref } from 'vue'
import FeedbackForm from '@/components/ui/feedback-form/FeedbackForm.vue'

const loading = ref(false)
const success = ref(false)

async function handleSubmit(payload) {
    loading.value = true
    try {
        await sendFeedback(payload)
        success.value = true
    } finally {
        loading.value = false
    }
}

function handleSuccessConfirm() {
    success.value = false
}
</script>

<template>
    <FeedbackForm
        :loading="loading"
        :success="success"
        success-title="Feedback Received"
        success-description="Thank you for your feedback. We will process it as soon as possible."
        success-confirm-text="Submit Another"
        @submit="handleSubmit"
        @success-confirm="handleSuccessConfirm"
    />
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | locale: `feedbackForm.defaultTitle` | Form title |
| `description` | `string` | locale: `feedbackForm.defaultDescription` | Form description text |
| `submitText` | `string` | locale: `feedbackForm.defaultSubmitText` | Submit button text |
| `loading` | `boolean` | `false` | Whether in loading state |
| `success` | `boolean` | `false` | Whether to show the success card |
| `successTitle` | `string` | locale: `feedbackForm.successTitle` | Success state title |
| `successDescription` | `string` | locale: `feedbackForm.successDescription` | Success state description text |
| `successConfirmText` | `string` | locale: `feedbackForm.successConfirmText` | Success state confirm button text |
| `iconSize` | `IconSize` | `'default'` | Icon size |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
| --- | --- | --- |
| `submit` | `[{ name: string; email: string; subject: string; message: string }]` | Emitted on form submission, carrying the form data |
| `success-confirm` | `[]` | Emitted when the success card confirm button is clicked |

## Slots

| Slot | Scope | Description |
| --- | --- | --- |
| `header` | — | Replace/extend the block header |
| `default` | — | Replace the block main content (including the form) |
| `footer` | — | Replace/extend the block footer |

## Accessibility

- All form fields use semantic `<label>` associations, ensuring screen readers can correctly identify them.
- The submit controls are disabled while `loading`; the component also blocks duplicate submissions in the same submit turn.
- The success card provides a confirm button with keyboard navigation and focus management support.
