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

Set `loading` to `true` to put the submit button in a loading state with a spinner, preventing duplicate submissions during this period. The `submit` event still fires normally; the caller should set `loading` back to `false` after the async request completes.

```vue
<script setup>
import { ref } from 'vue'
import FeedbackForm from '@/components/ui/feedback-form/FeedbackForm.vue'

const loading = ref(false)

async function handleSubmit(payload) {
    loading.value = true
    await sendFeedback(payload)
    loading.value = false
}
</script>

<template>
    <FeedbackForm :loading="loading" @submit="handleSubmit" />
</template>
```

### Success State

Set `success` to `true` to replace the form with a `SuccessCard`, displaying a success title, description, and confirm button. Clicking the confirm button triggers the `success-confirm` event; the caller decides the follow-up behavior (e.g., resetting the form, navigating away).

```vue
<script setup>
import { ref } from 'vue'
import FeedbackForm from '@/components/ui/feedback-form/FeedbackForm.vue'

const loading = ref(false)
const success = ref(false)

async function handleSubmit(payload) {
    loading.value = true
    await sendFeedback(payload)
    loading.value = false
    success.value = true
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
| `successTitle` | `string` | locale: `successCard.defaultTitle` | Success card title |
| `successDescription` | `string` | locale: `successCard.defaultDescription` | Success card description text |
| `successConfirmText` | `string` | locale: `successCard.defaultConfirmText` | Success card confirm button text |
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
- The submit button is disabled in the `loading` state to prevent duplicate submissions.
- The success card provides a confirm button with keyboard navigation and focus management support.
