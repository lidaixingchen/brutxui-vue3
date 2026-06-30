---
title: Timeline 时间线
description: 时间线组件，用于垂直或水平展示一系列时间事件、里程碑或活动日志。
---

# Timeline 时间线

以一条主线串联的流式信息展示组件，适用于构建企业发展里程碑、版本发布日志、以及任务审批进度流程。

## 预览

<ComponentPreview>
  <TimelineDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="timeline" />

## 用法

```vue
<script setup>
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineDot,
    TimelineConnector,
    TimelineContent
} from 'brutx-ui-vue'
</script>

<template>
    <Timeline orientation="vertical">
        <!-- 节点 1 -->
        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="primary" shape="circle">1</TimelineDot>
                <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent class="pl-2">
                <div class="font-black">第一阶段</div>
                <p class="font-normal text-sm mt-1">这里是第一阶段的信息说明。</p>
            </TimelineContent>
        </TimelineItem>
        
        <!-- 节点 2 -->
        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="accent" shape="square">2</TimelineDot>
            </TimelineSeparator>
            <TimelineContent class="pl-2">
                <div class="font-black">第二阶段</div>
                <p class="font-normal text-sm mt-1">这里是第二阶段的信息说明。</p>
            </TimelineContent>
        </TimelineItem>
    </Timeline>
</template>
```

### 水平时间线

设置 `orientation="horizontal"` 可切换为水平布局。水平模式下建议在 `TimelineContent` 上添加 `text-center` 使文本与图标对齐：

```vue
<template>
    <Timeline orientation="horizontal">
        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="primary" shape="circle">1</TimelineDot>
                <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent class="text-center">
                <div class="font-black text-sm">需求分析</div>
                <div class="text-xs text-brutal-fg/60 mt-1">2026-06-01</div>
            </TimelineContent>
        </TimelineItem>

        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="accent" shape="square">2</TimelineDot>
                <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent class="text-center">
                <div class="font-black text-sm">设计开发</div>
                <div class="text-xs text-brutal-fg/60 mt-1">2026-06-15</div>
            </TimelineContent>
        </TimelineItem>

        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="success" shape="circle">3</TimelineDot>
            </TimelineSeparator>
            <TimelineContent class="text-center">
                <div class="font-black text-sm">测试发布</div>
                <div class="text-xs text-brutal-fg/60 mt-1">2026-07-01</div>
            </TimelineContent>
        </TimelineItem>
    </Timeline>
</template>
```

### 交替布局

设置 `alternate` 属性为 `true` 后，垂直时间线的内容会沿分隔线左右交替排列：偶数项（第 0、2、4... 项）内容在左侧，奇数项（第 1、3、5... 项）内容在右侧，形成对称的交替节奏。该属性仅在 `orientation="vertical"` 时生效，水平模式下会被自动忽略。

```vue
<template>
    <Timeline orientation="vertical" alternate>
        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="primary" shape="circle">1</TimelineDot>
                <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent class="pl-2">
                <div class="font-black text-base">立项启动</div>
                <p class="text-sm text-brutal-fg/80 mt-1 font-normal">确定产品方向与核心目标。</p>
            </TimelineContent>
        </TimelineItem>

        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="accent" shape="square">2</TimelineDot>
                <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent class="pl-2">
                <div class="font-black text-base">设计开发</div>
                <p class="text-sm text-brutal-fg/80 mt-1 font-normal">完成视觉设计与首轮开发。</p>
            </TimelineContent>
        </TimelineItem>

        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="success" shape="diamond">3</TimelineDot>
                <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent class="pl-2">
                <div class="font-black text-base">测试验收</div>
                <p class="text-sm text-brutal-fg/80 mt-1 font-normal">回归测试与性能调优。</p>
            </TimelineContent>
        </TimelineItem>

        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="danger" shape="circle">4</TimelineDot>
            </TimelineSeparator>
            <TimelineContent class="pl-2">
                <div class="font-black text-base">正式发布</div>
                <p class="text-sm text-brutal-fg/80 mt-1 font-normal">面向全量用户开放。</p>
            </TimelineContent>
        </TimelineItem>
    </Timeline>
</template>
```

::: tip 说明
交替布局的索引由 `Timeline` 自动按 `TimelineItem` 出现顺序从 0 开始注入，无需手动指定；`alternate` 与 `horizontal` 同时设置时，水平模式优先生效，`alternate` 不会产生任何效果。
:::

## 节点属性配置

`TimelineDot` 支持多样化的新粗野主义几何设计与颜色主题，通过 `shape` 和 `variant` 进行自定义：

### 形状选择 (`shape`)
- `circle` (默认)：经典的圆形小徽章。
- `square`：方正的硬朗线条卡片。
- `diamond`：斜向 45 度旋转的菱形（文字插槽内容会被内部自动反向微调，以防排版发生倾斜）。

### 配色变体 (`variant`)
- `'primary' | 'secondary' | 'accent' | 'success' | 'danger' | 'default'`

## Props

### Timeline Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | 时间线排版布局朝向 |
| `alternate` | `boolean` | `false` | 是否启用交替布局；仅 `orientation='vertical'` 时生效，偶数项内容在左、奇数项在右 |
| `class` | `string` | `undefined` | 整体包裹容器自定义样式类 |

### TimelineItem Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `index` | `number` | `undefined` | 节点索引，由 `Timeline` 组件自动注入，无需手动指定 |
| `class` | `string` | `undefined` | 单个时间节点的自定义样式类 |

### TimelineSeparator Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | `undefined` | 分隔区域的自定义样式类 |

### TimelineDot Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'success' \| 'danger'` | `'accent'` | 配色变体 |
| `shape` | `'circle' \| 'square' \| 'diamond'` | `'circle'` | 几何形态变体 |
| `class` | `string` | `undefined` | 节点微标的自定义样式类 |

### TimelineConnector Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | `undefined` | 连接线的自定义样式类 |

### TimelineContent Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | `undefined` | 内容区域的自定义样式类 |

## Slots

### Timeline Slots

| 插槽名 | 说明 |
|--------|------|
| `default` | 默认插槽，用于放置 `TimelineItem` 子节点 |

### TimelineItem Slots

| 插槽名 | 说明 |
|--------|------|
| `default` | 默认插槽，用于放置 `TimelineSeparator` 和 `TimelineContent` |

### TimelineSeparator Slots

| 插槽名 | 说明 |
|--------|------|
| `default` | 默认插槽，用于放置 `TimelineDot` 和 `TimelineConnector` |

### TimelineDot Slots

| 插槽名 | 说明 |
|--------|------|
| `default` | 默认插槽，用于放置节点内显示的内容（如数字、图标等） |

### TimelineConnector Slots

| 插槽名 | 说明 |
|--------|------|
| `default` | 无默认插槽，连接线为纯展示组件 |

### TimelineContent Slots

| 插槽名 | 说明 |
|--------|------|
| `default` | 默认插槽，用于放置时间线节点的具体内容 |
