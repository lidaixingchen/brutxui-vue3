---
title: Not Found Page
description: 404 错误页面区块，带有故障文本效果和返回按钮。
---

# Not Found Page

新粗野主义风格的 404 页面，包含 GlitchText 故障效果、装饰性方块和返回首页按钮。

## 预览

<ComponentPreview>
  <div class="min-h-[320px] flex items-center justify-center bg-brutal-bg p-4">
    <div class="w-full max-w-lg text-center relative">
      <div class="relative border-3 border-brutal bg-brutal-bg shadow-brutal p-8">
        <div class="absolute -top-4 -left-4 h-16 w-16 bg-brutal-accent border-3 border-brutal rotate-12 shadow-brutal-sm"></div>
        <div class="absolute -bottom-3 -right-3 h-12 w-12 bg-brutal-secondary border-3 border-brutal -rotate-6 shadow-brutal-sm"></div>
        <div class="mb-6">
          <span class="text-7xl font-black text-brutal-primary">404</span>
        </div>
        <h1 class="text-2xl font-black tracking-tight text-brutal-fg">Page Not Found</h1>
        <p class="mt-3 text-brutal-muted-foreground font-medium">The page you are looking for does not exist or has been removed.</p>
        <div class="mt-8">
          <button class="px-5 py-2 bg-brutal-primary text-brutal-fg border-3 border-brutal shadow-brutal font-black text-sm active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all">Go Back Home</button>
        </div>
      </div>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block not-found-page
```

## 用法

```vue
<script setup>
import NotFoundPage from '@/components/ui/not-found-page/NotFoundPage.vue'

function handleBack() {
    window.location.href = '/'
}
</script>

<template>
    <NotFoundPage
        title="页面未找到"
        description="您访问的页面不存在或已被移除。"
        back-text="返回首页"
        @back="handleBack"
    />
</template>
```

## 自定义文本

```vue
<script setup>
import NotFoundPage from '@/components/ui/not-found-page/NotFoundPage.vue'
</script>

<template>
    <NotFoundPage
        title="Oops!"
        description="Something went wrong."
        back-text="Take me home"
        @back="() => $router.push('/')"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | locale: `notFoundPage.defaultTitle` |
| `description` | `string` | locale: `notFoundPage.defaultDescription` |
| `backText` | `string` | locale: `notFoundPage.defaultBackText` |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `back` | `[]` |

## Slots

| Slot | 用途 |
|------|------|
| `header` | 替换/扩展区块头部 |
| `default` | 替换区块主体内容 |
| `footer` | 替换/扩展区块底部 |

## 布局

NotFoundPage 包含：
- **装饰方块**：强调色和辅助色旋转方块，偏移阴影
- **故障文本**：GlitchText 组件渲染 "404"，自动播放故障动画
- **标题**：加粗、字距调整的标题文本
- **描述**：弱化文本描述
- **返回按钮**：primary 变体，带箭头图标
