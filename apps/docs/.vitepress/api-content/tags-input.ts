import type { ApiContent } from '../api-types'

const primitiveElementProps = {
    asChild: {
        zh: '将组件的属性与交互行为合并到唯一子元素上，并由该子元素替代默认渲染元素。',
        en: 'Merges the component props and interaction behavior into its single child, which replaces the default rendered element.',
    },
    as: {
        zh: '指定此标签输入子组件使用的 HTML 标签或 Vue 组件；与 asChild 同时设置时由 asChild 决定渲染元素。',
        en: 'Selects the HTML tag or Vue component rendered for this tags-input part; asChild takes precedence when both are set.',
    },
}

const content = {
    complete: true,
    members: {
        TagsInput: {
            props: {
                modelValue: { zh: '受控的标签值列表，可通过 v-model 同步；每项可以是字符串、数字、bigint 或对象。', en: 'The controlled list of tag values, synchronized with v-model. Each value may be a string, number, bigint, or object.' },
                defaultValue: { zh: '非受控模式使用的初始标签值列表；需要从外部同步时请改用 modelValue。', en: 'The initial tag list for uncontrolled use. Use modelValue when the list must stay synchronized with external state.' },
                addOnPaste: { zh: '粘贴文本时按 delimiter 拆分并尝试添加标签；是否成功仍受 max 和 duplicate 限制。', en: 'Splits pasted text using delimiter and attempts to add the resulting tags, subject to max and duplicate rules.' },
                addOnTab: { zh: '按 Tab 键时将当前输入提交为标签。', en: 'Commits the current input as a tag when the Tab key is pressed.' },
                addOnBlur: { zh: '输入框失焦时将当前输入提交为标签。', en: 'Commits the current input as a tag when the input loses focus.' },
                duplicate: { zh: '允许列表中存在重复标签值；关闭时重复值会被视为无效。', en: 'Allows duplicate tag values in the list. When false, a duplicate value is treated as invalid.' },
                disabled: { zh: '禁用标签输入组及其子项的用户交互。', en: 'Disables user interaction with the tags-input group and its child items.' },
                delimiter: { zh: '用于提交输入和拆分粘贴内容的分隔符；可以传入单个字符串或正则表达式。', en: 'The delimiter used to commit typed input and split pasted text. Accepts a string or regular expression.' },
                dir: { zh: '设置组合框内容的阅读方向；未指定时继承 ConfigProvider 配置，否则按从左到右处理。', en: 'Sets the reading direction for the combobox. When omitted, it inherits ConfigProvider or defaults to left-to-right.' },
                max: { zh: '允许的最大标签数量；达到上限后不再添加标签并发出 invalid，设为 0 表示不限制。', en: 'The maximum number of tags. Further additions are rejected and emit invalid at the limit; 0 means unlimited.' },
                id: { zh: '传递给标签输入根原语的 DOM ID，用于标识该输入组。', en: 'The DOM ID passed to the tags-input root primitive to identify this input group.' },
                convertValue: { zh: '将输入字符串转换为标签值的函数；使用对象标签并通过 TagsInputInput 输入时必须提供。', en: 'Converts typed strings into tag values. It is required when using object values with TagsInputInput.' },
                displayValue: { zh: '将标签值转换为显示文本；适用于对象标签或需要添加后缀等展示格式的场景。', en: 'Converts a tag value to display text, for example when rendering object values or adding a display suffix.' },
                ...primitiveElementProps,
                name: { zh: '表单字段名；提交所属表单时，标签值会以此名称参与表单数据提交。', en: 'The form field name used when this tags input is submitted with its owning form.' },
                required: { zh: '将标签输入标记为所属表单的必填字段。', en: 'Marks the tags input as required before its owning form can be submitted.' },
                class: { zh: '追加到标签输入根容器的 CSS 类。', en: 'Additional CSS classes applied to the tags-input root container.' },
                ariaLabel: { zh: '标签输入组的无障碍名称；未提供时使用当前语言的 tagsInput.label 文案。', en: 'The accessible name of the tags-input group. When omitted, the localized tagsInput.label text is used.' },
            },
            events: {
                'update:modelValue': { zh: '标签列表变化时发出新数组，用于同步受控 v-model。', en: 'Emits the updated tag array when the list changes so a controlled v-model can be synchronized.' },
                invalid: { zh: '尝试添加重复值或超过 max 上限的标签时发出被拒绝的标签值。', en: 'Emits the rejected tag value when an addition is a duplicate or would exceed max.' },
                addTag: { zh: '成功添加标签后发出新增的标签值。', en: 'Emits the newly added value after a tag is successfully added.' },
                removeTag: { zh: '成功移除标签后发出被移除的标签值。', en: 'Emits the removed value after a tag is successfully removed.' },
            },
            slots: {
                default: { zh: '组合标签项和输入框的内容；作用域中提供当前 modelValue，通常放置 TagsInputItem 与 TagsInputInput。', en: 'Composes the tag items and input field. The slot scope exposes modelValue; it usually contains TagsInputItem and TagsInputInput.' },
            },
        },
        TagsInputInput: {
            props: {
                placeholder: { zh: '输入框为空时显示的占位文本。', en: 'Placeholder text shown while the input is empty.' },
                autoFocus: { zh: '组件挂载后自动将焦点移到输入框。', en: 'Moves focus to the input when the component mounts.' },
                maxLength: { zh: '限制输入框中可输入的字符数。', en: 'Limits the number of characters that can be entered in the input.' },
                ...primitiveElementProps,
                class: { zh: '追加到标签输入原生输入元素的 CSS 类。', en: 'Additional CSS classes applied to the native tags-input field.' },
            },
        },
        TagsInputItem: {
            props: {
                variant: { zh: '设置单个标签的配色变体。', en: 'Sets the color variant for an individual tag.' },
                class: { zh: '追加到单个标签容器的 CSS 类。', en: 'Additional CSS classes applied to the individual tag container.' },
                value: { zh: '此标签对应的值，必须与根组件标签列表中的一项匹配。', en: 'The value represented by this tag, which must match an item in the root tag list.' },
                disabled: { zh: '禁止对此标签执行交互操作。', en: 'Prevents interaction with this tag.' },
                ...primitiveElementProps,
            },
            slots: {
                default: { zh: '渲染标签项内容，通常包含 TagsInputItemText 和 TagsInputItemDelete。', en: 'Renders the tag item content, commonly TagsInputItemText and TagsInputItemDelete.' },
            },
        },
        TagsInputItemDelete: {
            props: {
                class: { zh: '追加到标签删除按钮的 CSS 类。', en: 'Additional CSS classes applied to the tag delete button.' },
                ariaLabel: { zh: '删除按钮的无障碍名称；未提供时使用当前语言的默认删除文案。', en: 'The delete button’s accessible name. When omitted, the localized default delete text is used.' },
                type: { zh: '设置原生按钮类型，默认 button 可避免在表单中误触发提交。', en: 'Sets the native button type. The default button value avoids accidental form submission.' },
                ...primitiveElementProps,
            },
            slots: {
                default: { zh: '自定义删除按钮内容；未提供时显示 X 图标。', en: 'Customizes the delete button content; an X icon is shown when omitted.' },
            },
        },
        TagsInputItemText: {
            props: {
                ...primitiveElementProps,
                class: { zh: '追加到标签文本元素的 CSS 类。', en: 'Additional CSS classes applied to the tag text element.' },
            },
            slots: {
                default: { zh: '渲染标签的文本内容。', en: 'Renders the text content of the tag.' },
            },
        },
    },
} satisfies ApiContent

export default content
