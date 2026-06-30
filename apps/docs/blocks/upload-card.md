---
title: Upload Card
description: 带有拖拽上传、进度条和旋转指示器的文件上传卡片区块。
---

# Upload Card 上传卡片

新粗野主义风格的文件上传卡片，支持拖拽上传、浏览文件、上传进度显示和旋转指示器。

## 预览

<ComponentPreview>
  <UploadCardDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="upload-card" />

## 用法

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

## 变体

### 上传中状态

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

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | locale: `uploadCard.defaultTitle` | 标题文本 |
| `description` | `string` | locale: `uploadCard.defaultDescription` | 描述文本 |
| `accept` | `string` | — | 接受的文件类型 |
| `maxSize` | `number` | — | 最大文件大小（字节） |
| `uploading` | `boolean` | `false` | 是否正在上传 |
| `progress` | `number` | `0` | 上传进度百分比 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `upload` | `[files: File[]]` | 文件上传时触发 |
| `drop` | `[files: File[]]` | 文件拖放时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `actions` | — | 拖拽区域下方的自定义操作区域 |

## 可访问性

- **键盘操作**：支持 `Space` / `Enter` 触发文件选择
- **ARIA 属性**：自动管理 `aria-label`、`aria-describedby` 等属性
- **焦点管理**：支持键盘导航和焦点指示
