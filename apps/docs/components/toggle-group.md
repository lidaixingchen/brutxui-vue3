---
title: Toggle Group 切换组
description: 切换按钮组，支持单选或多选组合，适合控制视图或排版。
---

# Toggle Group 切换组

基于 reka-ui 的 ToggleGroup 原语构建的新粗野主义风格切换按钮组，支持单选或多选。变体和尺寸通过 provide/inject 下发给所有子项，支持水平和垂直排列方向。

## 预览

<ComponentPreview>
  <ToggleGroupDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="toggle-group" />

## 用法

### 单选

`type="single"` 时只能选中一个按钮，`modelValue` 为 `string`。

```vue
<script setup>
import { ref } from 'vue'
import { ToggleGroup, ToggleGroupItem } from 'brutx-ui-vue'
import { AlignLeft, AlignCenter, AlignRight } from '@lucide/vue'

const align = ref('left')
</script>

<template>
    <ToggleGroup type="single" v-model="align" variant="default">
        <ToggleGroupItem value="left">
            <AlignLeft class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="center">
            <AlignCenter class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="right">
            <AlignRight class="h-4 w-4" />
        </ToggleGroupItem>
    </ToggleGroup>
</template>
```

### 多选

`type="multiple"` 时可以同时选中多个按钮，`modelValue` 为 `string[]`。

```vue
<script setup>
import { ref } from 'vue'
import { ToggleGroup, ToggleGroupItem } from 'brutx-ui-vue'
import { Bold, Italic, Underline } from '@lucide/vue'

const styles = ref([])
</script>

<template>
    <ToggleGroup type="multiple" v-model="styles" variant="default">
        <ToggleGroupItem value="bold">
            <Bold class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic">
            <Italic class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline">
            <Underline class="h-4 w-4" />
        </ToggleGroupItem>
    </ToggleGroup>
</template>
```

### 排列方向

通过 `orientation` 属性控制排列方向。`vertical` 时容器使用 `flex-col`，并透传给 reka-ui 原语设置 `aria-orientation`。

```vue
<script setup>
import { ref } from 'vue'
import { ToggleGroup, ToggleGroupItem } from 'brutx-ui-vue'

const styles = ref([])
</script>

<template>
    <ToggleGroup type="multiple" v-model="styles" orientation="vertical">
        <ToggleGroupItem value="bold">加粗</ToggleGroupItem>
        <ToggleGroupItem value="italic">斜体</ToggleGroupItem>
        <ToggleGroupItem value="underline">下划线</ToggleGroupItem>
    </ToggleGroup>
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 带背景和小阴影，按下时为主色背景 |
| `outline` | 透明带边框，按下时为辅助色背景 |

变体在 `ToggleGroup` 上设置，会通过 provide/inject 下发给所有 `ToggleGroupItem`，子项也可单独覆盖。

## 尺寸

| 尺寸 | 高度 | 最小宽度 | 字体大小 |
|------|------|----------|----------|
| `sm` | `h-8` | `min-w-8` | `text-xs` |
| `default` | `h-10` | `min-w-10` | `text-sm` |
| `lg` | `h-12` | `min-w-12` | `text-sm` |

## 子组件

| 组件 | 说明 |
|------|------|
| `ToggleGroup` | 根组件，管理选中状态和组配置 |
| `ToggleGroupItem` | 子项按钮，继承父组件的变体和尺寸 |

## API 参考

<span id="togglegroup"></span>
<span id="togglegroupitem"></span>
<span id="事件"></span>
<span id="插槽"></span>
<span id="togglegroup-插槽"></span>
<span id="togglegroupitem-插槽"></span>

<ComponentApi name="toggle-group" />

## 可访问性

- **ARIA 属性**：自动管理 `aria-pressed` 状态，`vertical` 方向时设置 `aria-orientation="vertical"`
- **键盘操作**：支持方向键在组内导航，`Space` / `Enter` 切换选中状态
