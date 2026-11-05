import type { ApiContent } from '../api-types'

const describe = (items: Record<string, [string, string]>) => Object.fromEntries(
    Object.entries(items).map(([name, [zh, en]]) => [name, { zh, en }]),
)

const content = {
    complete: true,
    members: {
        Switch: {
            props: describe({
                class: ['追加到 Switch 原语根元素的 CSS 类。', 'CSS classes added to the Switch primitive root element.'],
                modelValue: ['受控开关状态，通过 v-model 绑定；传入 null 时按关闭状态处理。', 'The controlled switch state, bound with v-model; null is treated as off.'],
                defaultValue: ['非受控模式的挂载初值；所属原生表单重置时恢复此值。', 'The initial uncontrolled state at mount, restored when the owning native form resets.'],
                disabled: ['禁用开关交互。', 'Disables switch interaction.'],
                variant: ['设置开关的颜色和状态样式变体。', 'Sets the switch color and state style variant.'],
                size: ['设置开关轨道和滑块的尺寸。', 'Sets the size of the switch track and thumb.'],
                showLabels: ['在滑钮内显示当前状态标签，内容由 checkedLabel 和 uncheckedLabel 设置；标签仅为装饰并从无障碍树中隐藏。', 'Shows the current state label inside the thumb, configured with checkedLabel and uncheckedLabel; labels are decorative and hidden from the accessibility tree.'],
                checkedLabel: ['开启状态标签，仅在 showLabels 为 true 时显示；未提供时使用 locale 文案，内置默认为 I。建议使用单字符。', 'Label for the on state, shown only when showLabels is true; falls back to the locale text, I by default. A single character is recommended.'],
                uncheckedLabel: ['关闭状态标签，仅在 showLabels 为 true 时显示；未提供时使用 locale 文案，内置默认为 O。建议使用单字符。', 'Label for the off state, shown only when showLabels is true; falls back to the locale text, O by default. A single character is recommended.'],
                id: ['控件 ID，通过 Label 的 for 属性关联可见名称。', 'Control ID, linked to a visible name through a Label’s for attribute.'],
                name: ['表单字段名；开启且未禁用时随所属原生 form 提交。', 'Form field name, submitted with the owning native form when on and enabled.'],
                value: ['开启时提交的字符串值；未提供时使用原语默认值 on。', 'String value submitted when on; the primitive defaults to on when omitted.'],
                required: ['要求开关开启后才能通过所属原生表单的必填校验；需同时设置 name。', 'Requires the switch to be on for native form validation; also set name.'],
                ariaLabelledby: ['关联名称元素的 ID，作为优先的无障碍名称来源。', 'ID of the naming element, used as the preferred accessible naming source.'],
                ariaLabel: ['显式设置无障碍名称；缺少显式名称和关联 Label 时才使用当前语言的默认文案。', 'Explicit accessible name; the locale default is used only without an explicit name or associated Label.'],
                sound: ['显式启用切换状态时的继电器音效；默认不播放。', 'Explicitly enables the relay sound when the state changes; sound is off by default.'],
            }),
            events: describe({ 'update:modelValue': ['用户切换状态后发出新的布尔值，用于同步 v-model。', 'Emits the new boolean after the user toggles the switch to synchronize v-model.'] }),
        },
    },
} satisfies ApiContent

export default content
