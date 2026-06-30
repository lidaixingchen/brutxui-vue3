---
title: Popover 弹出层
description: 浮层弹出框，支持在指定元素周围展示复杂的气泡内容。
---

# Popover 弹出层

新粗野主义风格的弹出层组件，用于显示锚定到触发元素的浮动内容。基于 reka-ui 的 `PopoverRoot` 构建，支持模态/非模态模式、自定义锚点定位。

## 预览

<ComponentPreview>
  <PopoverDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="popover" />

## 用法

```vue
<script setup>
import { Popover, PopoverTrigger, PopoverAnchor, PopoverContent, Button } from 'brutx-ui-vue'
</script>

<template>
    <Popover>
        <PopoverTrigger as-child>
            <Button variant="outline">Open Popover</Button>
        </PopoverTrigger>
        <PopoverContent>
            <div class="grid gap-4">
                <div class="space-y-2">
                    <h4 class="font-black leading-none">Dimensions</h4>
                    <p class="text-sm text-brutal-muted-foreground">
                        Set the dimensions for the layer.
                    </p>
                </div>
            </div>
        </PopoverContent>
    </Popover>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `Popover` | 根组件（从 reka-ui 的 `PopoverRoot` 重新导出） |
| `PopoverTrigger` | 打开弹出层的按钮 |
| `PopoverContent` | 弹出层内容面板 |
| `PopoverAnchor` | 用于定位的锚点元素 |

## Props

### Popover 根组件

从 reka-ui 的 `PopoverRoot` 重新导出，管理弹出层的打开/关闭状态。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | — | 受控的打开状态 |
| `defaultOpen` | `boolean` | `false` | 非受控模式下的初始打开状态 |
| `modal` | `boolean` | `false` | 模态模式，启用时禁用与外部元素的交互 |

### PopoverTrigger 触发器

触发器组件，默认渲染为 `button` 元素。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `as` | `string \| Component` | `'button'` | 渲染的元素类型 |
| `asChild` | `boolean` | — | 将样式渲染到子元素上 |

### PopoverContent 内容面板

弹出层内容面板，使用新粗野主义风格。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | 相对于触发器的对齐方式 |
| `sideOffset` | `number` | `8` | 与触发器的距离（像素） |
| `class` | `string` | — | 自定义 CSS 类名 |

### PopoverAnchor 锚点

自定义锚点元素，用于精确定位弹出层位置。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `reference` | `ReferenceElement` | — | 自定义定位参考元素 |

## 事件

### Popover 根组件事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:open` | `value: boolean` | 打开状态变化时触发 |

### PopoverContent 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `openAutoFocus` | `Event` | 打开时自动聚焦触发，可阻止 |
| `closeAutoFocus` | `Event` | 关闭时自动聚焦触发，可阻止 |
| `pointerDownOutside` | `Event` | 在外部按下指针时触发 |
| `interactOutside` | `Event` | 在外部交互时触发 |
| `escapeKeyDown` | `Event` | 按下 Escape 键时触发 |
| `focusOutside` | `Event` | 焦点移出时触发 |

## 插槽

### Popover 根组件插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ open: boolean, close: () => void }` | 作用域插槽，提供当前状态和关闭方法 |

### PopoverTrigger / PopoverContent / PopoverAnchor 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 默认插槽内容 |

## 可访问性

- **键盘操作**：按 `Escape` 关闭弹出层
- **ARIA 属性**：弹出层使用 `role="dialog"` 语义，自动关联 `aria-labelledby` 到触发器
- **焦点管理**：弹出层打开时自动聚焦
- **交互行为**：点击外部区域关闭弹出层；模态模式下禁用与外部元素的交互
