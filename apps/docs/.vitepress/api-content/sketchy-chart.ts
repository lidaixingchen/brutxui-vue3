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
                    "zh": "图表数据项数组；每项包含标签和数值。折线与柱图支持正负数与零，饼图支持非负数。",
                    "en": "Array of chart items, each with a label and value. Line and bar charts support positive, negative, and zero values; pie charts support non-negative values."
                },
                "title": {
                    "zh": "图表业务标题，关联图形无障碍名称和数据表标题。",
                    "en": "Business title of the chart, associated with graphic accessibility name and table caption."
                },
                "description": {
                    "zh": "单位、统计口径及重要趋势说明。",
                    "en": "Units, statistical methodology, and important trend description."
                },
                "valueFormatter": {
                    "zh": "数值格式化函数，统一刻度、图例与表格数值。",
                    "en": "Numeric formatting function that standardizes scales, legends, and table values."
                },
                "interactive": {
                    "zh": "开启图形交互提示与数据项选择器。",
                    "en": "Enables interactive tooltips and the data-item slider."
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
            },
            "slots": {
                "tooltip": {
                    "zh": "自定义图表悬浮读数提示内容。",
                    "en": "Custom content for the chart reading tooltip."
                }
            }
        }
    }
} satisfies ApiContent

export default content
