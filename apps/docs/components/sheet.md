---
title: Sheet 抽屉
description: 滑动抽屉组件，支持从上、下、左、右四个方向滑出。
---

# Sheet 抽屉

新粗野主义风格的侧边面板组件，可从任意边缘滑入。基于 reka-ui 的 Dialog 原语构建。

## 预览

<ComponentPreview>
  <SheetDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="sheet" />

## 用法

```vue
<script setup>
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
    SheetClose,
    Button,
} from 'brutx-ui-vue'
</script>

<template>
    <Sheet>
        <SheetTrigger as-child>
            <Button variant="outline">Open Sheet</Button>
        </SheetTrigger>
        <SheetContent side="right">
            <SheetHeader>
                <SheetTitle>Edit Profile</SheetTitle>
                <SheetDescription>
                    Make changes to your profile here.
                </SheetDescription>
            </SheetHeader>
            <div class="py-4">
                <p class="text-sm">Sheet content goes here.</p>
            </div>
            <SheetFooter>
                <SheetClose as-child>
                    <Button variant="outline">Cancel</Button>
                </SheetClose>
                <Button variant="primary">Save</Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>
</template>
```

### 方向变体

| 方向 | 说明 |
|------|------|
| `top` | 从顶部滑入 |
| `bottom` | 从底部滑入 |
| `left` | 从左侧滑入（最大 `sm:max-w-sm`） |
| `right` | 从右侧滑入（默认，最大 `sm:max-w-sm`） |

```vue
<script setup>
import { Sheet, SheetTrigger, SheetContent, Button } from 'brutx-ui-vue'
</script>

<template>
    <Sheet>
        <SheetTrigger as-child>
            <Button>Open Left Sheet</Button>
        </SheetTrigger>
        <SheetContent side="left">
            <p>Content slides in from the left.</p>
        </SheetContent>
    </Sheet>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `Sheet` | 根组件（从 reka-ui 重新导出的 `DialogRoot`） |
| `SheetTrigger` | 打开面板的触发器（从 reka-ui 重新导出的 `DialogTrigger`） |
| `SheetPortal` | 渲染 portal 容器（从 reka-ui 重新导出的 `DialogPortal`） |
| `SheetContent` | 带方向变体的面板内容，内置关闭按钮 |
| `SheetHeader` | 头部容器 |
| `SheetFooter` | 底部容器 |
| `SheetTitle` | 面板标题（从 reka-ui 重新导出的 `DialogTitle`） |
| `SheetDescription` | 面板描述文字（从 reka-ui 重新导出的 `DialogDescription`） |
| `SheetClose` | 关闭按钮（从 reka-ui 重新导出的 `DialogClose`） |

## Props

### Sheet

根组件，继承 reka-ui `DialogRoot` 的全部属性。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | — | 受控的打开状态 |
| `defaultOpen` | `boolean` | — | 非受控的默认打开状态 |
| `modal` | `boolean` | `true` | 是否为模态对话框 |

### SheetContent

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'right'` | 面板滑出方向 |
| `class` | `string` | — | 自定义样式类 |

> **注意：** `SheetContent` 内置了关闭按钮（右上角或左上角的 X 图标，当 `side="left"` 时位于左上角），无需手动添加。关闭按钮的辅助文字支持国际化（`sheet.close`）。

### SheetHeader / SheetFooter / SheetTitle / SheetDescription

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 自定义样式类 |

## 事件

### Sheet

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:open` | `boolean` | 打开状态变化时触发，用于 `v-model:open` 双向绑定 |
| `open-change` | `boolean` | 打开状态变化时触发 |

### SheetContent

继承 reka-ui `DialogContent` 的全部事件。

| 事件 | 参数 | 说明 |
|------|------|------|
| `open-auto-focus` | `Event` | 内容打开后自动聚焦时触发 |
| `close-auto-focus` | `Event` | 内容关闭后自动聚焦时触发 |
| `interact-outside` | `InteractOutsideEvent` | 在内容外部交互时触发 |
| `escape-key-down` | `KeyboardEvent` | 按下 Escape 键时触发 |
| `pointer-down-outside` | `PointerDownOutsideEvent` | 在内容外部按下指针时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 默认插槽，用于放置 `SheetTrigger`、`SheetContent` 等子组件 |

### SheetContent

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 默认插槽，用于放置面板内容（`SheetHeader`、内容区域、`SheetFooter` 等） |

### SheetHeader / SheetFooter / SheetTitle / SheetDescription

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 默认插槽 |

## 可访问性

- **键盘操作**：支持 `Escape` 关闭面板
- **ARIA 属性**：自动管理 `aria-labelledby`（关联 `SheetTitle`）、`aria-describedby`（关联 `SheetDescription`）
- **焦点管理**：打开时焦点锁定在面板内，关闭时恢复焦点到触发器
