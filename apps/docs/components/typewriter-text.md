---
title: TypewriterText 打字机文本
description: 逐字符显示的打字机动画效果组件，支持循环播放、光标闪烁和无障碍支持。
---

# TypewriterText 打字机文本

新粗野主义风格的打字机效果文本组件，逐字符显示文本并带有闪烁光标动画。适用于引导页、欢迎语、代码展示等场景。

## 安装

<InstallationTabs componentName="typewriter-text" />

## 用法

```vue
<script setup>
import { TypewriterText } from 'brutx-ui-vue'
</script>

<template>
    <TypewriterText
        text="欢迎使用 BrutxUI！"
        :speed="80"
        cursor
    />
</template>
```

## 循环播放

```vue
<template>
    <TypewriterText
        text="持续打字效果..."
        :speed="60"
        :delay="2000"
        loop
        cursor
    />
</template>
```

## 尺寸和粗细

```vue
<template>
    <TypewriterText
        text="大号粗体文本"
        size="xl"
        weight="bold"
        :speed="100"
    />
</template>
```

## 事件监听

```vue
<script setup>
import { TypewriterText } from 'brutx-ui-vue'

function onStart() {
    console.log('开始打字')
}

function onComplete() {
    console.log('打字完成')
}
</script>

<template>
    <TypewriterText
        text="打字完成后触发回调"
        :speed="80"
        @start="onStart"
        @complete="onComplete"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `text` | `string` | —（必填） | 要显示的文本 |
| `speed` | `number` | `50` | 打字速度（毫秒/字符） |
| `delay` | `number` | `0` | 开始延迟（毫秒） |
| `loop` | `boolean` | `false` | 是否循环播放 |
| `cursor` | `boolean` | `true` | 是否显示光标 |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 文本尺寸 |
| `weight` | `'normal' \| 'medium' \| 'bold' \| 'black'` | `'normal'` | 文本粗细 |
| `class` | `string` | — | 自定义类名 |

## 事件

| 事件 | 说明 |
|------|------|
| `start` | 打字开始时触发 |
| `complete` | 打字完成时触发 |

## 尺寸变体

| 尺寸 | CSS 类 |
|------|--------|
| `sm` | `text-sm` |
| `default` | `text-base` |
| `lg` | `text-lg` |
| `xl` | `text-xl` |
| `2xl` | `text-2xl` |

## 粗细变体

| 粗细 | CSS 类 |
|------|--------|
| `normal` | `font-normal` |
| `medium` | `font-medium` |
| `bold` | `font-bold` |
| `black` | `font-black` |

## 无障碍

- 组件使用 `aria-live="polite"` 确保屏幕阅读器能感知文本变化
- 光标使用 `aria-hidden="true"` 标记为装饰性元素
- 当用户偏好 `prefers-reduced-motion: reduce` 时，直接显示完整文本，跳过动画

## 注意事项

- `text` 属性变化时会重新开始打字动画
- 组件卸载时会自动清理定时器，避免内存泄漏
- 循环模式下，打字完成后会等待 `delay` 毫秒后重新开始
