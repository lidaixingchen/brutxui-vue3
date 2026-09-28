import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Skeleton: {
            props: {
                variant: { zh: '设置骨架占位块使用的颜色变体。', en: 'Sets the color variant used by the skeleton placeholder.' },
                size: { zh: '设置骨架块高度；shape 为 circle 时也决定圆形的直径。', en: 'Sets the skeleton height; when shape is circle, it also determines the circle diameter.' },
                shape: { zh: '选择矩形或圆形占位外观；圆形会保持宽高相等。', en: 'Selects a rectangular or circular placeholder; a circle keeps equal width and height.' },
                effect: { zh: '选择占位动效质感：none 使用默认脉冲，scanlines 添加 CRT 扫描线，ascii 渲染闪烁终端块。', en: 'Selects the loading texture: none uses the default pulse, scanlines adds a CRT texture, and ascii renders flickering terminal blocks.' },
                width: { zh: '覆盖骨架块宽度；数字按像素转换，字符串作为 CSS 宽度使用。圆形模式下此值同时设置高度。', en: 'Overrides the skeleton width. Numbers are converted to pixels and strings are used as CSS widths; for a circle this also sets the height.' },
                class: { zh: '追加到骨架块状态容器的 CSS 类。', en: 'Additional CSS classes applied to the skeleton status container.' },
            },
            slots: {
                default: { zh: '可选的占位块内容；使用 ascii 效果且未提供插槽时，组件会渲染默认终端块字符。', en: 'Optional placeholder content. With the ascii effect, default terminal-block characters are rendered when this slot is empty.' },
            },
        },
        SkeletonAvatar: {
            props: {
                variant: { zh: '设置圆形头像占位块的颜色变体。', en: 'Sets the color variant of the circular avatar placeholder.' },
                size: { zh: '设置头像占位圆形的直径。', en: 'Sets the diameter of the circular avatar placeholder.' },
                class: { zh: '追加到头像骨架圆形元素的 CSS 类。', en: 'Additional CSS classes applied to the avatar skeleton circle.' },
            },
        },
        SkeletonCard: {
            props: {
                variant: { zh: '设置卡片内骨架占位块的颜色变体。', en: 'Sets the color variant used by the card’s skeleton placeholders.' },
                label: { zh: '设置卡片状态区域的无障碍名称；空字符串会回退到当前语言的加载文案。', en: 'Sets the accessible name of the card status region; an empty string falls back to the localized loading text.' },
                class: { zh: '追加到卡片骨架外层容器的 CSS 类。', en: 'Additional CSS classes applied to the outer skeleton card container.' },
            },
        },
        SkeletonTable: {
            props: {
                variant: { zh: '设置表格占位单元格的颜色变体。', en: 'Sets the color variant used by the table placeholder cells.' },
                rows: { zh: '设置占位数据行数；默认 5，非有限值回退到默认值，结果限制在 0 到 100 行。', en: 'Sets the placeholder data row count. It defaults to 5, non-finite values use that default, and the result is clamped from 0 to 100.' },
                columns: { zh: '设置占位列数；默认 4，非有限值回退到默认值，结果限制在 0 到 20 列。', en: 'Sets the placeholder column count. It defaults to 4, non-finite values use that default, and the result is clamped from 0 to 20.' },
                class: { zh: '追加到骨架表格容器的 CSS 类。', en: 'Additional CSS classes applied to the skeleton table container.' },
            },
        },
        SkeletonText: {
            props: {
                variant: { zh: '设置文本行骨架的颜色变体。', en: 'Sets the color variant used by the text-line skeletons.' },
                lines: { zh: '设置占位文本行数，默认 3 行，结果截断并限制在 0 到 100 行。', en: 'Sets the number of placeholder text lines. It defaults to 3 and is truncated and clamped from 0 to 100.' },
                lastLineWidth: { zh: '设置最后一行的 CSS 宽度，默认 60%；其余行占满可用宽度。', en: 'Sets the CSS width of the last line, defaulting to 60%; preceding lines use the full available width.' },
                class: { zh: '追加到多行骨架文本容器的 CSS 类。', en: 'Additional CSS classes applied to the multi-line skeleton text container.' },
            },
        },
    },
} satisfies ApiContent

export default content
