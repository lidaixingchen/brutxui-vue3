---
title: SketchyChart 手绘图表
description: SVG 手绘图表，支持完整数据、正负值、统一格式化与等价数据表。
---

# SketchyChart 手绘图表

新粗野主义风格的手绘图表组件，使用 Vue 与 SVG 绘制，分形噪声滤镜和排线纹理表达手绘质感。表格展开入口基于 Reka UI，逐项读数使用库内语义表格。

## 预览

<ComponentPreview>
  <SketchyChartDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="sketchy-chart" />

### 手动复制范围

手动安装页中的依赖命令覆盖这个图表源码闭包所需的外部包：`reka-ui`、`class-variance-authority`、`clsx`、`tailwind-merge` 和 `@lucide/vue`。Vue、Tailwind CSS、`src/lib/utils.ts` 以及设计令牌仍按[通用手动安装指南](../guide/installation-manual)的基础步骤配置；`utils.ts` 是所有本地组件共享的类名工具，不属于图表目录。

图表的注册表闭包还包含 `button`、`slider`、`tooltip`、`table` 和 `locale-zh-cn`。从源码复制时，请保持目录结构并一并复制：

- `src/components/ui/sketchy-chart/` 下的 `SketchyChart.vue`、`sketchy-chart-data.ts`、`sketchy-chart-variants.ts`、`useChartInteraction.ts` 和 `index.ts`；
- `src/components/ui/button/`、`src/components/ui/slider/`、`src/components/ui/tooltip/` 和 `src/components/ui/table/` 的组件目录及其变体、入口文件；
- `src/composables/useLocale.ts`、`useGlitchEffect.ts`、`useReducedMotion.ts`；
- `src/locales/en.ts`、`index.ts`、`types.ts` 和 `zh-CN.ts`；
- `src/lib/defaults.ts`、`z-index.ts`、`icon-size-variants.ts`、`env.ts`、`brutal-interaction-variants.ts`、`floating-content-variants.ts` 和 `floating-animation-classes.ts`。

这些文件分别对应图表源码、注册表组件依赖和它们的内部 helper；不需要复制测试或截图文件。复制完成后，使用安装面板最后一步生成的本地导入：

```ts
import SketchyChart from '@/components/ui/sketchy-chart/SketchyChart.vue'
```

组件源码中的相对路径和 `@/` 别名需要保持可解析；这段导入用于本地复制的源码，`brutx-ui-vue` 导入示例用于直接使用已发布包。

## 用法

```vue
<script setup>
import { SketchyChart } from 'brutx-ui-vue'

const data = [
    { label: 'Jan', value: 30 },
    { label: 'Feb', value: 65 },
    { label: 'Mar', value: 45 },
]
</script>

<template>
    <SketchyChart title="月度销售额" description="单位：万元" type="line" :data="data" />
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `line` | 折线图，带阴影填充区和拐点圆圈 |
| `bar` | 柱状图，带 Hatch 斜线填充和硬投影 |
| `pie` | 饼图，使用设计令牌色板和粗黑边框 |

```vue
<template>
    <SketchyChart type="bar" :data="data" />
</template>
```

## 手绘抖动

sketchiness prop 控制手绘抖动幅度，值越大抖动越明显。0-10 可作为调节范围参考，组件不会钳制传入值：

```vue
<SketchyChart type="line" :data="data" :sketchiness="8" />
```

## 数据处理

- **折线与柱图**：接受有限正数、负数与零。坐标范围包含零及实际极值，柱体与折线面积以零为基线。
- **饼图**：接受有限非负数，按完整数据计算占比；零值保留在图例与表格中，不生成扇区。
- **无效值**：存在 `NaN`、无穷值或饼图负值时，整图显示无效状态，表格标识错误单元格并保留全部标签。
- **空与全零**：空数组显示暂无数据；全零折线与柱图仍显示零值；全零饼图显示总量为零，占比不可计算。
- **类别完整性**：超过 30 项也保留全部数据和端点，只减少可见类别刻度。密集图形可通过完整表格读取。
- **格式化**：`valueFormatter` 统一刻度、图例与表格数值，只接收有效有限值，应保持确定且无副作用。百分比独立按语言环境格式化，舍入合计可能不等于 100%。

## 数据语义迁移

负数现在保留符号，饼图负数会触发无效状态；超过 30 项的数据完整绘制。若业务需要绝对值、聚合或抽样，请在传入数据前明确处理，同时说明处理口径。`title` 应区分页面中的多个图表，`description` 可说明单位、统计口径及重要趋势。

## 读数交互

鼠标在折线的最近横向位置、柱图类别区域或饼图扇区上读取数据；饼图图例也可读取零值。提示可移入，Esc 关闭后同项微小移动保持关闭。触摸点击选中，再次点击同项或点击外部关闭，滑动保留页面滚动。

“浏览数据项”选择器按输入顺序包含全部类别。方向键逐项读取，Home/End 跳至首尾，Tab 正常离开。单项、空数据与无效数据使用只读焦点区域。鼠标活动与选择器的位置独立；数据数组替换、增删重排、标签或数值变化及类型切换会清除提示并重置探索位置。滚动和缩放保留活动项，语言及格式化函数变化刷新文本。

设置 `:interactive="false"` 显示静态图形；完整数据表入口仍可使用。稠密图形通过选择器或数据表逐项读取，像素可辨识性取决于可用空间。

## Tooltip 插槽

```vue
<SketchyChart title="设备访问占比" type="pie" :data="data">
    <template #tooltip="{ label, formattedValue, formattedPercentage }">
        {{ label }}：{{ formattedValue }}（{{ formattedPercentage }}）
    </template>
</SketchyChart>
```

插槽提供 `index`、`label`、原始 `value`、`formattedValue`，以及饼图的 `percentage`（0 到 1）与 `formattedPercentage`。其他图形或占比不可计算时，两个占比字段为 `undefined`。插槽仅承载展示内容，请勿放置链接、按钮或输入控件；等价读数由选择器与数据表提供。

## API 参考

<ComponentApi name="sketchy-chart" />

## 可访问性

- **图形语义**：SVG 使用 `role="img"`，通过实例唯一 ID 关联可见标题、业务说明和数据状态。
- **键盘读数**：选择器仅有一个焦点 thumb，`aria-valuetext` 包含类别、格式化数值、位置、总项数与饼图占比。视觉提示不重复播报。Dialog 中第一次 Esc 关闭提示，下一次关闭弹窗。
- **等价读数**：“查看数据表”按钮支持键盘展开，焦点保留在按钮，完整语义表格包含标题与列头；饼图表格包含占比。
- **辅助说明**：业务方提供图表标题和必要趋势描述，帮助区分图表并理解其含义。
