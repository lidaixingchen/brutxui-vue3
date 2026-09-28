import type { ApiContent } from '../api-types'

const content = {
    "complete": true,
    "members": {
        "SketchyChart": {
            "props": {
                "type": {
                    "zh": "选择手绘折线图、柱状图或饼图。",
                    "en": "Selects a sketchy line, bar, or pie chart."
                },
                "data": {
                    "zh": "图表数据项数组；每项包含标签和数值。组件将负数按绝对值处理，超过 30 项时按步长抽样以控制渲染项数。",
                    "en": "Array of chart items, each with a label and value. Negative values are converted to absolute values; datasets over 30 items are sampled by step to limit rendered items."
                },
                "sketchiness": {
                    "zh": "控制 SVG 手绘滤镜的抖动强度；数值乘以内部基准频率，源码没有对传入数值作范围钳制。",
                    "en": "Controls the SVG hand-drawn filter intensity. The value scales an internal base frequency; the source does not clamp the supplied number to a range."
                },
                "grid": {
                    "zh": "显示折线图或柱状图的背景网格；饼图不渲染网格。",
                    "en": "Shows the background grid for line and bar charts. Pie charts do not render a grid."
                },
                "width": {
                    "zh": "设置 SVG viewBox 和图表计算使用的宽度，单位为 SVG 用户坐标。",
                    "en": "Sets the width used by the SVG viewBox and chart calculations, in SVG user units."
                },
                "height": {
                    "zh": "设置 SVG viewBox 和图表计算使用的高度，单位为 SVG 用户坐标。",
                    "en": "Sets the height used by the SVG viewBox and chart calculations, in SVG user units."
                },
                "class": {
                    "zh": "追加到图表外层容器的自定义 CSS 类。",
                    "en": "Custom CSS classes appended to the outer chart container."
                }
            }
        }
    }
} satisfies ApiContent

export default content
