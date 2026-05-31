# Dialog

新粗野主义风格的模态对话框，基于 reka-ui 的 Dialog 原语构建。支持遮罩层、关闭按钮和可组合的子组件。

## 预览

<ComponentPreview>
  <div class="border-3 border-brutal bg-brutal-bg shadow-brutal-xl p-6 max-w-md">
    <div class="mb-4">
      <h2 class="text-lg font-black tracking-tight">Edit Profile</h2>
      <p class="text-sm text-brutal-muted-foreground mt-1">Make changes to your profile here.</p>
    </div>
    <div class="py-4">
      <p class="text-sm">Dialog content goes here.</p>
    </div>
    <div class="flex justify-end gap-3 pt-4">
      <button class="px-4 py-2 border-3 border-brutal shadow-brutal font-bold text-sm active:translate-y-[2px] active:shadow-none transition-all">Cancel</button>
      <button class="px-4 py-2 bg-brutal-primary text-brutal-fg border-3 border-brutal shadow-brutal font-bold text-sm active:translate-y-[2px] active:shadow-none transition-all">Save</button>
    </div>
  </div>
</ComponentPreview>

## 安装

<InstallationTabs componentName="dialog" />

## 用法

```vue
<script setup>
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui'
import Button from '@/components/ui/Button.vue'
</script>

<template>
    <Dialog>
        <DialogTrigger as-child>
            <Button variant="primary">Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose as-child>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="primary">Save</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `Dialog` | 根组件（从 reka-ui 的 `DialogRoot` 重新导出） |
| `DialogTrigger` | 打开对话框的按钮 |
| `DialogContent` | 带遮罩层的对话框内容面板 |
| `DialogHeader` | 头部容器 |
| `DialogFooter` | 底部容器，弹性布局 |
| `DialogTitle` | 对话框标题 |
| `DialogDescription` | 对话框描述文本 |
| `DialogClose` | 关闭按钮 |
| `DialogOverlay` | 背景遮罩层 |

## Props

### DialogContent

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `showCloseButton` | `boolean` | `true` |
| `class` | `string` | — |

### DialogHeader / DialogFooter / DialogTitle / DialogDescription

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |

## 无障碍

- 对话框打开时，焦点被限制在对话框内
- 按 `Escape` 关闭对话框
- 点击遮罩层关闭对话框
- 关闭按钮包含屏幕阅读器文本
