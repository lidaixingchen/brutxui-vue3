---
title: Tooltip 工具提示
description: 工具提示浮层组件，悬停或聚焦时快速展示辅助文本。
---

# Tooltip 工具提示

基于 reka-ui 的 Tooltip 原语构建的新粗野主义风格工具提示，悬停时显示信息文字。

## 预览

<ComponentPreview>
  <TooltipDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="tooltip" />

## 用法

```vue
<script setup>
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Button } from 'brutx-ui-vue'
</script>

<template>
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger as-child>
                <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>This is a tooltip</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</template>
```

## 配合 Provider 使用

用 `TooltipProvider` 包裹你的应用（或某个区域）以启用工具提示：

```vue
<script setup>
import { TooltipProvider } from 'brutx-ui-vue'
</script>

<template>
    <TooltipProvider>
        <router-view />
    </TooltipProvider>
</template>
```

## 触发延迟

通过 `TooltipProvider` 的 `delayDuration` 属性控制从指针进入触发元素到工具提示打开的延迟时间（毫秒）。也可以在单个 `Tooltip` 上通过 `delayDuration` 覆盖全局设置。

```vue
<TooltipProvider :delay-duration="0">
    <Tooltip>
        <TooltipTrigger>
            <Button>立即显示</Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>无延迟</p>
        </TooltipContent>
    </Tooltip>
</TooltipProvider>

<TooltipProvider>
    <Tooltip :delay-duration="1500">
        <TooltipTrigger>
            <Button>长延迟</Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>覆盖为 1500ms</p>
        </TooltipContent>
    </Tooltip>
</TooltipProvider>
```

## 受控模式

通过 `open` 和 `@update:open` 控制工具提示的显示状态：

```vue
<script setup>
import { ref } from 'vue'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Button } from 'brutx-ui-vue'

const isOpen = ref(false)
</script>

<template>
    <TooltipProvider>
        <Tooltip v-model:open="isOpen">
            <TooltipTrigger as-child>
                <Button variant="outline">受控工具提示</Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>当前状态：{{ isOpen ? '打开' : '关闭' }}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `TooltipProvider` | 上下文提供者（必需的祖先组件） |
| `Tooltip` | 根组件（从 reka-ui 的 `TooltipRoot` 重新导出） |
| `TooltipTrigger` | 悬停时触发工具提示的元素 |
| `TooltipContent` | 工具提示内容面板 |

## Props

### TooltipProvider

从 reka-ui 的 `TooltipProvider` 重新导出，为所有后代工具提示提供全局配置。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `delayDuration` | `number` | `400` | 指针进入触发元素后到工具提示打开的延迟时间（毫秒） |
| `skipDelayDuration` | `number` | `300` | 从一个工具提示移到另一个时跳过延迟的时间窗口（毫秒） |
| `disableHoverableContent` | `boolean` | `false` | 为 `true` 时，指针移入内容区域会关闭工具提示 |
| `disableClosingTrigger` | `boolean` | `false` | 为 `true` 时，点击触发元素不会关闭工具提示 |
| `disabled` | `boolean` | `false` | 为 `true` 时，禁用所有工具提示 |
| `ignoreNonKeyboardFocus` | `boolean` | `false` | 为 `true` 时，仅通过键盘聚焦（`:focus-visible`）才触发工具提示 |

### Tooltip

从 reka-ui 的 `TooltipRoot` 重新导出，管理单个工具提示的状态。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `defaultOpen` | `boolean` | — | 非受控模式下的初始打开状态 |
| `open` | `boolean` | — | 受控的打开状态 |
| `delayDuration` | `number` | `700` | 覆盖 Provider 的延迟时间，针对单个工具提示自定义 |
| `disableHoverableContent` | `boolean` | — | 继承自 Provider，可单独覆盖 |
| `disableClosingTrigger` | `boolean` | `false` | 为 `true` 时，点击触发元素不会关闭工具提示 |
| `disabled` | `boolean` | `false` | 为 `true` 时，禁用此工具提示 |
| `ignoreNonKeyboardFocus` | `boolean` | `false` | 为 `true` 时，仅键盘聚焦才触发 |

### TooltipTrigger

触发器组件，悬停或聚焦时打开工具提示。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `as` | `string \| Component` | `'button'` | 渲染的元素类型 |
| `asChild` | `boolean` | — | 将样式渲染到子元素上 |

### TooltipContent

工具提示内容面板，使用新粗野主义风格。默认通过 Portal 渲染到 `body`。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sideOffset` | `number` | `6` | 与触发器的距离（像素） |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | 显示方向 |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | 相对触发器的对齐方式 |
| `alignOffset` | `number` | — | 对齐偏移量（像素） |
| `avoidCollisions` | `boolean` | — | 是否自动避开碰撞 |
| `collisionBoundary` | `Element \| Element[]` | — | 碰撞检测边界 |
| `collisionPadding` | `number \| Record<string, number>` | — | 碰撞检测内边距 |
| `arrowPadding` | `number` | — | 箭头内边距 |
| `sticky` | `'partial' \| 'always'` | — | 粘性定位策略 |
| `hideWhenDetached` | `boolean` | — | 被遮挡时隐藏 |
| `forceMount` | `boolean` | — | 强制挂载（用于自定义动画控制） |
| `ariaLabel` | `string` | — | 屏幕阅读器标签 |
| `class` | `string` | — | 自定义 CSS 类名 |

## Events

### Tooltip 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:open` | `value: boolean` | 打开状态变化时触发 |

### TooltipContent 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `escapeKeyDown` | `KeyboardEvent` | 按下 Escape 键时触发，可阻止默认行为 |
| `pointerDownOutside` | `Event` | 在外部按下指针时触发，可阻止默认行为 |

## Slots

### Tooltip 插槽

| 插槽 | 参数 | 说明 |
|------|------|------|
| `default` | `{ open: boolean }` | 作用域插槽，提供当前打开状态 |

### TooltipTrigger / TooltipContent 插槽

| 插槽 | 说明 |
|------|------|
| `default` | 默认插槽内容 |

## 无障碍

- 工具提示在悬停和聚焦时出现
- 按 `Escape` 键关闭工具提示
- 工具提示内容可被屏幕阅读器朗读
- 支持 `ignoreNonKeyboardFocus` 避免非键盘操作触发
- 通过 `ariaLabel` 提供更精确的屏幕阅读器描述
