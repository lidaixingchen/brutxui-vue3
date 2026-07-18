# 反馈与浮层组件

## Dialog

模态对话框，基于 reka-ui Dialog 原语构建。

```vue
<Dialog>
  <DialogTrigger as-child><Button>打开</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
      <DialogDescription>描述</DialogDescription>
    </DialogHeader>
    内容
    <DialogFooter>
      <Button variant="outline">取消</Button>
      <Button variant="primary">确认</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

子组件：Dialog, DialogTrigger, DialogPortal, DialogClose, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogEnhanced

### Dialog Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | — | 受控的打开状态 |
| `defaultOpen` | `boolean` | `false` | 非受控模式下的默认打开状态 |
| `modal` | `boolean` | `true` | 是否为模态对话框 |

### DialogContent Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'full'` | `'default'` | 对话框尺寸 |
| `showCloseButton` | `boolean` | `true` | 是否显示关闭按钮 |
| `class` | `string` | — | 自定义样式类 |

### DialogEnhanced（可拖拽/可调整大小）

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `draggable` | `boolean` | `false` | 是否可拖拽 |
| `dragHandle` | `string \| HTMLElement` | — | 拖拽手柄（CSS 选择器或元素） |
| `resizable` | `boolean` | `false` | 是否可调整大小 |
| `minWidth` | `number` | `200` | 最小宽度 |
| `minHeight` | `number` | `150` | 最小高度 |
| `maxWidth` | `number` | — | 最大宽度 |
| `maxHeight` | `number` | — | 最大高度 |
| `fullscreen` | `boolean` | `false` | 全屏模式（占满整个视口） |
| `beforeClose` | `((done) => void) \| (() => boolean \| Promise<boolean>)` | — | 关闭前钩子（支持回调模式和 Promise 模式） |
| `destroyOnClose` | `boolean` | `false` | 关闭后销毁内容 |
| `zIndex` | `number` | — | 自定义层级 |

### Dialog 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:open` | `boolean` | 对话框打开状态变化时触发 |
| `open` | — | 对话框开始打开时触发 |
| `opened` | — | 对话框打开动画完成时触发 |
| `close` | — | 对话框开始关闭时触发 |
| `closed` | — | 对话框关闭动画完成时触发 |

## AlertDialog

确认弹窗，基于 reka-ui AlertDialog 原语构建。

```vue
<AlertDialog>
  <AlertDialogTrigger as-child><Button variant="danger">删除</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确认删除？</AlertDialogTitle>
      <AlertDialogDescription>此操作不可撤销。</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction>确认删除</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

子组件：AlertDialog, AlertDialogTrigger, AlertDialogPortal, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel

### AlertDialogAction Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger' \| 'success' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | 按钮变体 |
| `class` | `string` | — | 自定义样式类 |

> AlertDialogCancel 使用硬编码的 `variant: 'outline'`。

## Alert

```vue
<Alert variant="default">
  <AlertTitle>提示</AlertTitle>
  <AlertDescription>提示信息。</AlertDescription>
</Alert>

<Alert variant="danger" closable @close="handleClose">
  <AlertTitle>错误</AlertTitle>
  <AlertDescription>操作失败。</AlertDescription>
  <template #actions>
    <Button variant="primary" size="sm">重试</Button>
  </template>
</Alert>
```

### Alert Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` | 警告框变体类型 |
| `closable` | `boolean` | `false` | 是否显示关闭按钮 |
| `class` | `string` | — | 自定义样式类 |

### AlertTitle Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `as` | `string \| Component` | `'h5'` | 渲染的 HTML 元素或组件 |
| `asChild` | `boolean` | — | 是否将 props 传递给子元素 |
| `class` | `string` | — | 自定义样式类 |

### Alert 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `close` | — | 点击关闭按钮时触发 |

### Alert 插槽

| 插槽 | 说明 |
|------|------|
| `default` | 提示框主体内容 |
| `actions` | 操作按钮区域，渲染在内容下方 |

## Toast

全局通知气泡系统，提供 `useToast` 组合式函数。

```vue
<script setup lang="ts">
import { useToast, ToastContainer } from 'brutx-ui-vue'
const { success, error, warning, info, addToast, promise } = useToast()

success('成功', '已保存。')
error('错误', '操作失败。')

// 模拟 Promise 函数
const saveData = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 1000))

await promise(saveData(), {
  loading: '保存中...',
  success: '保存成功！',
  error: '保存失败',
})
</script>

<template>
  <ToastContainer />
</template>
```

### ToastItem 类型

```typescript
interface ToastItem {
  id: string
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  size?: 'sm' | 'default' | 'lg'
  title?: string
  description?: string
  duration?: number
  count?: number // 在开启 grouping 合并计数时，表示该 Toast 的重复计数
}
```

### useToast 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `toasts` | `Ref<ToastItem[]>` | 响应式提示列表 |
| `addToast` | `(toast: Omit<ToastItem, 'id'>) => string` | 添加自定义提示 |
| `removeToast` | `(id: string) => void` | 移除指定提示 |
| `clearToasts` | `() => void` | 清除所有提示 |
| `success` | `(title: string, description?: string) => string` | 显示成功提示 |
| `error` | `(title: string, description?: string) => string` | 显示错误提示 |
| `warning` | `(title: string, description?: string) => string` | 显示警告提示 |
| `info` | `(title: string, description?: string) => string` | 显示信息提示 |
| `promise` | `<T>(promise: Promise<T>, options: PromiseToastOptions<T>) => Promise<T>` | 自动追踪 Promise 状态 |

### Toast Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'success' \| 'error' \| 'warning' \| 'info'` | `'default'` | 提示类型 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 尺寸 |
| `title` | `string` | — | 标题文本 |
| `description` | `string` | — | 描述文本 |
| `duration` | `number` | `5000` | 显示时长（毫秒），设为 `0` 则不自动关闭 |
| `pauseOnHover` | `boolean` | `true` | 鼠标悬停时暂停倒计时与进度条动画 |

### ToastContainer Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `position` | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | `'bottom-right'` | 显示位置 |
| `stack` | `{ maxVisible?: number; gap?: number; expandDirection?: 'up' \| 'down' }` | `{ maxVisible: 5, gap: 12 }` | 堆叠配置 |

## Popover

弹出层，基于 reka-ui Popover 原语构建。

```vue
<Popover>
  <PopoverTrigger as-child><Button>打开</Button></PopoverTrigger>
  <PopoverContent align="center" :side-offset="8">弹出内容</PopoverContent>
</Popover>
```

子组件：Popover, PopoverTrigger, PopoverContent, PopoverAnchor

### Popover Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | — | 受控的打开状态 |
| `defaultOpen` | `boolean` | `false` | 非受控模式下的初始打开状态 |
| `modal` | `boolean` | `false` | 模态模式 |

### PopoverContent Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | 相对于触发器的对齐方式 |
| `sideOffset` | `number` | `8` | 与触发器的距离（像素） |
| `class` | `string` | — | 自定义样式类 |

### Popover 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:open` | `boolean` | 打开状态变化时触发 |

## Popconfirm

轻量级的确认气泡弹窗，基于 Popover 构建。

```vue
<Popconfirm
    title="确定要删除此项吗？"
    confirm-button-type="destructive"
    @confirm="handleConfirm"
    @cancel="handleCancel"
>
    <Button variant="destructive">删除</Button>
</Popconfirm>
```

### Popconfirm Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | —（必填） | 确认标题文本 |
| `confirmButtonText` | `string` | locale: `popconfirm.confirm` | 确认按钮文字 |
| `cancelButtonText` | `string` | locale: `popconfirm.cancel` | 取消按钮文字 |
| `confirmButtonType` | `'primary' \| 'destructive'` | `'primary'` | 确认按钮样式 |
| `icon` | `Component` | `TriangleAlert` | 警告图标组件 |
| `cancelable` | `boolean` | `true` | 是否显示取消按钮 |

### Popconfirm 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `confirm` | — | 点击确认按钮时触发 |
| `cancel` | — | 点击取消按钮时触发 |

## Tooltip

工具提示，基于 reka-ui Tooltip 原语构建。需要 `TooltipProvider` 包裹。

```vue
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger as-child><Button>悬停我</Button></TooltipTrigger>
    <TooltipContent :side-offset="6">提示内容</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

子组件：TooltipProvider, Tooltip, TooltipTrigger, TooltipContent

### TooltipProvider Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `delayDuration` | `number` | `400` | 打开延迟时间（毫秒） |
| `skipDelayDuration` | `number` | `300` | 跳过延迟的时间窗口 |
| `disableHoverableContent` | `boolean` | `false` | 指针移入内容区域是否关闭 |
| `disabled` | `boolean` | `false` | 是否禁用所有工具提示 |

### Tooltip Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | — | 受控的打开状态 |
| `delayDuration` | `number` | `700` | 覆盖 Provider 的延迟时间 |
| `disabled` | `boolean` | `false` | 是否禁用此工具提示 |

### TooltipContent Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sideOffset` | `number` | `6` | 与触发器的距离（像素） |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | 显示方向 |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | 相对触发器的对齐方式 |
| `ariaLabel` | `string` | — | 屏幕阅读器标签 |
| `class` | `string` | — | 自定义样式类 |

### Tooltip 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:open` | `boolean` | 打开状态变化时触发 |

## DropdownMenu

下拉菜单，基于 reka-ui DropdownMenu 原语构建。

```vue
<DropdownMenu>
  <DropdownMenuTrigger as-child><Button>菜单</Button></DropdownMenuTrigger>
  <DropdownMenuContent :side-offset="6">
    <DropdownMenuLabel>操作</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>编辑</DropdownMenuItem>
    <DropdownMenuItem>复制</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>删除</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

子组件：DropdownMenu, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuRadioGroup, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSubTrigger, DropdownMenuSubContent

### DropdownMenuContent Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sideOffset` | `number` | `6` | 菜单内容与触发器之间的间距 |
| `class` | `string` | — | 自定义样式类 |

### DropdownMenuItem Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `inset` | `boolean` | — | 是否缩进显示 |
| `class` | `string` | — | 自定义样式类 |

### DropdownMenuCheckboxItem Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `v-model` | `boolean \| 'indeterminate'` | — | 复选框状态 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 勾选图标尺寸 |
| `class` | `string` | — | 自定义样式类 |

### DropdownMenuRadioItem Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | —（必填） | 单选项的值 |
| `class` | `string` | — | 自定义样式类 |

### DropdownMenuSubTrigger Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `inset` | `boolean` | — | 是否缩进显示 |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | 展开图标尺寸 |
| `class` | `string` | — | 自定义样式类 |

## Command

命令面板，基于 reka-ui Listbox 原语构建。

```vue
<Command>
  <CommandInput placeholder="搜索..." />
  <CommandList>
    <CommandEmpty>没有结果</CommandEmpty>
    <CommandGroup title="操作">
      <CommandItem value="new">新建文件</CommandItem>
      <CommandItem value="open">打开设置</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup title="最近">
      <CommandItem value="project-a">项目 A</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

子组件：Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut

### Command Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `disableFilter` | `boolean` | `false` | 禁用内部搜索过滤 |
| `class` | `string` | — | 自定义样式类 |

### CommandDialog Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | `false` | 对话框是否打开，支持 `v-model:open` |
| `title` | `string` | 国际化默认值 | 对话框标题（无障碍访问用） |
| `description` | `string` | 国际化默认值 | 对话框描述（无障碍访问用） |
| `class` | `string` | — | 自定义样式类 |

### CommandInput Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string` | — | 输入框的值，支持 `v-model` |
| `placeholder` | `string` | 国际化默认值 | 占位符文本 |
| `class` | `string` | — | 自定义样式类 |

### CommandItem Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | — | 项目的唯一标识值 |
| `disabled` | `boolean` | — | 是否禁用该项目 |
| `class` | `string` | — | 自定义样式类 |

### CommandGroup Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | — | 分组标题文本 |
| `class` | `string` | — | 自定义样式类 |

### Command 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `string` | 输入值变化时触发 |
| `select` | `string` | 选中项目时触发（CommandItem） |

### 暴露的 API

| 方法/属性 | 类型 | 说明 |
| --- | --- | --- |
| `filterSearch` | `Ref<string>` | 当前搜索关键词，可读写；写入后会触发内部过滤逻辑 |

## InfiniteScroll

无限滚动组件，滚动到底部自动加载更多数据。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { InfiniteScroll } from 'brutx-ui-vue'

interface Item {
  id: number
  name: string
}

const items = ref<Item[]>([])

async function loadMore(): Promise<void> {
    // 加载数据
}
</script>

<template>
    <InfiniteScroll @load="loadMore">
        <div v-for="item in items" :key="item.id">
            {{ item.name }}
        </div>
    </InfiniteScroll>
</template>
```

### InfiniteScroll Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `distance` | `number` | `100` | 触发距离阈值（像素） |
| `delay` | `number` | `200` | 防抖延迟（毫秒） |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `immediate` | `boolean` | `true` | 挂载时是否立即检查 |

### InfiniteScroll 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `load` | — | 需要加载更多数据时触发 |

### useInfiniteScroll composable

```typescript
import { useInfiniteScroll } from 'brutx-ui-vue'

const { isLoading, resetLoading } = useInfiniteScroll(targetRef, {
    distance: 100,
    delay: 200,
    onLoad: async () => {
        // 加载数据
        resetLoading()
    },
})
```

## Loading

加载遮罩组件与指令。支持局部遮罩、整页遮罩、动态提示语以及服务端渲染（SSR）兼容。

### 声明式组件

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Loading } from 'brutx-ui-vue'

const isLoading = ref<boolean>(true)
</script>

<template>
  <Loading :loading="isLoading" text="同步中...">
    <div class="card p-6">
      <h4>核心内容区域</h4>
      <p>这里是需要遮罩的内容...</p>
    </div>
  </Loading>
</template>
```

### 指令式用法 (v-loading)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { vLoading } from 'brutx-ui-vue'

const isLoading = ref<boolean>(true)
</script>

<template>
  <div v-loading="isLoading" v-loading-text="'请求中...'" class="p-6">
    <h4>账户资料</h4>
    <p>内容信息...</p>
  </div>
</template>
```

### Loading Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `loading` | `boolean` | `false` | 是否显示加载遮罩 |
| `text` | `string` | `''` | 自定义加载文案 |
| `class` | `string` | — | 自定义样式类 |

### Loading 插槽

| 插槽 | 说明 |
| --- | --- |
| `default` | 需要被遮罩保护的内容 |

### v-loading 指令修饰属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `v-loading` | `boolean` | 绑定加载状态变量，控制遮罩显示 |
| `v-loading-text` | `string` | 挂载在宿主上的自定义加载文本属性 |

---

## Result

新粗野主义结果反馈组件，用于成功、警告、普通、失败等结果的状态告知。

```vue
<script setup lang="ts">
import { Result, Button } from 'brutx-ui-vue'
</script>

<template>
  <Result
    status="success"
    title="订单支付成功"
    sub-title="您的订单已顺利完成支付，商品将会在 24 小时内发出。"
  >
    <template #extra>
      <Button variant="primary">查看订单</Button>
      <Button variant="outline" class="ml-3">返回首页</Button>
    </template>
  </Result>
</template>
```

### Result Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `status` | `'success' \| 'warning' \| 'info' \| 'error'` | `'info'` | 状态类型，决定底盒图标背景色与状态图标 |
| `title` | `string` | — | 主标题文本 |
| `subTitle` | `string` | — | 副标题文本 |
| `class` | `string` | — | 自定义 CSS 类 |

### Result 插槽

| 插槽 | 说明 |
| --- | --- |
| `icon` | 自定义左侧/顶部状态图标 |
| `title` | 自定义标题 |
| `sub-title` | 自定义副标题 |
| `extra` | 自定义操作按钮/控制按钮扩展区 |

