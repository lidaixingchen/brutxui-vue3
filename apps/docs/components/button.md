---
title: Button 按钮
description: 新粗野主义风格的按钮组件，提供9种颜色变体、加载动画与键盘导航。
---

# Button 按钮

新粗野主义风格的按钮组件，支持 9 种变体、4 种尺寸 + icon 模式、加载状态和 `asChild` 组合支持。

## 预览

<ComponentPreview>
  <ButtonDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="button" />

## 用法

```vue
<script setup>
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <Button variant="primary" size="default">
        Click me
    </Button>
</template>
```

### 加载状态

```vue
<script setup>
import { ref } from 'vue'
import { Button } from 'brutx-ui-vue'

const isLoading = ref(false)

async function handleSubmit() {
    isLoading.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))
    isLoading.value = false
}
</script>

<template>
    <Button variant="primary" :loading="isLoading" @click="handleSubmit">
        Save Changes
    </Button>
</template>
```

### 禁用状态

```vue
<script setup>
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <Button variant="primary" disabled>
        Disabled
    </Button>
</template>
```

### 提交按钮与等待文本

通过 `type="submit"` 将按钮渲染为表单提交按钮。配合 `loading` 与 `pendingText` 可在提交期间显示等待文本（替换插槽内容），未传入 `pendingText` 时回退到 i18n 默认值（`submitButton.submitting`）：

```vue
<script setup>
import { ref } from 'vue'
import { Button } from 'brutx-ui-vue'

const isLoading = ref(false)

async function handleSubmit() {
    isLoading.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))
    isLoading.value = false
}
</script>

<template>
    <form @submit.prevent="handleSubmit">
        <Button type="submit" variant="primary" :loading="isLoading" pending-text="保存中...">
            保存
        </Button>
    </form>
</template>
```

仅当 `type="submit"` 且 `loading=true` 时才会显示等待文本并隐藏插槽内容；其他情况下插槽内容照常渲染，加载图标仍然显示。

### asChild

使用 `asChild` 将按钮样式渲染到自定义元素上（例如路由链接）：

```vue
<script setup>
import { Button } from 'brutx-ui-vue'
import { RouterLink } from 'vue-router'
</script>

<template>
    <Button as-child>
        <RouterLink to="/about">About</RouterLink>
    </Button>
</template>
```

### 故障效果

`Button` 内置 `effect="glitch"`，可直接启用故障撕裂动画。

```vue
<template>
    <Button
        effect="glitch"
        variant="primary"
        glitch-trigger="click"
        glitch-speed="fast"
        glitch-direction="both"
        data-text="GLITCH"
    >
        GLITCH
    </Button>
</template>
```

> 提示：若直接使用导出的 `buttonVariants({ effect: 'glitch' })` 构建 glitch 按钮，需显式传入 `glitchSpeed` 与 `glitchDirection`（`medium`/`horizontal` 默认值由 `<Button>` 组件提供，原始工具函数不注入默认 glitch 类）。

## 变体

| 变体 | 说明 |
| ---- | ---- |
| `default` | 背景色，硬阴影 |
| `primary` | Primary（珊瑚色）背景 |
| `secondary` | Secondary（薄荷青）背景 |
| `accent` | Accent（黄色）背景 |
| `danger` | Destructive（红色）背景，白色文字 |
| `success` | Success（绿色）背景 |
| `outline` | 透明背景，悬停时反转 |
| `ghost` | 无边框和阴影，柔和悬停效果 |
| `link` | 无边框和阴影，悬停时显示下划线 |

```vue
<template>
    <Button variant="primary">Primary 变体</Button>
</template>
```

## 装饰形态

`flair` 与色系变体正交可组合，提供三种机械质感装饰形态：

| 形态 | 说明 |
| ---- | ---- |
| `none` | 默认，不输出任何额外装饰类 |
| `stacked` | 多层彩虹硬投影，按压时同源位移（1.5x 盖影） |
| `hazard` | 外围警戒斜纹，中央黄色底板配黑字，悬停时保持文字对比 |
| `ticket` | 票据撕口——左右中缝半圆缺口 |

```vue
<template>
    <Button variant="primary" flair="stacked">多层投影</Button>
    <Button variant="accent" flair="hazard">警戒斜纹</Button>
    <Button variant="default" flair="ticket">票据撕口</Button>
</template>
```

## 尺寸

| 尺寸 | 高度 | 内边距 | 字体大小 |
| ---- | ---- | ------ | -------- |
| `sm` | `h-9` | `px-3 py-1` | `text-sm` |
| `default` | `h-11` | `px-5 py-2` | `text-base` |
| `lg` | `h-14` | `px-8 py-3` | `text-lg` |
| `xl` | `h-16` | `px-10 py-4` | `text-xl` |
| `icon` | `h-11 w-11` | `p-0` | — |

## API 参考

<ComponentApi name="button" />

## 可访问性

- **键盘操作**：支持 `Space` / `Enter` 触发点击
- **ARIA 属性**：禁用状态自动设置 `disabled` 属性（非 `asChild` 模式）或 `aria-disabled="true"`（`asChild` 模式）；加载状态自动设置 `aria-busy="true"`
- **焦点管理**：支持键盘导航和焦点样式（`focus:outline`）
