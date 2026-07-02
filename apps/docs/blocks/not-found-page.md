---
title: Not Found Page
description: 404 错误页面区块，带有故障文本效果和返回按钮。
---

# Not Found Page 404 页面

新粗野主义风格的 404 页面，包含 GlitchText 故障效果、装饰性方块和返回首页按钮。

## 预览

<ComponentPreview>
  <NotFoundPageDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="not-found-page" />

## 用法

### 基本用法

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

### 自定义文本

```vue
<script setup>
import { useRouter } from 'vue-router'
import NotFoundPage from '@/components/ui/not-found-page/NotFoundPage.vue'
const router = useRouter()
</script>

<template>
    <NotFoundPage
        title="Oops!"
        description="Something went wrong."
        back-text="Take me home"
        @back="() => router.push('/')"
    />
</template>
```

## Props

|属性|类型|默认值|说明|
|---|---|---|---|
|`title`|`string`|locale: `notFoundPage.defaultTitle`|页面标题文本|
|`description`|`string`|locale: `notFoundPage.defaultDescription`|页面描述文本|
|`backText`|`string`|locale: `notFoundPage.defaultBackText`|返回按钮文本|
|`class`|`string`|—|自定义 CSS 类名|

## 事件

|事件|参数|说明|
|---|---|---|
|`back`|—|点击返回按钮时触发|

## 插槽

|插槽|作用域|说明|
|---|---|---|
|`header`|—|替换/扩展区块头部|
|`default`|—|替换区块主体内容|
|`footer`|—|替换/扩展区块底部|

## 可访问性

- 页面标题使用 `<h1>`，保持正确的文档大纲层级
- 装饰性的 GlitchText "404" 动画以 `autoplay` 循环播放，不依赖用户交互，也不暴露为可聚焦元素
- 返回按钮使用语义化 `<button>`，支持键盘聚焦与 `Enter` / `Space` 触发
- 容器使用 `min-h-screen` 居中显示，避免依赖视口滚动的小屏可访问性问题
