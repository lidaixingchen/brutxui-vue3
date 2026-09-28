---
title: Rate 评分
description: 评分组件，拥有醒目的粗描边、亮黄色填充和悬浮缩放的微小交互动作。
---

# Rate 评分

基于 Lucide Star 矢量星星构建的评分组件。选中的星星拥有高饱和的 HSL themed 金黄色填充、粗黑描边，并且在 hover 时具有弹性的微交互放大和位移反馈。

## 预览

<ComponentPreview>
  <RateDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="rate" />

## 用法

### 基础用法

```vue
<script setup>
import { ref } from 'vue'
import { Rate } from 'brutx-ui-vue'

const value = ref(3)
</script>

<template>
    <Rate v-model="value" />
</template>
```

### 允许半星

使用 `allow-half` 属性可以支持半星评分。

```vue
<script setup>
import { ref } from 'vue'
import { Rate } from 'brutx-ui-vue'

const value = ref(3.5)
</script>

<template>
    <Rate v-model="value" allow-half />
</template>
```

### 自定义星星数

通过 `max` 属性可以调整评分的上限（默认为 `5`）。

```vue
<template>
    <Rate v-model="value" :max="10" />
</template>
```

### 只读模式

添加 `readonly` 展示已有评分，停止悬停预览、点击选择和键盘修改。

```vue
<template>
    <Rate v-model="value" readonly allow-half />
</template>
```

## 尺寸

| 尺寸 | 说明 |
|------|------|
| `sm` | 小图标，紧凑间距 |
| `md` | 默认图标和间距 |
| `lg` | 大图标，宽松间距 |

## API 参考

<span id="rate"></span>
<span id="rate-1"></span>

<span id="事件"></span>

<ComponentApi name="rate" />

## 可访问性

- **键盘操作**：方向右键或上键增加评分，左键或下键减少评分；`Home` 归零，`End` 选取最高分。启用 `allowHalf` 时方向键按半分调整；只读时停止键盘修改并移出 Tab 焦点顺序
- **ARIA 属性**：组件根元素设置了 `role="slider"` 角色，同时声明 `aria-valuenow` 对应当前评分值，`aria-valuemin="0"`，`aria-valuemax` 对应 `max`，且有 `aria-readonly` 属性标记只读状态
- **动效降级**：敲选图标后的敲印回弹会读取 `prefers-reduced-motion`，开启“减弱动态效果”时不播放该动画
