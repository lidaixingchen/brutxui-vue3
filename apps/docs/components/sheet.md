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
import { DialogRoot as Sheet, DialogTrigger as SheetTrigger, DialogClose as SheetClose } from 'reka-ui'
import {
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
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
import { DialogRoot as Sheet, DialogTrigger as SheetTrigger } from 'reka-ui'
import { SheetContent, Button } from 'brutx-ui-vue'
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
| `Sheet` | 根原语（从 reka-ui 导入 `DialogRoot` 并命名为 Sheet） |
| `SheetTrigger` | 触发原语（从 reka-ui 导入 `DialogTrigger`） |
| `SheetPortal` | 传送容器原语（从 reka-ui 导入 `DialogPortal`） |
| `SheetContent` | 带方向变体的面板内容，内置关闭按钮 |
| `SheetHeader` | 头部容器 |
| `SheetFooter` | 底部容器 |
| `SheetTitle` | 带样式的面板标题，包装 Reka UI DialogTitle |
| `SheetDescription` | 带样式的面板描述，包装 Reka UI DialogDescription |
| `SheetClose` | 关闭原语（从 reka-ui 导入 `DialogClose`） |

## Reka UI 原语

`Sheet`、`SheetTrigger`、`SheetPortal` 和 `SheetClose` 分别是从 `reka-ui` 导入的 `DialogRoot`、`DialogTrigger`、`DialogPortal` 和 `DialogClose` 的本地别名。下方生成 API 中的五个样式组件从 BrutxUI 导入。

`Sheet` 使用布尔值 `open` 和 `v-model:open` 控制打开状态，通过 `update:open` 发出新的布尔状态。`defaultOpen` 设置非受控初始状态，默认 false；`modal` 默认 true。默认插槽用于放置触发器与面板，并提供当前 `open` 状态和 `close()` 方法。

`SheetContent` 将其他属性和事件监听器传给 `DialogContent`。例如 `openAutoFocus` 可在模板中使用 `@open-auto-focus` 监听。内置关闭按钮使用 `sheet.close` 本地化文本；`side="left"` 时位于左上角，其余方向位于右上角。

## API 参考

<span id="sheet"></span>
<span id="sheetcontent"></span>
<span id="sheetheader-sheetfooter-sheettitle-sheetdescription"></span>
<span id="事件"></span>
<span id="sheet-1"></span>
<span id="sheetcontent-1"></span>
<span id="插槽"></span>
<span id="sheetcontent-2"></span>
<span id="sheetheader-sheetfooter-sheettitle-sheetdescription-1"></span>

<ComponentApi name="sheet" />

## 可访问性

- **键盘操作**：支持 `Escape` 关闭面板
- **ARIA 属性**：自动管理 `aria-labelledby`（关联 `SheetTitle`）、`aria-describedby`（关联 `SheetDescription`）
- **焦点管理**：打开时焦点锁定在面板内，关闭时恢复焦点到触发器
