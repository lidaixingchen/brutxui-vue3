import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        BrutalShape: {
            props: {
                name: { zh: '图腾库中的图形名称，见正文图腾清单；未知名称会跳过 SVG 渲染并输出警告。', en: 'The shape name from the catalog in this guide. Unknown names skip SVG rendering and produce a warning.' },
                size: { zh: '同时设置 SVG 的宽度和高度；数值按像素解释，字符串直接传给 SVG 尺寸属性。', en: 'Sets both SVG width and height. Numbers are interpreted as pixels; strings are passed directly to the SVG dimensions.' },
                color: { zh: 'SVG 填充色；默认使用强调色语义令牌，随主题变化。', en: 'The SVG fill color. By default it uses the accent semantic token and follows the theme.' },
                stroke: { zh: 'SVG 描边色；默认使用前景色语义令牌。', en: 'The SVG stroke color, using the foreground semantic token by default.' },
                strokeWidth: { zh: 'SVG 描边宽度，以 viewBox 的 100 单位坐标系计量。', en: 'The SVG stroke width in the 100-unit viewBox coordinate system.' },
                decorative: { zh: '为真时通过 aria-hidden 对辅助技术隐藏图形；作为语义图形使用时设为假并由父级提供文本替代。', en: 'Hides the shape from assistive technology through aria-hidden when true. Set it to false for semantic use and provide a text alternative on the parent.' },
                class: { zh: '合并到 SVG 根元素的自定义 CSS 类，可用于旋转或定位。', en: 'Custom CSS classes merged onto the SVG root, for example for rotation or positioning.' },
            },
        },
    },
} satisfies ApiContent

export default content
