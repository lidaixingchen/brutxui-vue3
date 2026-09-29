import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Separator: {
            props: {
                variant: { zh: '选择分隔线的颜色样式。', en: 'Selects the separator color style.' },
                size: { zh: '控制分隔线的粗细预设。', en: 'Controls the preset thickness of the separator line.' },
                orientation: { zh: '选择水平或垂直方向；文字内容仅在水平方向居中显示在线段之间。', en: 'Selects horizontal or vertical orientation; text content is centered between line segments only horizontally.' },
                decorative: { zh: '设为装饰元素时不暴露分隔线语义；关闭后设置 `role="separator"` 及方向语义。', en: 'When decorative, the element has no separator semantics; when false, it receives `role="separator"` and orientation semantics.' },
                class: { zh: '追加到原生分隔线或文字分隔线的线段元素。', en: 'CSS classes added to the native separator or to the text-separator line segments.' },
            },
            slots: {
                default: { zh: '可选的分隔线内容；水平且插槽有内容时在线段间显示文字，否则作为内容传给底层 Reka UI 分隔线原语。', en: 'Optional separator content. When horizontal and non-empty, it appears between line segments; otherwise it is passed to the underlying Reka UI separator primitive.' },
            },
        },
    },
} satisfies ApiContent

export default content
