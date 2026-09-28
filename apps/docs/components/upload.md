---
title: Upload 上传
description: 文件上传系统，支持拖拽上传、文件列表管理和进度追踪。
---

# Upload 上传

完整的文件上传系统，采用新粗野主义设计，支持拖拽上传、文件列表管理、进度追踪和错误处理。

## 预览

<ComponentPreview>
  <UploadDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="upload" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Upload, UploadTrigger, UploadFileList, type UploadFile } from 'brutx-ui-vue'

const fileList = ref<UploadFile[]>([])

async function handleUpload(options) {
    // 自定义上传实现
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

### 图片卡片类型

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

### 使用钩子函数

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

## 子组件

| 组件 | 说明 |
| --- | --- |
| `Upload` | 根组件，管理文件列表和上传逻辑 |
| `UploadTrigger` | 触发区域，支持拖拽/点击选择文件 |
| `UploadFileList` | 文件列表容器 |
| `UploadFileItem` | 单个文件项，支持预览、进度和删除 |

## API 参考

<span id="upload"></span>
<span id="uploadtrigger"></span>
<span id="uploadfilelist"></span>
<span id="事件"></span>
<span id="upload-1"></span>
<span id="uploadtrigger-1"></span>
<span id="暴露的方法"></span>
<span id="upload-2"></span>
<span id="插槽"></span>
<span id="upload-3"></span>
<span id="uploadtrigger-2"></span>

<ComponentApi name="upload" />

## 类型定义

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

## 可访问性

- **键盘操作**：触发区域可通过 `Enter` / `Space` 键激活
- **ARIA 属性**：隐藏的文件输入框有正确的标签
- **屏幕阅读器**：文件状态和进度会被播报
