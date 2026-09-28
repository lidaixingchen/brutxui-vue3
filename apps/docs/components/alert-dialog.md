---
title: AlertDialog 提示对话框
description: 提示对话框组件，用于需要用户明确确认的操作，无障碍适配良好。
---

# AlertDialog 提示对话框

新粗野主义风格的确认对话框，需要用户交互。基于 reka-ui 的 AlertDialog 原语构建。

## 预览

<ComponentPreview>
  <AlertDialogDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="alert-dialog" />

## 用法

```vue
<script setup>
import { AlertDialogRoot as AlertDialog, AlertDialogTrigger } from 'reka-ui'
import { AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <AlertDialog>
        <AlertDialogTrigger as-child>
            <Button variant="danger">Delete Account</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your data.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `AlertDialog` | 根组件（需从 reka-ui 导入：`import { AlertDialogRoot as AlertDialog } from 'reka-ui'`） |
| `AlertDialogTrigger` | 打开对话框的按钮（需从 reka-ui 导入：`import { AlertDialogTrigger } from 'reka-ui'`） |
| `AlertDialogPortal` | 传送门组件（需从 reka-ui 导入：`import { AlertDialogPortal } from 'reka-ui'`） |
| `AlertDialogContent` | 对话框内容面板 |
| `AlertDialogHeader` | 标题和描述的头部容器 |
| `AlertDialogFooter` | 操作按钮的底部容器 |
| `AlertDialogTitle` | 对话框标题 |
| `AlertDialogDescription` | 对话框描述文本 |
| `AlertDialogAction` | 确认操作按钮 |
| `AlertDialogCancel` | 关闭对话框的取消按钮 |

## API 参考

<span id="alertdialogcontent"></span>
<span id="alertdialogheader"></span>
<span id="alertdialogfooter"></span>
<span id="alertdialogtitle"></span>
<span id="alertdialogdescription"></span>
<span id="alertdialogaction"></span>
<span id="alertdialogcancel"></span>
<span id="插槽"></span>

<ComponentApi name="alert-dialog" />

### Reka UI 原语

`AlertDialogRoot`（示例中命名为 `AlertDialog`）、`AlertDialogTrigger` 和 `AlertDialogPortal` 从 `reka-ui` 导入。上方 API 清单覆盖 BrutxUI 的七个公开子组件；`AlertDialogContent` 已在内部组合 Portal 和遮罩层，额外的属性及监听器会转发到内容原语，例如 `aria-*`、`data-*`、`style` 和 `@escape-key-down`。

`AlertDialogCancel` 使用 `outline` 按钮变体。`AlertDialogTitle` 通过默认插槽提供标题；缺少可渲染内容时显示英文占位文本 `Alert`，业务应提供对应语言的明确标题。

### 原生属性与事件

`AlertDialogAction` 显式继承 Reka `PrimitiveProps` 和 Vue `ButtonHTMLAttributes` 的属性。API 清单保留这些继承成员，包括 HTML 属性、ARIA 属性和 `on*` 事件监听器。默认根元素是 `button`，其类型回退为 `button`；使用 `as` 或 `asChild` 时，属性的实际效果取决于渲染元素。例如，媒体事件需要媒体根元素，表单事件发生在表单上，ARIA 状态须符合当前元素角色。

`onClick` 等监听器可在模板中写为 `@click`。激活 `AlertDialogAction` 会请求关闭对话框，异步处理函数不会延迟该关闭请求；需要业务决定关闭时机时，通过 `AlertDialogRoot` 的受控 `open` 状态管理。

继承属性的语义可查阅 [HTML 按钮属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button) 与 [RDFa 属性定义](https://www.w3.org/TR/rdfa-core/#s_syntax)。`autosave`、`results` 等浏览器扩展的适用范围见 [Safari HTML 属性参考](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/Attributes.html)。

## 可访问性

- **键盘操作**：按 `Escape` 关闭对话框；`AlertDialogCancel` 点击后关闭对话框；`AlertDialogAction` 确认并关闭对话框
- **ARIA 属性**：对话框使用语义化的 `role="alertdialog"` 属性
- **焦点管理**：对话框打开时，焦点被限制在对话框内
