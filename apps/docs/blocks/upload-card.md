---
title: Upload Card
description: 带有拖拽上传、进度条和旋转指示器的文件上传卡片区块。
---

# Upload Card

新粗野主义风格的文件上传卡片，支持拖拽上传、浏览文件、上传进度显示和旋转指示器。

## 预览

<ComponentPreview>
  <div class="w-full max-w-lg mx-auto">
    <div class="bg-brutal-bg border-3 border-brutal shadow-brutal">
      <div class="p-6">
        <div class="flex flex-col items-center justify-center p-8 border-3 border-dashed border-brutal rounded-none cursor-pointer">
          <svg class="h-10 w-10 stroke-[3] text-brutal-muted-foreground mb-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <h3 class="text-lg font-black tracking-tight">Upload Files</h3>
          <p class="mt-1 text-sm text-brutal-muted-foreground font-medium">Drag and drop files here</p>
          <button class="mt-4 px-4 py-1.5 bg-brutal-primary text-brutal-fg border-3 border-brutal shadow-brutal font-black text-sm active:translate-y-[2px] active:shadow-none transition-all">Browse</button>
          <p class="mt-2 text-xs text-brutal-muted-foreground font-medium">or drop files here</p>
        </div>
      </div>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block upload-card
```

## 用法

```vue
<script setup>
import { ref } from 'vue'
import UploadCard from '@/components/ui/upload-card/UploadCard.vue'

const uploading = ref(false)
const progress = ref(0)

function handleUpload(files) {
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

function handleDrop(files) {
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

## 上传中状态

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

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | locale: `uploadCard.defaultTitle` |
| `description` | `string` | locale: `uploadCard.defaultDescription` |
| `accept` | `string` | — |
| `maxSize` | `number` | — |
| `uploading` | `boolean` | `false` |
| `progress` | `number` | `0` |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `upload` | `[files: File[]]` |
| `drop` | `[files: File[]]` |

## 插槽

| 插槽 | 说明 |
|------|------|
| `actions` | 拖拽区域下方的自定义操作区域 |

## 布局

UploadCard 包含：
- **拖拽区域**：虚线边框的拖放目标区域，支持点击浏览文件
- **上传图标**：Upload 图标（来自 lucide-vue-next）
- **浏览按钮**：primary 变体按钮，触发文件选择器
- **上传中状态**：旋转指示器 + 进度条，拖拽区域变为不可交互
