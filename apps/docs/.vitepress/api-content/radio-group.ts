import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        RadioGroup: {
            props: {
                modelValue: { zh: '当前选中的字符串值，可通过 v-model 受控同步。', en: 'The currently selected string value, synchronized through a controlled v-model.' },
                name: { zh: '传递给单选组原语的表单字段名称。', en: 'The form field name passed to the radio-group primitive.' },
                disabled: { zh: '禁用组内所有单选项。', en: 'Disables every radio item in the group.' },
                orientation: { zh: '设置选项排列方向；vertical 为纵向，horizontal 为可换行的横向排列，默认纵向。', en: 'Sets item layout: vertical stacks items, while horizontal lays them out with wrapping; vertical is the default.' },
                class: { zh: '追加到单选组根容器的 CSS 类。', en: 'Additional CSS classes applied to the radio-group root container.' },
                ariaLabel: { zh: '为整个单选组提供屏幕阅读器可读的无障碍名称。', en: 'Provides an accessible name for the whole radio group.' },
            },
            events: {
                'update:modelValue': { zh: '所选值变化时发出新字符串值，用于同步 v-model。', en: 'Emits the new string value when the selection changes so v-model can be synchronized.' },
            },
            slots: {
                default: { zh: '放置属于此组的 RadioGroupItem 子项。', en: 'Contains the RadioGroupItem options belonging to this group.' },
            },
        },
        RadioGroupItem: {
            props: {
                value: { zh: '此选项对应的字符串值；被选中时作为 RadioGroup 的 modelValue。', en: 'The string value represented by this option; when selected, it becomes the RadioGroup modelValue.' },
                disabled: { zh: '禁用此选项；未禁用的其他组内选项仍可交互。', en: 'Disables this option while leaving other enabled options in the group interactive.' },
                class: { zh: '追加到单选项按钮根元素的 CSS 类。', en: 'Additional CSS classes applied to the radio option button.' },
                variant: { zh: '设置单选项及其选中指示器的颜色变体。', en: 'Sets the color variant of the radio option and its selected indicator.' },
                size: { zh: '设置单选按钮和选中指示图标的尺寸。', en: 'Sets the size of the radio button and selected indicator icon.' },
            },
        },
    },
} satisfies ApiContent

export default content
