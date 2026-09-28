---
title: Upload
description: File upload system with drag-and-drop support, file list management, and progress tracking.
---

# Upload

A complete file upload system built with Neo-Brutalism design, featuring drag-and-drop, file list management, progress tracking, and error handling.

## Preview

<ComponentPreview>
  <UploadDemo />
</ComponentPreview>

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

## API Reference

<span id="upload-1"></span>
<span id="uploadtrigger"></span>
<span id="uploadfilelist"></span>
<span id="upload-2"></span>
<span id="uploadtrigger-1"></span>
<span id="exposed-methods"></span>
<span id="upload-3"></span>
<span id="upload-4"></span>
<span id="uploadtrigger-2"></span>

<ComponentApi name="upload" />

## Types

### UploadFile

```typescript
interface UploadFile {
    id: string
    name: string
    size: number
    type: string
    status: 'ready' | 'uploading' | 'success' | 'error' | 'canceled'
    progress: number
    url?: string
    raw?: File
    error?: UploadError
    retryCount?: number
    abortController?: AbortController
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
    signal: AbortSignal
    onProgress: (percent: number) => void
    onSuccess: (response: unknown) => void
    onError: (error: UploadError) => void
}
```

## Accessibility

- **Keyboard**: Trigger area is focusable and activatable with `Enter` / `Space`
- **ARIA Attributes**: Hidden file input is properly labeled
- **Screen Readers**: File status and progress are announced
