---
title: CopyToClipboard 复制按钮
description: 带有强烈触感和物理拟真反馈的复制按钮组件，能够一键复制指定文本。
---

# CopyToClipboard 复制按钮

一键复制到剪贴板组件，当用户点击并成功复制时，按钮会在 2 秒内显示成功的物理压下状态及绿色徽标反馈。

## 预览

<ComponentPreview>
  <CopyToClipboardDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="copy-to-clipboard" />

## 用法

```vue
<script setup>
import { CopyToClipboard } from 'brutx-ui-vue'
</script>

<template>
    <CopyToClipboard text="pnpm install brutx-ui-vue" />
</template>
```

### 自定义展示插槽

组件提供了默认插槽，它暴露了 `copied` 状态（是否刚复制成功），支持您自定义按钮的各种显示形式。

```vue
<script setup>
import { CopyToClipboard } from 'brutx-ui-vue'
</script>

<template>
    <CopyToClipboard text="Custom Text">
        <template #default="{ copied }">
            <span>{{ copied ? '成功啦！' : '点此复制' }}</span>
        </template>
    </CopyToClipboard>
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 默认背景，标准前景色文字 |
| `primary` | Primary（珊瑚色）背景，高对比前景色 |
| `outline` | 透明背景，仅保留描边和阴影 |

```vue
<script setup>
import { CopyToClipboard } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-wrap items-center gap-3">
        <CopyToClipboard text="default" variant="default" />
        <CopyToClipboard text="primary" variant="primary" />
        <CopyToClipboard text="outline" variant="outline" />
    </div>
</template>
```

## 尺寸

| 尺寸 | 说明 |
|------|------|
| `sm` | 小尺寸，高度 `h-9`，内边距 `px-3`，字体 `text-sm` |
| `default` | 默认尺寸，高度 `h-11`，内边距 `px-5`，字体 `text-base` |
| `lg` | 大尺寸，高度 `h-14`，内边距 `px-7`，字体 `text-lg` |

```vue
<script setup>
import { CopyToClipboard } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-wrap items-center gap-3">
        <CopyToClipboard text="sm" size="sm" />
        <CopyToClipboard text="default" size="default" />
        <CopyToClipboard text="lg" size="lg" />
    </div>
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `text` | `string` | — | 需要拷贝到剪贴板的文本（必填） |
| `duration` | `number` | `2000` | 复制成功反馈（"已复制"状态）的保持毫秒数 |
| `variant` | `'default' \| 'primary' \| 'outline'` | `'default'` | 按钮颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 按钮尺寸预设 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 图标尺寸预设 |
| `class` | `string` | `undefined` | 按钮容器自定义样式类 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ copied: boolean }` | 自定义按钮内容，`copied` 表示是否刚复制成功 |

```vue
<script setup>
import { CopyToClipboard } from 'brutx-ui-vue'
</script>

<template>
    <CopyToClipboard text="Custom Text">
        <template #default="{ copied }">
            <span>{{ copied ? '成功啦！' : '点此复制' }}</span>
        </template>
    </CopyToClipboard>
</template>
```

## 可访问性

- **键盘操作**：支持 `Enter` / `Space` 触发复制操作
- **ARIA 属性**：按钮包含复制状态的文本描述
