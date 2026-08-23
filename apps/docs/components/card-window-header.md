---
title: CardWindowHeader 窗口标题栏
description: 复古操作系统窗口标题栏，三色状态指示灯 + 等宽大写标题 + ASCII 窗口控制符，为卡片赋予机械终端窗口质感。
---

# CardWindowHeader 窗口标题栏

模拟复古操作系统的窗口标题栏：左侧三色状态指示灯、居中等宽大写标题、右侧 ASCII 风格窗口控制符。支持多模自适应架构：既可在展示面板中作为纯静态装饰层，也可开箱即用地作为具备键盘聚焦与无障碍支持的实体控制按钮组。

## 预览

<ComponentPreview>
  <CardWindowHeaderDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="card-window-header" />

## 用法

### 基础用法（静态装饰）

```vue
<script setup>
import { CardWindowHeader } from 'brutx-ui-vue'
</script>

<template>
    <div class="border-3 border-brutal shadow-brutal">
        <CardWindowHeader title="System Monitor v2.0" />
        <div class="p-4">窗口内容区…</div>
    </div>
</template>
```

### 交互控制模式

通过声明 `closable`、`minimizable`、`maximizable` 开启对应动作按钮，支持键盘 Tab 导航、Enter / Space 触发与 `@close` / `@minimize` / `@maximize` 事件监听。

```vue
<script setup>
import { ref } from 'vue'
import { CardWindowHeader } from 'brutx-ui-vue'

const isCollapsed = ref(false)

function onClose() {
    console.log('窗口关闭')
}
function onMinimize() {
    isCollapsed.value = !isCollapsed.value
}
</script>

<template>
    <div class="border-3 border-brutal shadow-brutal">
        <CardWindowHeader
            title="Terminal_Shell"
            closable
            minimizable
            maximizable
            interactive-lamps
            @close="onClose"
            @minimize="onMinimize"
        />
        <div v-show="!isCollapsed" class="p-4">可折叠的控制台内容…</div>
    </div>
</template>
```

### 自定义操作区插槽

`actions` 插槽优先级最高，可放置任意自定义操作按钮。

```vue
<template>
    <CardWindowHeader title="Config Editor">
        <template #actions>
            <Button size="sm" variant="accent">SAVE</Button>
        </template>
    </CardWindowHeader>
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | *(必填)* | 窗口标题（等宽大写工控排版） |
| `showControls` | `boolean` | `true` | 是否渲染右侧静态 ASCII 控制符（仅在无交互模式且无 actions 插槽时生效） |
| `closable` | `boolean` | `false` | 是否开启关闭按钮 `[ X ]`（交互模式） |
| `minimizable` | `boolean` | `false` | 是否开启最小化/折叠按钮 `[ _ ]`（交互模式） |
| `maximizable` | `boolean` | `false` | 是否开启最大化/展开按钮 `[ □ ]`（交互模式） |
| `interactiveLamps` | `boolean` | `false` | 左侧三色指示灯是否可点击联动对应动作（红=关闭, 黄=最小化, 绿=最大化） |
| `closeAriaLabel` | `string` | `undefined` | 关闭按钮无障碍标签（未提供时从语言包获取） |
| `minimizeAriaLabel` | `string` | `undefined` | 最小化按钮无障碍标签 |
| `maximizeAriaLabel` | `string` | `undefined` | 最大化按钮无障碍标签 |
| `class` | `string` | `undefined` | 自定义 CSS 类名 |

## Emits

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `close` | `(event: MouseEvent \| KeyboardEvent)` | 点击关闭按钮或红色指示灯时触发 |
| `minimize` | `(event: MouseEvent \| KeyboardEvent)` | 点击最小化按钮或黄色指示灯时触发 |
| `maximize` | `(event: MouseEvent \| KeyboardEvent)` | 点击最大化按钮或绿色指示灯时触发 |

## Slots

| 插槽 | 说明 |
|------|------|
| `actions` | 右侧自定义操作区，优先级最高，存在时替换默认控制符与交互按钮 |

## 可访问性

- **模式自适应**：未声明交互 props 时，控制符与指示灯自动打上 `aria-hidden="true"`，对屏幕阅读器零噪音；开启交互 props 时，自动升级为语义化 `<button>` 并绑定精准的 `aria-label`。
- **键盘导航**：交互按钮内置 `FOCUS_RING_CLASSES` 粗野主义高对比焦点环，支持 Tab 键聚焦与 Enter / Space 键激活。

