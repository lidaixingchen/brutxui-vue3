---
title: Tour 导览
description: 分步引导组件，通过 Canvas 挖孔遮罩和弹出面板逐步引导用户了解界面功能。
---

# Tour 导览

新粗野主义风格的分步引导组件。使用 Canvas 局部挖孔遮罩高亮目标元素，配合弹出面板展示步骤说明，支持四方向定位、键盘导航和视口边界约束，帮助用户快速了解界面功能。

## 预览

<ComponentPreview>
  <TourDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="tour" />

## 用法

### 基础用法

定义步骤数组，通过 `v-model:open` 和 `v-model:current` 控制导览的显示状态和当前步骤：

```vue
<script setup>
import { ref } from 'vue'
import { Tour } from 'brutx-ui-vue'

const isOpen = ref(true)
const current = ref(0)

const steps = [
    {
        target: '#step-nav',
        title: '导航栏',
        description: '这里是主导航区域，包含应用的主要入口链接。',
        placement: 'bottom',
    },
    {
        target: '#step-search',
        title: '搜索功能',
        description: '使用搜索框快速查找你需要的内容。',
        placement: 'right',
    },
    {
        target: '#step-profile',
        title: '个人中心',
        description: '点击头像可以进入个人中心管理你的资料。',
        placement: 'left',
    },
]
</script>

<template>
    <Tour v-model:open="isOpen" v-model:current="current" :steps="steps" />
</template>
```

### 自定义 placement 和 mask

每个步骤可以独立设置弹出方向（`placement`）和是否显示遮罩（`mask`）。当步骤未指定时，继承组件级别的 `mask` 属性（默认 `true`）。

```vue
<script setup>
import { ref } from 'vue'
import { Tour } from 'brutx-ui-vue'

const isOpen = ref(true)
const current = ref(0)

const steps = [
    {
        target: '#hero-section',
        title: '欢迎',
        description: '这是首屏展示区域。',
        placement: 'top',
        mask: true,
    },
    {
        target: '#sidebar',
        title: '侧边栏',
        description: '侧边栏不显示遮罩。',
        placement: 'right',
        mask: false,
    },
]
</script>

<template>
    <Tour v-model:open="isOpen" v-model:current="current" :steps="steps" />
</template>
```

### 监听事件

通过 `@skip`、`@finish` 和 `@close` 事件响应用户操作：

```vue
<script setup>
import { ref } from 'vue'
import { Tour } from 'brutx-ui-vue'

const isOpen = ref(true)
const current = ref(0)

const steps = [
    { target: '#feature-a', title: '功能 A', description: '了解功能 A 的用途。' },
    { target: '#feature-b', title: '功能 B', description: '了解功能 B 的用途。' },
]

const onSkip = () => {
    console.log('用户跳过了导览')
}

const onFinish = () => {
    console.log('用户完成了所有步骤')
}

const onClose = () => {
    console.log('导览已关闭')
}
</script>

<template>
    <Tour
        v-model:open="isOpen"
        v-model:current="current"
        :steps="steps"
        @skip="onSkip"
        @finish="onFinish"
        @close="onClose"
    />
</template>
```

### 自定义滚动行为

通过 `scrollIntoViewOptions` 自定义目标元素滚动到视口时的行为：

```vue
<script setup>
import { ref } from 'vue'
import { Tour } from 'brutx-ui-vue'

const isOpen = ref(true)
const current = ref(0)

const steps = [
    { target: '#section-1', title: '第一部分', description: '页面顶部的内容。' },
    { target: '#section-2', title: '第二部分', description: '需要向下滚动才能看到。' },
]
</script>

<template>
    <Tour
        v-model:open="isOpen"
        v-model:current="current"
        :steps="steps"
        :scroll-into-view-options="{ behavior: 'smooth', block: 'center' }"
    />
</template>
```

## 数据类型

### TourStep

```ts
interface TourStep {
    target: string | HTMLElement
    title?: string
    description?: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    mask?: boolean
}
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `target` | `string \| HTMLElement` | — | 目标元素，CSS 选择器字符串或 DOM 元素引用（必需） |
| `title` | `string` | — | 步骤标题 |
| `description` | `string` | — | 步骤描述文本 |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | 弹出面板相对目标元素的显示方向 |
| `mask` | `boolean` | — | 是否为此步骤显示遮罩，未指定时继承组件级 `mask` 属性 |

## 导出类型

```ts
import type { TourStep, TourProps } from 'brutx-ui-vue'
```

## Props

### TourStep

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `target` | `string \| HTMLElement` | — | 目标元素，CSS 选择器字符串或 DOM 元素引用（必需） |
| `title` | `string` | — | 步骤标题 |
| `description` | `string` | — | 步骤描述文本 |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | 弹出面板相对目标元素的显示方向 |
| `mask` | `boolean` | — | 是否为此步骤显示遮罩，未指定时继承组件级 `mask` 属性 |

### Tour

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `steps` | `TourStep[]` | — | 导览步骤数据数组（必需） |
| `mask` | `boolean` | `true` | 是否显示遮罩（全局默认值，可被单个步骤的 `mask` 覆盖） |
| `scrollIntoViewOptions` | `ScrollIntoViewOptions` | `{ block: 'center', inline: 'nearest' }` | 切换步骤时目标元素滚动到视口的配置 |
| `v-model:current` | `number` | `0` | 当前步骤索引，双向绑定 |
| `v-model:open` | `boolean` | `true` | 是否显示导览，双向绑定 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:current` | `(val: number)` | 步骤切换时触发 |
| `update:open` | `(val: boolean)` | 打开/关闭状态变化时触发 |
| `skip` | — | 用户点击"跳过"按钮时触发 |
| `finish` | — | 用户完成最后一步点击"结束"按钮时触发 |
| `close` | — | 导览关闭时触发（跳过或完成均会触发） |

## 可访问性

- **键盘操作**：按 `Escape` 键跳过导览，按 `Enter` 键进入下一步或完成导览
- **ARIA 属性**：弹出面板中的步骤标题和描述文本通过语义化标签呈现，按钮包含可访问的文本标签
- **焦点管理**：导览打开期间面板内的按钮可聚焦，关闭后自动释放
- **视口约束**：弹出面板自动约束在视口安全区域内，不会超出屏幕边缘

## 常见问题

**Q: 目标元素不在可视区域内怎么办？**

A: Tour 在切换步骤时会自动调用 `scrollIntoView` 将目标元素滚动到视口中心位置。可以通过 `scrollIntoViewOptions` 属性自定义滚动行为，例如设置 `{ behavior: 'smooth', block: 'start' }` 实现平滑滚动到顶部。

**Q: 目标元素大小发生变化后遮罩位置不对？**

A: Tour 内部使用 `ResizeObserver` 监听目标元素的尺寸变化，自动重新计算遮罩挖孔区域和弹出面板位置。同时注册了全局 `scroll` 和 `resize` 事件监听器，防止页面滚动或窗口缩放导致定位漂移。所有监听器在组件卸载时自动注销。

**Q: 如何使用 DOM 元素引用代替 CSS 选择器？**

A: `target` 属性支持直接传入 `HTMLElement` 实例。在 Vue 中可以通过模板引用（`ref`）获取元素后传给 `target`：

```vue
<script setup>
import { ref } from 'vue'
import { Tour } from 'brutx-ui-vue'

const targetEl = ref(null)
const isOpen = ref(true)
const current = ref(0)
const steps = [{ target: targetEl, title: '标题', description: '描述' }]
</script>

<template>
    <div ref="targetEl">目标元素</div>
    <Tour v-model:open="isOpen" v-model:current="current" :steps="steps" />
</template>
```

**Q: 如何在最后一步之后自动执行某些逻辑？**

A: 监听 `@finish` 事件即可。该事件在用户完成所有步骤并点击"结束"按钮时触发。同时 `@close` 事件也会在跳过和完成两种情况下触发，适合统一处理导览关闭后的清理逻辑。
