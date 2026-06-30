---
title: Upload
description: File upload system with drag-and-drop support, file list management, and progress tracking.
---

# Upload

A complete file upload system built with Neo-Brutalism design, featuring drag-and-drop, file list management, progress tracking, and error handling.

## Installation

<InstallationTabs componentName="upload" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { Upload, UploadTrigger, UploadFileList, type UploadFile } from 'brutx-ui-vue'

const fileList = ref<UploadFile[]>([])

async function handleUpload(options) {
    // Custom upload implementation
    const formData = new FormData()
    formData.append('file', options.file)

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    })

    options.onSuccess(response)
}
</script>

<template>
    <Upload
        v-model:file-list="fileList"
        :http-request="handleUpload"
        accept="image/*"
        :max-size="5 * 1024 * 1024"
    >
        <template #trigger="{ selectFiles, drag }">
            <UploadTrigger :drag="drag" @select="selectFiles" />
        </template>
        <template #file-list="{ files, remove, retry }">
            <UploadFileList :files="files" @remove="remove" @retry="retry" />
        </template>
    </Upload>
</template>
```

### Picture Card Type

```vue
<script setup>
import { ref } from 'vue'
import { Upload, UploadTrigger, UploadFileList, type UploadFile } from 'brutx-ui-vue'

const fileList = ref<UploadFile[]>([])
</script>

<template>
    <Upload
        v-model:file-list="fileList"
        list-type="picture-card"
        :limit="5"
        multiple
    >
        <template #trigger="{ selectFiles }">
            <UploadTrigger @select="selectFiles" />
        </template>
        <template #file-list="{ files, remove }">
            <UploadFileList :files="files" list-type="picture-card" @remove="remove" />
        </template>
    </Upload>
</template>
```

### With Hooks

```vue
<script setup>
import { ref } from 'vue'
import { Upload, UploadTrigger, UploadFileList, type UploadFile } from 'brutx-ui-vue'

const fileList = ref<UploadFile[]>([])

function beforeUpload(file) {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
        console.error('只能上传图片文件!')
        return false
    }
    return true
}

async function beforeRemove(file) {
    return confirm(`确定删除 ${file.name} 吗?`)
}
</script>

<template>
    <Upload
        v-model:file-list="fileList"
        :before-upload="beforeUpload"
        :before-remove="beforeRemove"
    >
        <template #trigger="{ selectFiles }">
            <UploadTrigger @select="selectFiles" />
        </template>
        <template #file-list="{ files, remove }">
            <UploadFileList :files="files" @remove="remove" />
        </template>
    </Upload>
</template>
```

## Sub-components

| Component | Description |
| --- | --- |
| `Upload` | Root component, manages file list and upload logic |
| `UploadTrigger` | Trigger area for file selection (drag/click) |
| `UploadFileList` | File list container |
| `UploadFileItem` | Single file item with preview, progress, and delete |

## Props

### Upload

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `fileList` | `UploadFile[]` | `[]` | File list, supports `v-model:fileList` |
| `limit` | `number` | — | Maximum number of files |
| `multiple` | `boolean` | `true` | Whether to support multiple file selection |
| `accept` | `string` | — | Accepted file types (e.g., `image/*`, `.pdf,.doc`) |
| `maxSize` | `number` | — | Maximum file size in bytes |
| `maxRetries` | `number` | `3` | Maximum retry count |
| `beforeUpload` | `(file: File) => boolean \| Promise<boolean>` | — | Hook before upload |
| `beforeRemove` | `(file: UploadFile) => boolean \| Promise<boolean>` | — | Hook before removal |
| `httpRequest` | `(options: UploadRequestOptions) => Promise<void>` | — | Custom upload implementation |
| `listType` | `'text' \| 'picture' \| 'picture-card'` | `'text'` | List display type |
| `autoUpload` | `boolean` | `true` | Whether to upload automatically after selection |
| `drag` | `boolean` | `true` | Whether to support drag and drop |
| `onError` | `(error: UploadError, file: UploadFile) => void` | — | Error callback |
| `class` | `string` | — | Custom CSS class |

### UploadTrigger

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `drag` | `boolean` | `true` | Whether to support drag and drop |
| `disabled` | `boolean` | `false` | Whether disabled |
| `accept` | `string` | — | Accepted file types |
| `multiple` | `boolean` | `true` | Whether to support multiple selection |
| `class` | `string` | — | Custom CSS class |

### UploadFileList

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `files` | `UploadFile[]` | — (required) | File list |
| `listType` | `'text' \| 'picture' \| 'picture-card'` | `'text'` | List display type |
| `class` | `string` | — | Custom CSS class |

## Types

### UploadFile

```typescript
interface UploadFile {
    id: string
    name: string
    size: number
    type: string
    status: 'ready' | 'uploading' | 'success' | 'error'
    progress: number
    url?: string
    raw?: File
    error?: UploadError
}
```

### UploadError

```typescript
interface UploadError {
    message: string
    code?: string
    status?: number
}
```

### UploadRequestOptions

```typescript
interface UploadRequestOptions {
    file: File
    onProgress: (percent: number) => void
    onSuccess: (response: unknown) => void
    onError: (error: UploadError) => void
}
```

## Events

### Upload

| Event | Payload | Description |
| --- | --- | --- |
| `update:fileList` | `UploadFile[]` | Emitted when file list changes |
| `file-change` | `UploadFile` | Emitted when a file is added |
| `file-remove` | `UploadFile` | Emitted when a file is removed |
| `file-success` | `UploadFile` | Emitted when a file is uploaded successfully |
| `file-error` | `[UploadFile, UploadError]` | Emitted when a file upload fails |

### UploadTrigger

| Event | Payload | Description |
| --- | --- | --- |
| `select` | `FileList` | Emitted when files are selected |

## Exposed Methods

### Upload

| Method | Description |
| --- | --- |
| `handleFileSelect(files)` | Programmatically add files |
| `handleFileRemove(file)` | Remove a file |
| `retryUpload(file)` | Retry uploading a failed file |

## Slots

### Upload

| Slot | Scope | Description |
| --- | --- | --- |
| `trigger` | `{ selectFiles, limit, multiple, accept, drag }` | Trigger area slot |
| `file-list` | `{ files, listType, remove, retry }` | File list slot |

### UploadTrigger

| Slot | Scope | Description |
| --- | --- | --- |
| `default` | `{ isDragging }` | Custom trigger content |
| `text` | — | Main text |
| `hint` | — | Hint text |

## Accessibility

- **Keyboard**: Trigger area is focusable and activatable with `Enter` / `Space`
- **ARIA Attributes**: Hidden file input is properly labeled
- **Screen Readers**: File status and progress are announced
