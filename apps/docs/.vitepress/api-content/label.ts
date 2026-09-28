import type { ApiContent } from '../api-types'

const describe = (items: Record<string, [string, string]>) => Object.fromEntries(
    Object.entries(items).map(([name, [zh, en]]) => [name, { zh, en }]),
)

const content = {
    complete: true,
    members: {
        Label: {
            props: describe({
                variant: ['设置标签的语义颜色变体。', 'Sets the semantic color variant of the label.'],
                size: ['设置标签文字和间距尺寸。', 'Sets the label text and spacing size.'],
                required: ['在标签文字后显示必填星号装饰；需同时在表单控件上声明 required 语义。', 'Shows a decorative required asterisk after the label text; declare required semantics on the form control as well.'],
                disabled: ['呈现禁用状态样式并设置 aria-disabled；不会自动禁用关联的表单控件。', 'Applies disabled-state styling and sets aria-disabled; it does not disable the associated form control.'],
                for: ['设置原生 label 的 for 属性，以关联具有相同 ID 的表单控件。', 'Sets the native label for attribute to associate it with a form control that has the same ID.'],
                class: ['追加到 label 根元素的 CSS 类。', 'CSS classes added to the label root element.'],
            }),
            slots: describe({ default: ['标签显示的文本、表单字段名或其他内联内容。', 'The displayed label text, field name, or other inline content.'] }),
        },
    },
} satisfies ApiContent

export default content
