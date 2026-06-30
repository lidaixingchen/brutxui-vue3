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

## 变体

`TimelineDot` 支持多样化的新粗野主义几何设计与颜色主题，通过 `shape` 和 `variant` 进行自定义：

### 形状 (`shape`)

| 形状 | 说明 |
|------|------|
| `circle` | 经典的圆形小徽章 |
| `square` | 方正的硬朗线条卡片 |
| `diamond` | 斜向 45 度旋转的菱形（文字插槽内容会被内部自动反向微调，以防排版发生倾斜） |

### 配色 (`variant`)

| 变体 | 说明 |
|------|------|
| `default` | 默认配色 |
| `primary` | 主色 |
| `secondary` | 辅助色 |
| `accent` | 强调色 |
| `success` | 成功色 |
| `danger` | 危险色 |

## 子组件

| 组件 | 说明 |
|------|------|
| `Timeline` | 根容器，管理布局方向和交替排列 |
| `TimelineItem` | 单个时间节点 |
| `TimelineSeparator` | 节点分隔区域，包含 Dot 和 Connector |
| `TimelineDot` | 节点徽标，支持形状和配色变体 |
| `TimelineConnector` | 节点之间的连接线 |
| `TimelineContent` | 节点内容区域 |

## Props

### Timeline

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | 时间线排版布局朝向 |
| `alternate` | `boolean` | `false` | 是否启用交替布局；仅 `orientation='vertical'` 时生效，偶数项内容在左、奇数项在右 |
| `class` | `string` | — | 整体包裹容器自定义样式类 |

### TimelineItem

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `index` | `number` | — | 节点索引，由 `Timeline` 组件自动注入，无需手动指定 |
| `class` | `string` | — | 单个时间节点的自定义样式类 |

### TimelineSeparator

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 分隔区域的自定义样式类 |

### TimelineDot

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'success' \| 'danger'` | `'accent'` | 配色变体 |
| `shape` | `'circle' \| 'square' \| 'diamond'` | `'circle'` | 几何形态变体 |
| `class` | `string` | — | 节点微标的自定义样式类 |

### TimelineConnector

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 连接线的自定义样式类 |

### TimelineContent

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | — | 内容区域的自定义样式类 |

## 插槽

### Timeline

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 用于放置 `TimelineItem` 子节点 |

### TimelineItem

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 用于放置 `TimelineSeparator` 和 `TimelineContent` |

### TimelineSeparator

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 用于放置 `TimelineDot` 和 `TimelineConnector` |

### TimelineDot

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 用于放置节点内显示的内容（如数字、图标等） |

### TimelineConnector

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 无默认插槽，连接线为纯展示组件 |

### TimelineContent

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 用于放置时间线节点的具体内容 |

## 可访问性

- **语义化结构**：时间线使用列表结构（`<ol>`/`<li>`）组织节点，便于屏幕阅读器理解内容顺序
- **ARIA 属性**：根容器设置 `role="list"`，各节点设置 `role="listitem"`，提供清晰的列表语义
- **布局方向**：`orientation` 属性自动设置 `aria-orientation`，告知辅助技术当前布局方向
- **内容层级**：`TimelineDot` 中的内容（如数字、图标）应配合文本说明，确保信息完整传达
