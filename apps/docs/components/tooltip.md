# Tooltip

基于 reka-ui 的 Tooltip 原语构建的新粗野主义风格工具提示，悬停时显示信息文字。

## 预览

<ComponentPreview>
  <div class="relative inline-block">
    <button class="px-4 py-2 border-3 border-brutal shadow-brutal font-bold bg-brutal-bg text-brutal-fg text-sm">Hover me</button>
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 border-3 border-brutal bg-brutal-fg text-brutal-bg text-xs font-bold shadow-brutal-sm whitespace-nowrap">
      Tooltip content
    </div>
  </div>
</ComponentPreview>

## 安装

<InstallationTabs componentName="tooltip" />

## 用法

```vue
<script setup>
import { TooltipProvider, Tooltip, TooltipTrigger } from '@/components/ui'
import TooltipContent from '@/components/ui/TooltipContent.vue'
import Button from '@/components/ui/Button.vue'
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
import { TooltipProvider } from '@/components/ui'
</script>

<template>
    <TooltipProvider>
        <router-view />
    </TooltipProvider>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `TooltipProvider` | 上下文提供者（必需的祖先组件） |
| `Tooltip` | 根组件（从 reka-ui 重新导出为 `TooltipRoot`） |
| `TooltipTrigger` | 悬停时触发工具提示的元素 |
| `TooltipContent` | 工具提示内容面板 |

## 属性

### TooltipContent

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `class` | `string` | — |
| `sideOffset` | `number` | — |

## 无障碍

- 工具提示在悬停和聚焦时出现
- 按 `Escape` 键关闭工具提示
- 工具提示内容可被屏幕阅读器朗读
