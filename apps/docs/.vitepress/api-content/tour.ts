import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Tour: {
            props: {
                steps: { zh: '按顺序提供导览步骤；每一步通过 CSS 选择器或 HTMLElement 指定目标，并可带标题、说明、显示方向及遮罩设置。', en: 'Provides ordered tour steps. Each step targets an element by CSS selector or HTMLElement and may include a title, description, placement, and mask setting.' },
                mask: { zh: '设置步骤目标之外是否显示遮罩；默认显示，可由当前 TourStep.mask 单独覆盖。', en: 'Controls whether the mask is shown outside the current target. It defaults to true and can be overridden by the current TourStep.mask.' },
                scrollIntoViewOptions: { zh: '设置切换步骤前滚动目标元素时传给 scrollIntoView 的选项；未指定时使用 block: center、inline: nearest。', en: 'Sets the options passed to scrollIntoView before showing a step. When omitted, block: center and inline: nearest are used.' },
                current: { zh: '当前导览步骤的从 0 开始索引，可通过 v-model:current 受控同步，默认从第一步开始。', en: 'The zero-based current tour step, synchronized through v-model:current and defaulting to the first step.' },
                open: { zh: '控制导览是否打开，可通过 v-model:open 受控同步；默认打开。', en: 'Controls whether the tour is open, synchronized through v-model:open and defaulting to open.' },
            },
            events: {
                close: { zh: '用户跳过或完成导览并关闭时发出。', en: 'Emitted when the user skips or finishes the tour and it closes.' },
                'update:open': { zh: '导览打开状态变化时发出新布尔值，用于同步 v-model:open。', en: 'Emits the new boolean open state when visibility changes so v-model:open can be synchronized.' },
                finish: { zh: '用户在最后一步选择结束时发出。', en: 'Emitted when the user chooses Finish on the final step.' },
                'update:current': { zh: '当前步骤变化时发出新索引，用于同步 v-model:current。', en: 'Emits the new index when the current step changes so v-model:current can be synchronized.' },
                skip: { zh: '用户选择跳过导览时发出。', en: 'Emitted when the user chooses to skip the tour.' },
            },
        },
    },
} satisfies ApiContent

export default content
