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

## API 参考

<span id="emits"></span>

<ComponentApi name="card-window-header" />

## 可访问性

- **模式自适应**：未声明交互 props 时，控制符与指示灯自动打上 `aria-hidden="true"`，对屏幕阅读器零噪音；开启交互 props 时，自动升级为语义化 `<button>` 并绑定精准的 `aria-label`。
- **键盘导航**：交互按钮内置 `FOCUS_RING_CLASSES` 粗野主义高对比焦点环，支持 Tab 键聚焦与 Enter / Space 键激活。

