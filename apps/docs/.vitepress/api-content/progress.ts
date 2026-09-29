import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Progress: {
            props: {
                class: { zh: '追加到进度条根轨道的 CSS 类。', en: 'CSS classes added to the progress root track.' },
                modelValue: { zh: '当前进度数值；超出范围或非有限值会归一化到 `0...max` 内。', en: 'The current progress value; values outside the range or non-finite values are normalized to `0...max`.' },
                max: { zh: '进度上限；必须是正的有限数，否则组件回退到 `100`。', en: 'The upper progress bound; non-positive or non-finite values fall back to `100`.' },
                size: { zh: '设置进度轨道的高度预设。', en: 'Sets the height preset of the progress track.' },
                variant: { zh: '设置进度指示填充的颜色变体。', en: 'Sets the color variant of the progress indicator.' },
                pattern: { zh: '在指示填充上叠加无纹理、LED 分段或警戒斜纹效果；不确定状态会优先使用滑轨动画而关闭纹理。', en: 'Adds no texture, segmented LED styling, or animated hazard stripes to the fill. Indeterminate mode uses the track animation and suppresses the pattern.' },
                indeterminate: { zh: '显示循环移动的不确定进度，不使用 `modelValue`。', en: 'Shows a looping indeterminate indicator that does not use `modelValue`.' },
                showLabel: { zh: '在确定进度时显示居中的百分比标签；不确定状态不显示。', en: 'Shows a centered percentage label for determinate progress; it is hidden in indeterminate mode.' },
            },
        },
    },
} satisfies ApiContent

export default content
