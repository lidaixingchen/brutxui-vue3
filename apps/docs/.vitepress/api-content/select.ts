import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Select: {
            props: {
                options: { zh: '一体化选择器的选项列表；每项提供 label 和非空 value，可选 disabled，并可带用于分组的自定义字段。', en: 'The unified select option list. Each option has a label and non-empty value, may be disabled, and can include custom fields used for grouping.' },
                groupField: { zh: '选项对象中用于分组的字段名；未设置时按原列表逐项显示。', en: 'The option field used to group items. When omitted, options are displayed as a flat list.' },
                groupLabel: { zh: '从每组首个选项读取分组标题的字段名；未设置或该字段缺失时使用 groupField 对应的分组值。', en: 'The field on the first option of each group used as its heading; when omitted or absent, the groupField value is used.' },
                placeholder: { zh: '尚未选择选项时显示的占位文字；未提供时使用当前语言的 select.placeholder 文案。', en: 'Placeholder text shown before an option is selected; when omitted, the localized select.placeholder message is used.' },
                disabled: { zh: '禁用选择器根状态以及默认触发器。', en: 'Disables the select root state and its built-in trigger.' },
                required: { zh: '将选择器标记为必填；一体化触发器在 required 为真时不显示清除操作。', en: 'Marks the select as required; the unified trigger hides its clear action while required is true.' },
                name: { zh: '传递给 SelectRoot 的表单字段名称。', en: 'The form field name passed to SelectRoot.' },
                id: { zh: '默认触发器的 DOM ID；自定义 trigger 插槽时由插槽内容自行提供 ID。', en: 'The DOM ID for the built-in trigger. With a custom trigger slot, the slot content supplies its own ID.' },
                size: { zh: '默认触发器的尺寸变体。', en: 'The size variant of the built-in trigger.' },
                variant: { zh: '默认触发器的边框及状态变体。', en: 'The border and state variant of the built-in trigger.' },
                errorMessage: { zh: '传递给默认触发器的错误消息，用于错误提示语义。', en: 'The error message passed to the built-in trigger for its error-state semantics.' },
                clearable: { zh: '允许默认触发器在有选中值时显示清除操作；required 为真时该操作被关闭。', en: 'Allows the built-in trigger to show a clear action when a value is selected; the action is disabled when required is true.' },
                position: { zh: '设置选项浮层相对触发器的定位模式。', en: 'Sets how the options panel is positioned relative to the trigger.' },
                class: { zh: '与 triggerClass 一起合并到默认触发器上的自定义 CSS 类。', en: 'Custom CSS classes merged onto the built-in trigger together with triggerClass.' },
                triggerClass: { zh: '追加到默认触发器的自定义 CSS 类。', en: 'Custom CSS classes added to the built-in trigger.' },
                contentClass: { zh: '追加到选项浮层的自定义 CSS 类。', en: 'Custom CSS classes added to the options panel.' },
                itemVariant: { zh: '应用到 options 自动生成的每个 SelectItem 的变体。', en: 'The variant applied to each SelectItem generated from options.' },
                modelValue: { zh: '当前选中的字符串值，通过 v-model 受控绑定；未选择时可为 undefined。', en: 'The currently selected string value, controlled with v-model; it may be undefined when nothing is selected.' },
            },
            events: {
                'update:modelValue': { zh: '选择值变化时发出新值；在默认清除操作中发出 undefined。', en: 'Emits the new value when the selection changes; the built-in clear action emits undefined.' },
            },
            slots: {
                default: { zh: '接管整个 Select 内容。提供时组件不渲染默认触发器或由 options 生成的浮层，插槽需自行组合原语。', en: 'Replaces the entire Select content. When provided, the component renders neither its built-in trigger nor the options panel, so the slot must compose the primitives itself.' },
                trigger: { zh: '替换默认触发器；选项浮层仍由 options 自动生成，插槽没有参数。', en: 'Replaces the built-in trigger while the options panel is still generated from options. The slot receives no arguments.' },
            },
        },
        SelectContent: {
            props: {
                position: { zh: '控制内容浮层相对触发器的定位方式。', en: 'Controls how the content panel is positioned relative to its trigger.' },
                class: { zh: '追加到浮动内容面板的自定义 CSS 类。', en: 'Custom CSS classes added to the floating content panel.' },
            },
            slots: { default: { zh: '渲染选项、分组和其他内容面板子项。', en: 'Renders options, groups, and other content-panel children.' } },
        },
        SelectItem: {
            props: {
                value: { zh: '此选项的非空唯一字符串值，用作选择结果。', en: 'The non-empty, unique string value of this option, used as the selection result.' },
                disabled: { zh: '阻止用户选择此选项。', en: 'Prevents the user from selecting this option.' },
                variant: { zh: '此选项的视觉变体。', en: 'The visual variant for this option.' },
                class: { zh: '追加到选项根元素的自定义 CSS 类。', en: 'Custom CSS classes added to the option root element.' },
                indicatorClass: { zh: '追加到选中状态指示器的自定义 CSS 类。', en: 'Custom CSS classes added to the selected-state indicator.' },
                iconClass: { zh: '追加到选中勾选图标的自定义 CSS 类。', en: 'Custom CSS classes added to the selected check icon.' },
                iconSize: { zh: '设置选中勾选图标的尺寸。', en: 'Sets the size of the selected check icon.' },
            },
            slots: { default: { zh: '显示在选项文字区域中的内容。', en: 'The content displayed in the option text area.' } },
        },
        SelectLabel: {
            props: { class: { zh: '追加到分组标题元素的自定义 CSS 类。', en: 'Custom CSS classes added to the group heading element.' } },
            slots: { default: { zh: '分组标题文本或其他标题内容。', en: 'The group heading text or other heading content.' } },
        },
        SelectScrollDownButton: {
            props: {
                class: { zh: '追加到向下滚动提示控件的自定义 CSS 类。', en: 'Custom CSS classes added to the scroll-down indicator control.' },
                iconSize: { zh: '设置向下滚动箭头图标的尺寸。', en: 'Sets the size of the scroll-down arrow icon.' },
            },
        },
        SelectScrollUpButton: {
            props: {
                class: { zh: '追加到向上滚动提示控件的自定义 CSS 类。', en: 'Custom CSS classes added to the scroll-up indicator control.' },
                iconSize: { zh: '设置向上滚动箭头图标的尺寸。', en: 'Sets the size of the scroll-up arrow icon.' },
            },
        },
        SelectSeparator: {
            props: {
                decorative: { zh: '声明分隔线是否仅用于装饰；装饰模式下由原语从无障碍树中隐藏。', en: 'Declares whether the separator is decorative; the primitive hides decorative separators from the accessibility tree.' },
                class: { zh: '追加到分隔线元素的自定义 CSS 类。', en: 'Custom CSS classes added to the separator element.' },
            },
        },
        SelectTrigger: {
            props: {
                size: { zh: '触发器的尺寸变体，同时决定下拉图标的尺寸映射。', en: 'The trigger size variant, which also determines the mapped dropdown icon size.' },
                variant: { zh: '触发器的边框及状态变体。', en: 'The trigger border and state variant.' },
                errorMessage: { zh: '错误态消息，错误状态下用于关联触发器的错误提示。', en: 'The error-state message associated with the trigger when it is invalid.' },
                disabled: { zh: '禁用触发器和清除操作。', en: 'Disables the trigger and its clear action.' },
                id: { zh: '原生触发按钮的 DOM ID。', en: 'The DOM ID of the native trigger button.' },
                clearable: { zh: '有选中值且未禁用时允许显示清除按钮。', en: 'Allows the clear button to appear when a value is selected and the trigger is enabled.' },
                modelValue: { zh: '当前值，仅用于判断是否存在可清除的选中内容。', en: 'The current value, used to determine whether there is a selection to clear.' },
                class: { zh: '追加到触发按钮的自定义 CSS 类。', en: 'Custom CSS classes added to the trigger button.' },
                iconClass: { zh: '追加到下拉指示图标的自定义 CSS 类。', en: 'Custom CSS classes added to the dropdown indicator icon.' },
            },
            events: { clear: { zh: '用户执行清除操作时发出；该事件本身不承载参数。', en: 'Emitted when the user activates the clear action; the event carries no payload.' } },
            slots: { default: { zh: '触发器显示内容，通常包含 SelectValue。', en: 'The trigger content, usually including SelectValue.' } },
        },
    },
} satisfies ApiContent

export default content
