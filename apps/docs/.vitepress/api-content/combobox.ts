import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Combobox: {
            props: {
                options: { zh: '可供选择的选项列表；每项含字符串 value、显示 label 和可选 disabled。', en: 'The available options. Each item has a string value, a display label, and an optional disabled flag.' },
                modelValue: { zh: '当前选中的字符串值或值数组，通过 v-model 绑定；多选时使用字符串数组。', en: 'The selected string or array of strings, bound with v-model; multiple mode uses an array.' },
                multiple: { zh: '启用多选模式后，用户可同时选择多个选项。', en: 'Enables multiple selection so users can choose more than one option.' },
                open: { zh: '下拉面板展开状态；传入后组件处于受控模式，父组件需回写 update:open 才能应用切换。', en: 'The dropdown open state. When supplied, the state is controlled and the parent must write back update:open changes.' },
                placeholder: { zh: '触发器未选择内容时的占位文本；未提供时按单选或多选模式读取本地化文案。', en: 'Placeholder shown with no selection; when omitted, localized text is chosen for single or multiple mode.' },
                searchPlaceholder: { zh: '下拉面板内搜索输入框的占位文本；未提供时读取本地化文案。', en: 'Placeholder for the search field inside the dropdown; localized text is used when omitted.' },
                emptyText: { zh: '搜索没有匹配选项时显示的文本；未提供时读取本地化文案。', en: 'Text shown when the search has no matching options; localized text is used when omitted.' },
                disabled: { zh: '禁用触发器以及选项交互。', en: 'Disables the trigger and option interactions.' },
                loading: { zh: '显示加载状态，用于异步准备或刷新选项时反馈等待。', en: 'Shows a loading state while options are being prepared or refreshed asynchronously.' },
                creative: { zh: '没有匹配项且搜索文本非空时显示创建选项；组件仅发出 create，不会自行写入 modelValue。', en: 'Shows a create option when a non-empty query has no matches; the component emits create without changing modelValue.' },
                maxDisplay: { zh: '多选时触发器最多展示的选中标签数；超出部分汇总为数量提示。', en: 'The maximum selected tags shown in the trigger in multiple mode; additional selections are summarized by count.' },
                ariaLabel: { zh: '设置组合框触发器的无障碍名称。', en: 'Sets the accessible name of the combobox trigger.' },
                class: { zh: '追加到组合框根容器的自定义 CSS 类。', en: 'Custom CSS classes added to the combobox root container.' },
                iconSize: { zh: '设置触发器下拉指示图标的尺寸。', en: 'Sets the size of the dropdown indicator icon.' },
            },
            events: {
                'update:modelValue': { zh: '选择值变化时发出新值；多选模式发出字符串数组，单选再次选择当前项时发出 undefined。', en: 'Emits the new selection; multiple mode emits an array, while selecting the current single option again emits undefined.' },
                'update:open': { zh: '下拉面板请求展开或关闭时发出目标布尔状态。', en: 'Emits the requested boolean state when the dropdown opens or closes.' },
                create: { zh: '用户选择创建操作时发出去除首尾空白的搜索文本；新选项和值由调用方写入。', en: 'Emits the trimmed search text when the user chooses the create action; the caller adds the option and value.' },
            },
            exposes: {
                searchQuery: { zh: '当前搜索输入文本；面板关闭或单选完成后会清空。', en: 'The current search text; it is cleared when the panel closes or a single selection completes.' },
                selectedValue: { zh: '当前 modelValue 的只读计算值。', en: 'A read-only computed value of the current modelValue.' },
                focus: { zh: '将键盘焦点移动到组合框触发器。', en: 'Moves keyboard focus to the combobox trigger.' },
                open: { zh: '可读写的下拉展开状态；设置为 true 可打开面板，受控模式仍需父组件回写更新。', en: 'The readable and writable dropdown state. Setting true opens the panel; controlled mode still requires the parent to write back changes.' },
            },
        },
    },
} satisfies ApiContent

export default content
