---
title: Loading Page
description: 全页加载状态区块，带有旋转指示器、骨架屏装饰和可选进度条。
---

# Loading Page 加载页

新粗野主义风格的全页加载状态，包含 Spinner 旋转指示器、Skeleton 装饰元素和可选的 Progress 进度条。

## 预览

<ComponentPreview>
  <LoadingPageDemo />
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block loading-page
```

## 用法

```vue
<script setup>
import LoadingPage from '@/components/ui/loading-page/LoadingPage.vue'
</script>

<template>
    <LoadingPage
        title="加载中"
        description="请稍候，内容正在加载..."
    />
</template>
```

### 带进度条

```vue
<script setup>
import LoadingPage from '@/components/ui/loading-page/LoadingPage.vue'
import { ref } from 'vue'

const progress = ref(65)
</script>

<template>
    <LoadingPage
        :progress="progress"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `loadingPage.defaultTitle` | 加载页标题文本 |
| `description` | `string` | locale: `loadingPage.defaultDescription` | 加载页描述文本 |
| `progress` | `number` | — | 进度百分比（0-100），传入时显示进度条 |
| `class` | `string` | — | 自定义样式类 |

## 插槽

| 插槽 | 作用域 | 说明 |
| ---- | ---- | ---- |
| `header` | — | 替换/扩展区块头部 |
| `default` | — | 替换区块主体内容 |
| `footer` | — | 替换/扩展区块底部 |

## 可访问性

- **语义化结构**：使用语义化 HTML 元素确保屏幕阅读器正确识别加载状态
- **ARIA 属性**：通过 `aria-live` 和 `aria-busy` 属性通知辅助技术当前加载状态
- **进度反馈**：当提供 `progress` 时，进度条通过 `aria-valuenow` 等属性传达进度信息
