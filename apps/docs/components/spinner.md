# Spinner

新粗野主义风格加载旋转器，提供 4 种视觉变体：标准、方块、圆点和条形。

## 预览

<ComponentPreview>
  <div class="flex items-center gap-8">
    <div class="h-8 w-8 border-3 border-brutal rounded-full animate-spin border-t-transparent border-r-transparent"></div>
    <div class="grid grid-cols-2 gap-1 h-8 w-8">
      <div class="bg-brutal-primary animate-pulse"></div>
      <div class="bg-brutal-secondary animate-pulse" style="animation-delay:0.15s"></div>
      <div class="bg-brutal-secondary animate-pulse" style="animation-delay:0.3s"></div>
      <div class="bg-brutal-accent animate-pulse" style="animation-delay:0.45s"></div>
    </div>
    <div class="flex items-end gap-0.5 h-6">
      <div class="w-1.5 bg-brutal-primary animate-pulse"></div>
      <div class="w-1.5 bg-brutal-secondary animate-pulse" style="animation-delay:0.1s"></div>
      <div class="w-1.5 bg-brutal-accent animate-pulse" style="animation-delay:0.2s"></div>
    </div>
  </div>
</ComponentPreview>

## 安装

<InstallationTabs componentName="spinner" />

## 用法

### Spinner（标准）

```vue
<script setup>
import Spinner from '@/components/ui/Spinner.vue'
</script>

<template>
    <Spinner size="default" variant="default" />
</template>
```

### BlockSpinner

```vue
<script setup>
import BlockSpinner from '@/components/ui/BlockSpinner.vue'
</script>

<template>
    <BlockSpinner size="default" />
</template>
```

### DotsSpinner

```vue
<script setup>
import DotsSpinner from '@/components/ui/DotsSpinner.vue'
</script>

<template>
    <DotsSpinner size="default" />
</template>
```

### BarsSpinner

```vue
<script setup>
import BarsSpinner from '@/components/ui/BarsSpinner.vue'
</script>

<template>
    <BarsSpinner size="default" />
</template>
```

## Spinner 变体

| 变体 | 说明 |
|------|------|
| `default` | 顶部和右侧边框透明，旋转 |
| `primary` | 主色边框，旋转 |
| `secondary` | 辅助色边框，旋转 |
| `accent` | 顶部和右侧强调色边框，旋转 |

## 尺寸

所有旋转器类型支持以下尺寸：

| 尺寸 | Spinner | Block | Bars | Dots |
|------|---------|-------|------|------|
| `sm` | `h-5 w-5` | `h-5 w-5` | `h-4` | `gap-1` |
| `default` | `h-8 w-8` | `h-8 w-8` | `h-6` | `gap-2` |
| `lg` | `h-12 w-12` | `h-12 w-12` | `h-8` | `gap-3` |
| `xl` | `h-16 w-16` | `h-16 w-16` | `h-12` | `gap-4` |

## 属性

### Spinner

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` |
| `class` | `string` | — |

### BlockSpinner / DotsSpinner / BarsSpinner

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` |
| `class` | `string` | — |
