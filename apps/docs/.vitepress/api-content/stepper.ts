import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Stepper: {
            props: {
                steps: { zh: '按显示顺序提供步骤数据，每项包含唯一 id、标题和可选描述。', en: 'Provides ordered step data. Each item has a unique id and title, with an optional description.' },
                modelValue: { zh: '当前步骤的从 0 开始索引；通过 v-model 受控同步，索引越界时展示状态会钳制到有效范围。', en: 'The zero-based current step index, synchronized through v-model. An out-of-range value is clamped for display state.' },
                orientation: { zh: '设置步骤条布局方向；默认横向，vertical 模式可为当前步骤提供 step-{id} 内容插槽。', en: 'Sets the stepper layout direction. It defaults to horizontal; vertical mode supports step-{id} content slots for the current step.' },
                size: { zh: '设置步骤节点及对应连接线的尺寸级别。', en: 'Sets the size scale for step nodes and their connectors.' },
                variant: { zh: '设置当前激活步骤节点使用的颜色变体。', en: 'Sets the color variant used by the active step node.' },
                clickable: { zh: '允许通过点击步骤节点跳转到对应步骤。', en: 'Allows a step node to be clicked to navigate to that step.' },
                class: { zh: '追加到步骤条根容器的 CSS 类。', en: 'Additional CSS classes applied to the stepper root container.' },
            },
            events: {
                'update:modelValue': { zh: '当前步骤有效索引变化时发出新索引，用于同步 v-model。', en: 'Emits the new valid step index when the current step changes so v-model can be synchronized.' },
                'step-click': { zh: '用户点击步骤节点时携带该节点的从 0 开始索引发出。', en: 'Emitted with the clicked node’s zero-based index when a step node is clicked.' },
            },
            exposes: {
                currentStep: { zh: '只读的当前步骤索引；无步骤时为 -1，其他情况下会限制在有效步骤范围内。', en: 'The read-only current step index. It is -1 when there are no steps and otherwise stays within the valid step range.' },
                totalSteps: { zh: '只读的步骤总数，等于 steps 数组长度。', en: 'The read-only total number of steps, equal to the length of steps.' },
                goToStep: { zh: '请求跳转到指定索引；只有索引位于现有步骤范围内时才发出更新。', en: 'Requests navigation to an index and emits an update only when the index is within the existing step range.' },
                nextStep: { zh: '请求前进一个步骤；空列表或已到最后一步时不发出更新。', en: 'Requests the next step; it emits no update when the list is empty or the current step is already last.' },
                previousStep: { zh: '请求后退一个步骤；空列表或已到第一步时不发出更新。', en: 'Requests the previous step; it emits no update when the list is empty or the current step is already first.' },
                isFirstStep: { zh: '只读布尔值，表示当前步骤是否为第一步；空列表时为 false。', en: 'A read-only boolean indicating whether the current step is first; it is false for an empty list.' },
                isLastStep: { zh: '只读布尔值，表示当前步骤是否为最后一步；空列表时为 false。', en: 'A read-only boolean indicating whether the current step is last; it is false for an empty list.' },
            },
        },
    },
} satisfies ApiContent

export default content
