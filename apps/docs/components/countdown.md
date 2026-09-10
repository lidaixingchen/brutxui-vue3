---
title: Countdown 倒计时
description: 基于绝对时间戳差值的倒计时组件，支持格式化、毫秒刷新、后台休眠自校准与读屏到期播报。
---

# Countdown 倒计时

精准倒计时组件，核心调度基于系统绝对时间戳差值计算。当浏览器标签页从后台休眠唤醒时自适应校准，杜绝累积定时器漂移，并内置读屏高频降噪与到期通知。

## 预览

<ComponentPreview>
  <CountdownDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="countdown" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Countdown } from 'brutx-ui-vue'

const targetTime = ref(Date.now() + 1000 * 60 * 60 * 24)
</script>

<template>
    <!-- 基础倒计时 -->
    <Countdown title="剩余时间" :value="targetTime" />

    <!-- 自定义时间格式与卡片变体 -->
    <Countdown
        title="活动截止"
        :value="targetTime"
        format="DD [天] HH [时] mm [分] ss [秒]"
        variant="card"
    />
</template>
```

### 毫秒级刷新与格式化转义

在 `format` 格式化字符串中包含 `SSS` 时会自动以高频（~30fps）刷新毫秒。普通文本字符若包含保留标识（如 `D`、`H`、`m`、`s`）时，可用方括号 `[...]` 包裹转义：

```vue
<template>
    <Countdown
        title="秒杀倒计时"
        :value="Date.now() + 60000"
        format="mm:ss.SSS"
        variant="card"
    />
</template>
```

### 到期回调

通过 `@finish` 监听倒计时归零事件，通过 `@change` 监听剩余毫秒数变化：

```vue
<script setup>
import { Countdown } from 'brutx-ui-vue'

function onFinish() {
    console.log('倒计时结束！')
}

function onChange(remainingMs: number) {
    console.log('剩余毫秒:', remainingMs)
}
</script>

<template>
    <Countdown
        :value="Date.now() + 5000"
        @finish="onFinish"
        @change="onChange"
    />
</template>
```

## 变体

| 变体 | 说明 |
| ---- | ---- |
| `default` | 默认变体，轻量内联排版，无额外背景与边框 |
| `card` | 粗野主义卡片，3px 黑色硬边框、硬阴影、内边距与圆角 |
| `bordered` | 粗黑硬边框卡片，无投影 |
| `subtle` | 浅色高亮背景卡片，带粗黑边框与硬阴影 |

```vue
<template>
    <Countdown title="Default" :value="targetTime" variant="default" />
    <Countdown title="Card" :value="targetTime" variant="card" />
    <Countdown title="Bordered" :value="targetTime" variant="bordered" />
    <Countdown title="Subtle" :value="targetTime" variant="subtle" />
</template>
```

## 尺寸

| 尺寸 | 标题字号 | 数值字号 |
| ---- | -------- | -------- |
| `sm` | `text-xs` | `text-2xl` |
| `default` | `text-sm` | `text-3xl sm:text-4xl` |
| `lg` | `text-base` | `text-4xl sm:text-5xl` |

```vue
<template>
    <Countdown title="小型" :value="targetTime" size="sm" variant="card" />
    <Countdown title="标准" :value="targetTime" size="default" variant="card" />
    <Countdown title="大型" :value="targetTime" size="lg" variant="card" />
</template>
```

## 导出类型

组件导出了变体函数与格式化解析工具函数：

```ts
import type {
    CountdownProps,
    CountdownValue,
    CountdownEmits,
    CountdownVariantProps,
} from 'brutx-ui-vue'
import {
    countdownVariants,
    parseCountdownTarget,
    formatCountdown,
} from 'brutx-ui-vue'
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `value` | `number \| string \| Date \| null` | `undefined` | 倒计时目标时间点，支持时间戳毫秒数、Date 对象或日期字符串 |
| `format` | `string` | `'HH:mm:ss'` | 格式化模板，支持 `DD`、`D`、`HH`、`H`、`mm`、`m`、`ss`、`s`、`SSS`、`SS`、`S`，支持 `[...]` 转义 |
| `title` | `string` | `undefined` | 倒计时标题文本 |
| `prefix` | `string` | `undefined` | 数值前缀文本 |
| `suffix` | `string` | `undefined` | 数值后缀文本 |
| `placeholder` | `string` | `'-'` | 目标时间未指定或无效时的占位文本 |
| `variant` | `'default' \| 'card' \| 'bordered' \| 'subtle'` | `'default'` | 容器视觉变体 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 尺寸规格 |
| `class` | `string` | `undefined` | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
| ---- | ---- | ---- |
| `finish` | — | 倒计时归零到期时触发（单次执行） |
| `change` | `remaining: number` | 每次倒计时更新时触发，参数为剩余时间毫秒数 |

## 插槽

| 插槽 | 作用域 | 说明 |
| ---- | ------ | ---- |
| `default` | `{ remaining: number; formatted: string; isFinished: boolean }` | 自定义倒计时内容展示 |
| `title` | `{ title?: string }` | 自定义标题区域内容 |
| `prefix` | `{ prefix?: string }` | 自定义前缀区域内容 |
| `suffix` | `{ suffix?: string }` | 自定义后缀区域内容 |

## 可访问性

- **键盘操作**：时序展示类组件，不捕获键盘输入；嵌套在交互区块中时，焦点遵循 DOM 正常流转。
- **ARIA 属性**：高频走字期间保持 `aria-live` 静默，防止屏幕阅读器频繁读秒骚扰用户；倒计时到达零值时通过 `aria-live="polite"` 触发一次性完成语音通知。
- **焦点管理**：无内部模态或焦点锁定，不干预辅助技术正常光标导航。
- **动效降级**：数字更新遵循等宽排版（`font-mono`），杜绝数字变动引发的布局抖动；SSR 阶段输出确定性静态内容，挂载后平滑接管，杜绝首帧水合错位。
