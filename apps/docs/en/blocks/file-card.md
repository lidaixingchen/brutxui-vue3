---
title: File Card
description: Neo-Brutalist file info card with file icon, file name, type badge, file size, and download button.
translated: true
---

# File Card

A Neo-Brutalist file information card featuring a file icon, file name, type badge, file size, and a download button.

> `FileCard` is marked as a legacy block. Compose new file cards from `Card`, `Badge`, `Button`, and related primitives.

## Demo

<ComponentPreview>
  <FileCardDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="file-card" />

## Usage

```vue
<script setup>
import FileCard from '@/components/ui/file-card/FileCard.vue'

function handleDownload() {
    console.log('Download clicked')
}
</script>

<template>
    <FileCard
        file-name="report-2026.pdf"
        file-size="3.2 MB"
        file-type="PDF"
        @download="handleDownload"
    />
</template>
```

### Multi-File List

```vue
<script setup>
import FileCard from '@/components/ui/file-card/FileCard.vue'

const files = [
    { fileName: 'report.pdf', fileSize: '3.2 MB', fileType: 'PDF' },
    { fileName: 'data.xlsx', fileSize: '1.1 MB', fileType: 'XLSX' },
    { fileName: 'image.png', fileSize: '5.8 MB', fileType: 'PNG' },
]
</script>

<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FileCard
            v-for="(file, i) in files"
            :key="i"
            v-bind="file"
            @download="() => console.log(file.fileName)"
        />
    </div>
</template>
```

## Props

### FileCard

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `fileName` | `string` | locale: `fileCard.defaultFileName` | File name |
| `fileSize` | `string` | `''` | File size |
| `fileType` | `string` | `''` | File type |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
| ---- | ---- | ---- |
| `download` | — | Emitted when the download button is clicked |

## Slots

| Slot | Scope | Description |
| ---- | ---- | ---- |
| `actions` | — | Action area at the bottom of the card |

## Accessibility

- **Keyboard**: Supports `Tab` to focus the download button, `Enter` to trigger download
- **ARIA**: Download button uses a semantic button tag
- **Focus Management**: Card content is arranged in logical order
