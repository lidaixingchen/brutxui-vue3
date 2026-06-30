---
title: Badge 徽标
description: 徽标组件，用于显示状态、分类标签，提供高对比度的亮色或暗色视觉。
---

# Badge 徽标

新粗野主义风格的行内徽章组件，用于标签、状态和分类。

## 预览

<ComponentPreview>
  <BadgeDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="badge" />

## 用法

```vue
<script setup>
import { Badge } from 'brutx-ui-vue'
</script>

<template>
    <Badge variant="default">Default</Badge>
    <Badge variant="primary">Primary</Badge>
    <Badge variant="success">Success</Badge>
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 标准背景色，带小阴影 |
| `primary` | Primary（珊瑚色）背景 |
| `secondary` | Secondary（薄荷青）背景 |
| `accent` | Accent（黄色）背景 |
| `danger` | Destructive（红色）背景 |
| `success` | Success（绿色）背景 |
| `outline` | 透明背景，无阴影 |

## 尺寸

| 尺寸 | 内边距 | 字体大小 |
|------|--------|----------|
| `sm` | `px-2 py-0.5` | `text-xs` |
| `default` | `px-3 py-1` | `text-sm` |
| `lg` | `px-4 py-1.5` | `text-base` |

```vue
<script setup>
import { Badge } from 'brutx-ui-vue'
</script>

<template>
    <Badge variant="primary" size="sm">Small</Badge>
    <Badge variant="primary" size="default">Default</Badge>
    <Badge variant="primary" size="lg">Large</Badge>
</template>
```

## 圆点指示器

通过 `dot` 属性在徽标前渲染一个小圆点，常用于状态指示。圆点颜色继承当前文本颜色（`bg-current`），尺寸随 `size` 自动调整。

| 尺寸 | 圆点大小 | 右间距 |
|------|----------|--------|
| `sm` | `h-1.5 w-1.5` | `mr-1` |
| `default` | `h-2 w-2` | `mr-1.5` |
| `lg` | `h-2.5 w-2.5` | `mr-2` |

```vue
<script setup>
import { Badge } from 'brutx-ui-vue'
</script>

<template>
    <Badge dot>在线</Badge>
    <Badge variant="success" dot>可用</Badge>
    <Badge variant="danger" dot>离线</Badge>
    <Badge variant="accent" dot size="sm">小尺寸</Badge>
</template>
```

## 脉冲动画

通过 `pulse` 属性为圆点启用脉冲动画（`animate-brutal-badge-pulse`）。`pulse` 隐含 `dot`，无需同时设置。适用于实时状态、新消息提醒等需要吸引注意力的场景。

```vue
<script setup>
import { Badge } from 'brutx-ui-vue'
</script>

<template>
    <Badge variant="success" pulse>实时同步中</Badge>
    <Badge variant="danger" pulse>新消息</Badge>
    <Badge variant="primary" pulse>直播中</Badge>
</template>
```

## 可关闭徽标

通过 `closable` 属性在徽标右侧渲染一个关闭按钮（X 图标）。点击按钮会触发 `close` 事件，且事件不会冒泡（内部已调用 `stopPropagation`）。关闭按钮内置无障碍支持，`aria-label` 通过国际化系统自动适配当前语言。

```vue
<script setup>
import { ref } from 'vue'
import { Badge } from 'brutx-ui-vue'

const tags = ref(['Vue', 'TypeScript', 'Tailwind CSS'])

function handleClose(index: number) {
    tags.value.splice(index, 1)
}
</script>

<template>
    <div class="flex flex-wrap items-center gap-2">
        <Badge
            v-for="(tag, index) in tags"
            :key="tag"
            variant="primary"
            closable
            @close="handleClose(index)"
        >
            {{ tag }}
        </Badge>
        <span v-if="tags.length === 0" class="text-sm text-brutal-fg">所有标签已关闭</span>
    </div>
</template>
```

## 图标插槽

通过 `icon` 具名插槽在徽标内容前插入图标。建议使用 `@lucide/vue` 图标库，并根据 `size` 设置合适的图标尺寸。

```vue
<script setup>
import { Badge } from 'brutx-ui-vue'
import { CheckCircle, AlertTriangle, Info } from '@lucide/vue'
</script>

<template>
    <Badge variant="success">
        <template #icon>
            <CheckCircle class="h-3.5 w-3.5" />
        </template>
        已完成
    </Badge>
    <Badge variant="danger">
        <template #icon>
            <AlertTriangle class="h-3.5 w-3.5" />
        </template>
        需要注意
    </Badge>
    <Badge variant="secondary">
        <template #icon>
            <Info class="h-3.5 w-3.5" />
        </template>
        提示信息
    </Badge>
</template>
```

## 组合使用

圆点、图标插槽和关闭按钮可组合使用：

```vue
<script setup>
import { Badge } from 'brutx-ui-vue'
import { Star } from '@lucide/vue'

function handleClose() {
    console.log('徽标已关闭')
}
</script>

<template>
    <Badge variant="primary" dot closable @close="handleClose">
        状态徽标
    </Badge>
    <Badge variant="accent" closable @close="handleClose">
        <template #icon>
            <Star class="h-3.5 w-3.5" />
        </template>
        收藏
    </Badge>
</template>
```

## 变体工具函数

组件同时导出 `badgeVariants` 工具函数，可在自定义组件中复用 Badge 的样式变体：

```ts
import { badgeVariants } from 'brutx-ui-vue'

// 返回组合后的 Tailwind 类名字符串
const classes = badgeVariants({ variant: 'primary', size: 'sm' })
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger' \| 'success' \| 'outline'` | `'default'` |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |
| `closable` | `boolean` | `false` |
| `dot` | `boolean` | `false` |
| `pulse` | `boolean` | `false` |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 | 说明 |
|------|------|------|
| `close` | `[]` | 点击关闭按钮时触发（已阻止事件冒泡） |

## 插槽

| 插槽 | 说明 |
|------|------|
| `default` | 徽标文本内容 |
| `icon` | 徽标前的图标内容 |
