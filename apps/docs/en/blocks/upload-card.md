---
title: Upload Card
description: File upload card block with drag-and-drop, progress bar, and spinner indicator.
translated: true
---

# Upload Card

A Neo-Brutalist file upload card supporting drag-and-drop upload, file browsing, upload progress display, and a spinner indicator.

## Demo

<ComponentPreview>
  <UploadCardDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="upload-card" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import UploadCard from '@/components/ui/upload-card/UploadCard.vue'

const uploading = ref(false)
const progress = ref(0)

function handleUpload(files: File[]) {
    console.log('Upload:', files)
    uploading.value = true
    // Simulate upload progress
    const interval = setInterval(() => {
        progress.value += 10
        if (progress.value >= 100) {
            clearInterval(interval)
            uploading.value = false
            progress.value = 0
        }
    }, 300)
}

function handleDrop(files: File[]) {
    console.log('Drop:', files)
    handleUpload(files)
}
</script>

<template>
    <UploadCard
        accept=".png,.jpg,.pdf"
        :uploading="uploading"
        :progress="progress"
        @upload="handleUpload"
        @drop="handleDrop"
    />
</template>
```

## Variants

### Uploading State

```vue
<script setup>
import UploadCard from '@/components/ui/upload-card/UploadCard.vue'
</script>

<template>
    <UploadCard
        uploading
        :progress="65"
    />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `title` | `string` | locale: `uploadCard.defaultTitle` | Title text |
| `description` | `string` | locale: `uploadCard.defaultDescription` | Description text |
| `accept` | `string` | — | Accepted file types |
| `maxSize` | `number` | — | Maximum file size in bytes |
| `uploading` | `boolean` | `false` | Whether upload is in progress |
| `progress` | `number` | `0` | Upload progress percentage |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
|------|------|------|
| `upload` | `[files: File[]]` | Emitted when files are uploaded |
| `drop` | `[files: File[]]` | Emitted when files are dropped |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `actions` | — | Custom action area below the drop zone |

## Accessibility

- **Keyboard**: Supports `Space` / `Enter` to trigger file selection
- **ARIA**: Automatically manages `aria-label`, `aria-describedby`, and other attributes
- **Focus Management**: Supports keyboard navigation and focus indication
