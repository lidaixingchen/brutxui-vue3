import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        NumberInput: {
            props: {
                layout: { zh: '设置加减按钮相对输入框的布局方式。', en: 'Sets how the increment and decrement buttons are arranged around the input.' },
                variant: { zh: '设置默认、成功或错误边框状态。', en: 'Sets the default, success, or error border state.' },
                errorMessage: { zh: '错误变体下显示并关联到输入控件的错误说明。', en: 'Error text shown and associated with the input in the error variant.' },
                placeholder: { zh: '输入值为空时显示的占位文本；未提供时使用当前语言的默认文案。', en: 'Placeholder shown when the input is empty; the current locale text is used when omitted.' },
                class: { zh: '追加到数字输入组件容器的自定义 CSS 类。', en: 'Custom CSS classes added to the number input container.' },
                iconSize: { zh: '设置加号和减号图标的尺寸。', en: 'Sets the size of the increment and decrement icons.' },
                sound: { zh: '启用步进操作时由 Web Audio 合成的点击音效。', en: 'Enables a Web Audio click sound when a step control is activated.' },
                defaultValue: { zh: '非受控模式下组件首次使用的数字值。', en: 'The initial numeric value used in uncontrolled mode.' },
                modelValue: { zh: '当前受控数值；null 表示空值，可通过 v-model 绑定。', en: 'The current controlled number; null represents an empty value and can be bound with v-model.' },
                min: { zh: '允许输入的最小数值，并限制向下调整的范围。', en: 'The minimum allowed value and lower bound for decrementing.' },
                max: { zh: '允许输入的最大数值，并限制向上调整的范围。', en: 'The maximum allowed value and upper bound for incrementing.' },
                step: { zh: '每次点击加减按钮时调整的数值幅度。', en: 'The amount added or subtracted by each step control activation.' },
                stepSnapping: { zh: '是否将输入值对齐到 step 的整数倍。', en: 'Whether input values are aligned to multiples of step.' },
                focusOnChange: { zh: '值因步进操作变化后是否自动聚焦输入框。', en: 'Whether to focus the input after its value changes through a step action.' },
                formatOptions: { zh: '传递给 Intl.NumberFormat 的格式选项，用于数值显示与本地化输入解析。', en: 'Intl.NumberFormat options used to format the value and interpret locale-specific input.' },
                locale: { zh: '指定数字格式化和输入解析所用的区域设置。', en: 'The locale used for number formatting and input parsing.' },
                disabled: { zh: '禁用输入框和加减按钮。', en: 'Disables the input and its increment and decrement controls.' },
                readonly: { zh: '禁止直接编辑数值，但不等同于禁用组件。', en: 'Prevents direct value editing without disabling the component.' },
                disableWheelChange: { zh: '阻止鼠标滚轮改变当前数值。', en: 'Prevents the mouse wheel from changing the current value.' },
                invertWheelChange: { zh: '反转鼠标滚轮方向与数值增减方向的对应关系。', en: 'Reverses the mapping between wheel direction and value increment or decrement.' },
                id: { zh: '传递给内部输入控件的 DOM id。', en: 'The DOM id passed to the internal input control.' },
                asChild: { zh: '启用组合模式，将组件属性和行为合并到唯一子元素。', en: 'Enables composition mode, merging the component props and behavior into its single child.' },
                as: { zh: '指定根元素渲染使用的标签或 Vue 组件。', en: 'The tag or Vue component used to render the root element.' },
                name: { zh: '内部表单控件的字段名称，用于表单提交。', en: 'The name of the internal form control for form submission.' },
                required: { zh: '将内部输入控件标记为必填字段。', en: 'Marks the internal input control as required.' },
            },
            events: {
                'update:modelValue': { zh: '用户输入或步进调整产生新数值时发出，用于更新 v-model。', en: 'Emits the new numeric value after typing or stepping so v-model can be updated.' },
            },
        },
    },
} satisfies ApiContent

export default content
