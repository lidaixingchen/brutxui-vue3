import type { ApiContent } from '../api-types'

const describe = (items: Record<string, [string, string]>) => Object.fromEntries(
    Object.entries(items).map(([name, [zh, en]]) => [name, { zh, en }]),
)

const content = {
    complete: true,
    members: {
        Cascader: {
            props: describe({
                options: ['级联选择的嵌套选项树；每个选项通过 value、label 和可选 children 描述。', 'The nested option tree for cascading selection; each option uses value and label and may include children.'],
                modelValue: ['当前选择的路径；单选为单条 CascaderValue 路径，多选为路径数组，通过 v-model 绑定。', 'The selected paths, bound with v-model. Single mode uses one CascaderValue path; multiple mode uses an array of paths.'],
                open: ['下拉面板的受控展开状态；通过 v-model:open 同步。', 'The controlled open state of the dropdown panel, synchronized with v-model:open.'],
                multiple: ['允许同时选择多个选项路径；开启后 modelValue 为路径数组。', 'Allows selecting multiple option paths; modelValue is an array of paths when enabled.'],
                clearable: ['显示清除操作以移除已选路径。', 'Shows a clear action for removing the selected paths.'],
                checkStrictly: ['允许独立选择有子项的父节点，而不要求选择到叶子节点。', 'Allows parent nodes with children to be selected without requiring a leaf node.'],
                separator: ['设置触发器中同一路径各级标签之间显示的分隔符。', 'Sets the separator displayed between labels in a path on the trigger.'],
                maxDisplay: ['多选时触发器最多直接显示的路径数量；其余路径折叠为汇总。', 'In multiple mode, the maximum number of paths shown directly in the trigger; remaining paths are collapsed into a summary.'],
                size: ['设置触发器按钮的尺寸变体。', 'Sets the trigger button size variant.'],
                placeholder: ['未选择路径时触发器显示的文字。', 'Text shown in the trigger when no path is selected.'],
                disabled: ['禁用选择器及下拉面板的用户交互。', 'Disables user interaction with the select trigger and dropdown panel.'],
                dropdownClass: ['追加到级联下拉面板的 CSS 类。', 'CSS classes added to the cascader dropdown panel.'],
                class: ['追加到选择器触发按钮的 CSS 类。', 'CSS classes added to the select trigger button.'],
                ariaLabel: ['设置选择器触发器的无障碍标签。', 'Sets the accessible label for the select trigger.'],
            }),
            events: describe({
                'update:modelValue': ['选择路径变化时发出新的路径值；配合 v-model 更新受控值。', 'Emits the updated path value when selection changes, for synchronizing the controlled value with v-model.'],
                'update:open': ['下拉面板展开状态变化时发出新布尔值，可用于 v-model:open。', 'Emits the new boolean when the dropdown open state changes and can be used with v-model:open.'],
                change: ['用户提交新的单选路径或多选路径集合时发出选择结果。', 'Emits the selected single path or set of paths when the user changes the selection.'],
                'open-change': ['下拉面板打开或关闭时发出当前展开状态。', 'Emits the current open state when the dropdown panel opens or closes.'],
            }),
        },
    },
} satisfies ApiContent

export default content
