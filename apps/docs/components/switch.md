---
title: Switch 开关
description: 开关选择器组件，用于快捷切换 true/false 布尔值状态。
---

# Switch 开关

基于 reka-ui 的 Switch 原语构建的新粗野主义风格滑动开关，采用粗边框、固定硬阴影与实心滑钮，支持 v-model。

## 预览

<ComponentPreview>
  <SwitchDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="switch" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const enabled = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Switch id="airplane-mode" v-model="enabled" />
        <Label for="airplane-mode">飞行模式</Label>
    </div>
</template>
```

非受控用法通过 `defaultValue` 设置挂载初值：

```vue
<Switch :default-value="true" aria-label="接收通知" />
```

### 状态标签

开启 `showLabels` 可在滑钮内显示当前状态，内置标签为开启 `I`、关闭 `O`。通过 `checkedLabel` 和 `uncheckedLabel` 可自定义文字或符号；未提供时使用 locale 的 `switch.checkedLabel` 和 `switch.uncheckedLabel` 文案。

滑钮空间有限，建议使用“开 / 关”或“✓ / ×”等单字符标签，较长说明放在外侧 `Label`。标签颜色与滑钮背景配对，并通过 `aria-hidden` 隐藏装饰文本；无障碍状态由 `aria-checked` 表达，控件名称通过 `ariaLabel` 设置。

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const power = ref(true)
const sync = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Switch id="device-power" v-model="power" show-labels />
        <Label for="device-power">设备主电源</Label>
    </div>
    <div class="flex items-center gap-3">
        <Switch id="auto-sync" v-model="sync" show-labels checked-label="开" unchecked-label="关" />
        <Label for="auto-sync">自动同步</Label>
    </div>
</template>
```

### 切换动效

外框和硬阴影在悬停、按住及切换状态时保持固定。滑钮使用 180ms 的 `ease-brutal-snap` 缓动横向移动，轨道使用 120ms 渐变表达状态；键盘焦点环立即显示。

系统开启“减弱动态效果”（`prefers-reduced-motion: reduce`）时，滑钮位置和轨道颜色直接切换。

### 禁用状态

```vue
<template>
    <Switch disabled />
</template>
```

### 自定义无障碍标签

通过 `id` 与 `Label` 的 `for` 属性关联可见名称，也可以使用包裹式 `Label`。点击关联标签即可切换开关。使用 `ariaLabelledby` 引用其他名称元素时，其优先级最高；显式 `ariaLabel` 用于设置独立名称。没有显式名称和关联标签时，才通过 locale 回退到“开关”。

```vue
<script setup>
import { ref } from 'vue'
import { Switch, Label } from 'brutx-ui-vue'

const sync = ref(false)
</script>

<template>
    <div class="flex items-center gap-3">
        <Switch v-model="sync" aria-label="自动同步数据" />
        <Label>自动同步</Label>
    </div>
</template>
```

### 原生表单

设置 `name` 后，开关开启且未禁用时以 `name/value` 随所属原生 `<form>` 提交，`value` 缺省为 `on`。关闭或禁用的字段不提交。`required` 与 `name` 配合，要求开关开启后才通过原生必填校验。

```vue
<script setup>
import { Button, Switch, Label } from 'brutx-ui-vue'
</script>

<template>
    <form>
        <Switch id="notifications" name="notifications" value="enabled" :default-value="true" required />
        <Label for="notifications">接收通知</Label>
        <Button type="submit">提交</Button>
        <Button type="reset">重置</Button>
    </form>
</template>
```

原生表单重置会将非受控开关恢复为挂载时的 `defaultValue`，不播放切换音效。受控状态继续由 `v-model` 决定；应用需要重置绑定值时，在表单的 `reset` 处理器中更新该值。取消 `reset` 事件会保留当前状态。

## API 参考

<span id="事件"></span>

<ComponentApi name="switch" />

## 可访问性

- **键盘操作**：支持 `Space` / `Enter` 切换开关状态
- **ARIA 属性**：自动管理 `role="switch"`、`aria-checked` 和 `aria-required`；支持关联可见 Label、`ariaLabelledby` 与显式 `ariaLabel`
- **焦点管理**：可通过 Tab 键聚焦，使用 `--brutal-ring` 令牌显示可见聚焦环
- **动效降级**：尊重 `prefers-reduced-motion`，关闭滑钮和轨道过渡
- **标签隔离**：`showLabels` 状态标签使用 `aria-hidden="true"`，由 `aria-checked` 提供开关状态

