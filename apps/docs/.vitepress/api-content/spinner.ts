import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Spinner: {
            props: {
                size: { zh: '旋转指示器或 ASCII 指示器的尺寸。', en: 'The size of the circular or ASCII spinner.' },
                variant: { zh: '选择圆环颜色变体，或使用 `ascii` 显示轮换的终端字符；减少动态效果偏好下 ASCII 字符停留在首帧。', en: 'Selects a ring color variant or `ascii` for a rotating terminal character. Under reduced-motion preferences, the ASCII spinner stays on its first frame.' },
                label: { zh: '加载状态的屏幕阅读器名称；未提供或为空白时使用本地化 Loading 文案。', en: 'The screen-reader name for the loading status; localized loading text is used when omitted or blank.' },
                class: { zh: '追加到加载状态容器的 CSS 类。', en: 'CSS classes added to the loading status container.' },
            },
        },
        BarsSpinner: {
            props: {
                size: { zh: '条形组的高度及每根条形的宽度。', en: 'The height of the bar group and the width of each bar.' },
                color: { zh: '条形颜色；`mixed` 按序轮换主色、次色、强调色和信息色。', en: 'The bar color; `mixed` cycles through primary, secondary, accent, and info colors.' },
                label: { zh: '加载状态的屏幕阅读器名称；默认为本地化 Loading 文案。', en: 'The screen-reader name for the loading status; defaults to localized loading text.' },
                class: { zh: '追加到条形组容器的 CSS 类。', en: 'CSS classes added to the bar-group container.' },
            },
        },
        BlockSpinner: {
            props: {
                size: { zh: '四方块指示器整体尺寸。', en: 'The overall size of the four-block indicator.' },
                color: { zh: '方块颜色；`mixed` 按序轮换主色、次色、强调色和信息色。', en: 'The block color; `mixed` cycles through primary, secondary, accent, and info colors.' },
                label: { zh: '加载状态的屏幕阅读器名称；默认为本地化 Loading 文案。', en: 'The screen-reader name for the loading status; defaults to localized loading text.' },
                class: { zh: '追加到方块组容器的 CSS 类。', en: 'CSS classes added to the block-group container.' },
            },
        },
        DotsSpinner: {
            props: {
                size: { zh: '三个圆点的尺寸及点间距。', en: 'The size of the three dots and their spacing.' },
                color: { zh: '三个圆点共用的颜色变体。', en: 'The color variant shared by all three dots.' },
                label: { zh: '加载状态的屏幕阅读器名称；默认为本地化 Loading 文案。', en: 'The screen-reader name for the loading status; defaults to localized loading text.' },
                class: { zh: '追加到圆点组容器的 CSS 类。', en: 'CSS classes added to the dot-group container.' },
            },
        },
    },
} satisfies ApiContent

export default content
