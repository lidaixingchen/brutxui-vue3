---
title: File Card 文件卡片
description: 新粗野主义风格的文件信息卡片，包含文件图标、文件名、类型徽标、文件大小和下载按钮。
---

# File Card 文件卡片

新粗野主义风格的文件信息卡片，包含文件图标、文件名、类型徽标、文件大小和下载按钮。

> `FileCard` 已标记为 legacy block。新文件卡片建议用 `Card`、`Badge`、`Button` 等基础组件组合。

## 预览

<ComponentPreview>
  <FileCardDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="file-card" />

## 用法

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

### 多文件列表

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

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `fileName` | `string` | locale: `fileCard.defaultFileName` | 文件名 |
| `fileSize` | `string` | `''` | 文件大小 |
| `fileType` | `string` | `''` | 文件类型 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
| ---- | ---- | ---- |
| `download` | — | 点击下载按钮时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
| ---- | ---- | ---- |
| `actions` | — | 卡片底部操作区域 |

## 可访问性

- **键盘操作**：支持 `Tab` 聚焦下载按钮，`Enter` 触发下载
- **ARIA 属性**：下载按钮使用语义化按钮标签
- **焦点管理**：卡片内容按逻辑顺序排列
