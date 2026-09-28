import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Checkbox: {
            props: {
                class: { zh: '追加到复选框根交互元素的 CSS 类。', en: 'CSS classes added to the checkbox root interactive element.' },
                checked: { zh: '受控选中状态，可为选中、未选中或 `indeterminate`；省略时组件使用内部状态。', en: 'The controlled checked state: checked, unchecked, or `indeterminate`. When omitted, the component maintains its own state.' },
                defaultValue: { zh: '非受控模式的初始状态，仅在 `checked` 未设置时生效。', en: 'The initial state in uncontrolled mode; it only applies when `checked` is not set.' },
                disabled: { zh: '禁用复选框交互并传递禁用状态给底层 Reka UI 原语。', en: 'Disables checkbox interaction and passes the disabled state to the underlying Reka UI primitive.' },
                variant: { zh: '选择复选框的颜色样式变体。', en: 'Selects the checkbox color style variant.' },
                size: { zh: '设置复选框及内部状态图标的尺寸。', en: 'Sets the size of the checkbox and its state icon.' },
                ariaLabel: { zh: '复选框的无障碍名称；未提供时使用本地化默认文案。', en: 'The checkbox accessible name; localized default text is used when omitted.' },
                name: { zh: '原生表单字段名；设置后随所属表单提交复选框值。', en: 'The native form field name. When set, the checkbox value is submitted with its form.' },
                value: { zh: '随表单提交的值；传递给 Reka UI 根原语，未设置时使用其原生默认值 `on`。', en: 'The value submitted with the form. It is forwarded to the Reka UI root primitive, whose native default is `on` when omitted.' },
                required: { zh: '设置原生表单必填状态并传递给底层原语。', en: 'Sets the native form required state and passes it to the underlying primitive.' },
            },
            events: {
                'update:checked': { zh: '选中状态变化时发出新的布尔值或 `indeterminate`，可与 `v-model:checked` 配合。', en: 'Emits the new boolean or `indeterminate` state when it changes; supports `v-model:checked`.' },
            },
        },
    },
} satisfies ApiContent

export default content
