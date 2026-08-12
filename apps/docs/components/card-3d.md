---
title: Card3D 3D 悬浮卡片
description: 3D 物理悬浮卡片，鼠标悬停时产生 3D 旋转偏转与反向阴影投影。
---

# Card3D 3D 悬浮卡片

新粗野主义风格的 3D 交互卡片，通过捕捉指针相对卡片中心的坐标偏移，产生流畅的 3D 旋转偏转，阴影层朝反方向位移产生实体立体质感。

## 预览

<ComponentPreview>
  <Card3DDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="card-3d" />

## 用法

```vue
<script setup>
import { Card3D } from 'brutx-ui-vue'
</script>

<template>
    <Card3D class="w-full max-w-sm">
        <div class="p-6">
            <h3 class="text-lg font-black mb-2">3D 悬浮卡片</h3>
            <p class="text-sm">将鼠标移入卡片，体验 3D 物理偏转效果。</p>
        </div>
    </Card3D>
</template>
```

## 变体

### 阴影变体

| 变体 | 说明 |
|------|------|
| `default` | 标准阴影偏移 |
| `lg` | 大阴影偏移 |
| `xl` | 超大阴影偏移 |

### 颜色变体

通过 `variant` 属性控制卡片背景色与文字色。

| 变体 | 说明 |
|------|------|
| `default` | 背景色背景，深色文字 |
| `primary` | 主色（珊瑚红）背景 |
| `accent` | 强调色（黄色）背景 |
| `muted` | 静音色（灰）背景 |

```vue
<Card3D variant="primary" class="w-full max-w-sm">
    <div class="p-6">
        <h3 class="text-lg font-black mb-2">主色卡片</h3>
    </div>
</Card3D>
```

## 可点击

设置 `clickable` 为 `true` 后，卡片光标变为 `pointer`，添加 `role="button"`、`tabindex="0"` 并支持 Enter/Space 键触发 `click` 事件。Enter 按下或 Space 抬起各触发一次 `click`，长按不会重复触发；键盘激活产生的合成 click 不会重复发出，真实鼠标点击不受影响，程序化调用 `el.click()` 不再触发 `click` 事件。

```vue
<script setup>
import { Card3D } from 'brutx-ui-vue'

function handleClick(event) {
    console.log('卡片被点击', event)
}
</script>

<template>
    <Card3D clickable class="w-full max-w-sm" @click="handleClick">
        <div class="p-6">点击我</div>
    </Card3D>
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxRotation` | `number` | `15` | 最大偏转角度（度） |
| `perspective` | `number` | `1000` | 3D 透视深度 (px) |
| `scale` | `number` | `1.02` | Hover 时的缩放比例 |
| `shadowOffset` | `number` | `10` | 阴影最大物理位移像素量 (px) |
| `shadow` | `'default' \| 'lg' \| 'xl'` | `'default'` | 阴影大小变体 |
| `variant` | `'default' \| 'primary' \| 'accent' \| 'muted'` | `'default'` | 卡片背景色变体 |
| `disabled` | `boolean` | `false` | 禁用 3D 效果，卡片保持静态 |
| `clickable` | `boolean` | `false` | 是否启用点击，true 时添加 `role="button"`、`tabindex="0"`、键盘支持并触发 click 事件 |
| `ariaLabel` | `string` | — | 可点击卡片（`clickable`）的可访问名称；仅显式传入时设置 `aria-label`，未传入时由 slot 内容充当可访问名称 |
| `class` | `string` | — | 外部类覆盖 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `click` | `MouseEvent \| KeyboardEvent` | 仅当 `clickable` 为 `true` 且 `disabled` 为 `false` 时，指针点击发出 `MouseEvent`、Enter/Space 键盘激活发出 `KeyboardEvent` |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 卡片内容，支持任意自定义内容 |

## 可访问性

- 组件设置了 `role="group"`，并通过 i18n 提供 `aria-label`（中文为 `"3D 交互卡片"`，英文为 `"3D Interactive Card"`）
- 可点击卡片（`clickable`）仅在显式传入 `ariaLabel` 时设置 `aria-label`，未传入时由 slot 内容充当可访问名称；空 slot 且未传 `ariaLabel` 的可点击卡片将无可访问名称，调用方应自行传入 `ariaLabel`
- 当用户偏好 `prefers-reduced-motion: reduce` 时，自动禁用 3D 偏转效果
- 可通过 `disabled` prop 完全禁用 3D 效果
