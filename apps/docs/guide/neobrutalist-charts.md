---
title: 粗野主义图表设计范式
description: Neobrutalism 图表体系：原生手绘组件 SketchyChart 与 ECharts 主题接入
---

# 粗野主义图表设计范式

BrutxUI 提供**双层图表体系**，兼顾轻量插画风格与重型复杂数据可视化需求：

1. **原生轻量组件 (`SketchyChart`)**：零重量级外部依赖（纯 Vue 3 + SVG 动态手绘滤镜算法），开箱即用，适合仪表盘概览、指标卡片与趣味数据呈现；
2. **重型图表生态接入 (ECharts)**：面对海量点阵、多轴联动或金融报表，提供与设计令牌单一信源严格一致的 **ECharts 主题 JSON** 与视觉法则，消费方按需引入。

---

## 原生手绘组件：SketchyChart

`SketchyChart` 内置基于 SVG `feTurbulence` 与 `feDisplacementMap` 的动态抖动滤镜，渲染具有新粗野主义特色的手绘边框、斜线填充（Hatch）与同心圆数据点。

### 基础用法

```vue
<script setup lang="ts">
import { SketchyChart } from 'brutx-ui-vue'

const monthlyData = [
    { label: '1月', value: 120 },
    { label: '2月', value: 200 },
    { label: '3月', value: 150 },
    { label: '4月', value: 280 },
    { label: '5月', value: 220 },
]
</script>

<template>
    <div class="flex flex-col gap-6">
        <!-- 折线图 -->
        <SketchyChart
            type="line"
            :data="monthlyData"
            :width="560"
            :height="300"
            :sketchiness="2"
        />

        <!-- 柱状图 -->
        <SketchyChart
            type="bar"
            :data="monthlyData"
            :width="560"
            :height="300"
        />

        <!-- 饼图 -->
        <SketchyChart
            type="pie"
            :data="monthlyData"
            :width="400"
            :height="300"
        />
    </div>
</template>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `type` | `'line' \| 'bar' \| 'pie'` | `'line'` | 图表类型 |
| `data` | `{ label: string; value: number }[]` | `[]` | 数据源数组（内部自动做非负转换与极值规整） |
| `sketchiness` | `number` | `2` | 手绘抖动强度（数值越大，笔触波浪与毛刺感越明显） |
| `grid` | `boolean` | `true` | 是否绘制硬网格参考线 |
| `width` | `number` | `500` | SVG 画布宽度（像素） |
| `height` | `number` | `300` | SVG 画布高度（像素） |
| `class` | `string` | `undefined` | 根容器自定义类名 |

---

## 复杂图表：ECharts 主题接入

面对多系列多坐标轴的复杂报表场景，推荐通过 BrutxUI 官方导出的 **ECharts 主题 JSON** 进行渲染。

### 色彩映射（零新增令牌）

图表序列直接复用语义色五族，主题预设与暗色切换自动生效：

| 序列 | 语义令牌 | 默认预设值 |
| :--- | :--- | :--- |
| Series 1 | `--brutal-primary` | `#FF6B6B` |
| Series 2 | `--brutal-secondary` | `#4ECDC4` |
| Series 3 | `--brutal-accent` | `#FFE66D` |
| Series 4 | `--brutal-status-success` | `#22c55e` |
| Series 5 | `--brutal-info` | `#4A90D9` |

### 视觉三法则

#### 法则一：网格背景

网格线为高对比粗实线或点阵，禁止柔和灰网格。坐标轴线宽推荐设为 `3px`。

#### 法则二：Tooltip 实体卡片

悬浮卡片必须是不透明底 + `3px` 硬边框 + 硬阴影（`box-shadow: 4px 4px 0 0 var(--brutal-border-color)`），禁止模糊发光与大圆角。

#### 法则三：柱体强边框与同心圆数据点

柱体带 `2px` 黑边框、零圆角；折线数据关键点使用黑白实心同心圆（外黑内彩），取消柔和渐变与模糊。

### 反模式

| ❌ 禁止 | 原因 |
| :--- | :--- |
| 渐变填充柱体 / 面积图柔和透明渐变 | 违背硬朗实体质感 |
| 模糊投影（`shadowBlur`） | 破坏硬阴影体系 |
| 圆角柱体（`borderRadius > 0`） | 粗野主义几何为零圆角 |
| 引入语义色之外的随机配色 | 破坏单一信源一致性 |

### 接入代码

```ts
import * as echarts from 'echarts'
// 从文档站或构建产物中获取主题文件
import brutxuiTheme from './brutxui-theme.json'

echarts.registerTheme('brutxui', brutxuiTheme)
const chart = echarts.init(el, 'brutxui')
```

### 主题 JSON 维护

项目在构建时通过脚本从 `design-tokens.ts` 自动同步导出主题 JSON：

```bash
# 生成并同步主题文件
pnpm --filter brutx-ui-vue generate:echarts-theme

# 校验磁盘产物与 design-tokens 派生结果一致性
pnpm --filter brutx-ui-vue exec tsx scripts/generate-echarts-theme.ts --check
```
