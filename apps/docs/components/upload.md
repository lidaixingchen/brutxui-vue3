---
title: Upload 上传
description: 文件上传系统，支持拖拽上传、文件列表管理和进度追踪。
---

# Upload 上传

完整的文件上传系统，采用新粗野主义设计，支持拖拽上传、文件列表管理、进度追踪和错误处理。

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

## Props

### Upload

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fileList` | `UploadFile[]` | `[]` | 文件列表，支持 `v-model:fileList` |
| `limit` | `number` | — | 最大文件数量 |
| `multiple` | `boolean` | `true` | 是否支持多选 |
| `accept` | `string` | — | 接受的文件类型（如 `image/*`、`.pdf,.doc`） |
| `maxSize` | `number` | — | 最大文件大小（字节） |
| `maxRetries` | `number` | `3` | 最大重试次数 |
| `beforeUpload` | `(file: File) => boolean \| Promise<boolean>` | — | 上传前钩子 |
| `beforeRemove` | `(file: UploadFile) => boolean \| Promise<boolean>` | — | 删除前钩子 |
| `httpRequest` | `(options: UploadRequestOptions) => Promise<void>` | — | 自定义上传实现 |
| `listType` | `'text' \| 'picture' \| 'picture-card'` | `'text'` | 列表显示类型 |
| `autoUpload` | `boolean` | `true` | 选择后是否自动上传 |
| `drag` | `boolean` | `true` | 是否支持拖拽 |
| `onError` | `(error: UploadError, file: UploadFile) => void` | — | 错误回调 |
| `class` | `string` | — | 自定义 CSS 类 |

### UploadTrigger

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `drag` | `boolean` | `true` | 是否支持拖拽 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `accept` | `string` | — | 接受的文件类型 |
| `multiple` | `boolean` | `true` | 是否支持多选 |
| `class` | `string` | — | 自定义 CSS 类 |

### UploadFileList

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `files` | `UploadFile[]` | —（必填） | 文件列表 |
| `listType` | `'text' \| 'picture' \| 'picture-card'` | `'text'` | 列表显示类型 |
| `class` | `string` | — | 自定义 CSS 类 |

## 类型定义

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

## 事件

### Upload

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:fileList` | `UploadFile[]` | 文件列表变化时触发 |
| `file-change` | `UploadFile` | 添加文件时触发 |
| `file-remove` | `UploadFile` | 删除文件时触发 |
| `file-success` | `UploadFile` | 文件上传成功时触发 |
| `file-error` | `[UploadFile, UploadError]` | 文件上传失败时触发 |

### UploadTrigger

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `select` | `FileList` | 选择文件时触发 |

## 暴露的方法

### Upload

| 方法 | 说明 |
| --- | --- |
| `handleFileSelect(files)` | 编程式添加文件 |
| `handleFileRemove(file)` | 删除文件 |
| `retryUpload(file)` | 重试上传失败的文件 |

## 插槽

### Upload

| 插槽 | 作用域 | 说明 |
| --- | --- | --- |
| `trigger` | `{ selectFiles, limit, multiple, accept, drag }` | 触发区域插槽 |
| `file-list` | `{ files, listType, remove, retry }` | 文件列表插槽 |

### UploadTrigger

| 插槽 | 作用域 | 说明 |
| --- | --- | --- |
| `default` | `{ isDragging }` | 自定义触发内容 |
| `text` | — | 主要文本 |
| `hint` | — | 提示文本 |

## 可访问性

- **键盘操作**：触发区域可通过 `Enter` / `Space` 键激活
- **ARIA 属性**：隐藏的文件输入框有正确的标签
- **屏幕阅读器**：文件状态和进度会被播报
