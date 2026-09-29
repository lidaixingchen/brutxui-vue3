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
import { PopoverRoot as Popover, PopoverTrigger, PopoverAnchor } from 'reka-ui'
import { PopoverContent, Button } from 'brutx-ui-vue'
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

## API 参考

<span id="popover-根组件"></span>
<span id="popovertrigger-触发器"></span>
<span id="popovercontent-内容面板"></span>
<span id="popoveranchor-锚点"></span>
<span id="事件"></span>
<span id="popover-根组件事件"></span>
<span id="popovercontent-事件"></span>
<span id="插槽"></span>
<span id="popover-根组件插槽"></span>
<span id="popovertrigger-popovercontent-popoveranchor-插槽"></span>

<ComponentApi name="popover" />

### Reka UI 原语的扩展能力

`Popover` 包装 Reka UI 的 `PopoverRoot`；`PopoverTrigger` 和 `PopoverContent` 包装对应原语。`PopoverAnchor` 仍从 `reka-ui` 导入。上方 API 展示本地组件声明的成员；`PopoverContent` 将未声明的 Vue 属性和事件监听器透传给 Reka UI 原语，包括 `openAutoFocus`、`closeAutoFocus`、`pointerDownOutside`、`interactOutside`、`escapeKeyDown` 和 `focusOutside`。

## 可访问性

- **键盘操作**：按 `Escape` 关闭弹出层
- **ARIA 属性**：弹出层使用 `role="dialog"` 语义，自动关联 `aria-labelledby` 到触发器
- **焦点管理**：弹出层打开时自动聚焦
- **交互行为**：点击外部区域关闭弹出层；模态模式下禁用与外部元素的交互

## 与 Popconfirm 的关系

[Popconfirm 气泡确认框](/components/popconfirm) 本质上是 Popover + 确认/取消按钮的组合封装。它内部直接使用 `Popover`/`PopoverTrigger`/`PopoverContent`，并附加了 `TriangleAlert` 警告图标和确认/取消按钮逻辑。

### 何时使用 Popconfirm

- 只需要简单的"确认/取消"二选一操作
- 希望开箱即用，不需要自行组装按钮和事件
- 需要一致的危险操作确认体验

### 何时使用 Popover 手动组合

- 需要自定义按钮文案、样式或布局
- 需要在弹出层中放置表单、列表等复杂内容
- 需要更细粒度地控制打开/关闭时机

```vue
<!-- Popconfirm：一行搞定确认操作 -->
<Popconfirm title="确定删除？" @confirm="handleDelete">
    <Button variant="destructive">删除</Button>
</Popconfirm>

<!-- Popover 手动组合：完全自定义 -->
<Popover>
    <PopoverTrigger as-child>
        <Button variant="outline">自定义</Button>
    </PopoverTrigger>
    <PopoverContent>
        <!-- 任意内容：表单、列表、自定义按钮等 -->
    </PopoverContent>
</Popover>
```
