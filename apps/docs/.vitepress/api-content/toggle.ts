import type { ApiContent } from '../api-types'

const describe = (items: Record<string, [string, string]>) => Object.fromEntries(
    Object.entries(items).map(([name, [zh, en]]) => [name, { zh, en }]),
)

const content = {
    complete: true,
    members: {
        Toggle: {
            props: describe({
                modelValue: ['当前按下状态，通过 v-model 受控绑定。', 'The current pressed state, controlled with v-model.'],
                defaultValue: ['非受控模式的初始按下状态。', 'The initial pressed state in uncontrolled mode.'],
                variant: ['设置 Toggle 的视觉变体。', 'Sets the visual variant of the Toggle.'],
                size: ['设置 Toggle 按钮的尺寸。', 'Sets the size of the Toggle button.'],
                disabled: ['禁用按钮交互。', 'Disables button interaction.'],
                loading: ['显示加载指示器并禁用交互；加载时默认插槽内容被加载状态替代。', 'Shows a loading indicator and disables interaction; the loading state replaces default-slot content.'],
                class: ['追加到 Toggle 根按钮的 CSS 类。', 'CSS classes added to the Toggle root button.'],
                ariaLabel: ['设置 Toggle 的无障碍名称；图标按钮应提供此标签。', 'Sets the Toggle’s accessible name; provide it for icon-only buttons.'],
                name: ['原生表单字段名；按下且未禁用时提交值 `true`。', 'Native form field name; submits the value `true` while pressed and enabled.'],
                required: ['要求 Toggle 处于按下状态；禁用或加载时不参与表单校验。', 'Requires the Toggle to be pressed; disabled or loading Toggles are excluded from form validation.'],
            }),
            events: describe({ 'update:modelValue': ['用户切换按下状态时发出新的布尔值。', 'Emits the new boolean when the user changes the pressed state.'] }),
            slots: describe({ default: ['按钮中显示的文本、图标或其他内容；loading 为真时由加载指示器替代。', 'Text, an icon, or other button content; replaced by the loading indicator while loading is true.'] }),
        },
    },
} satisfies ApiContent

export default content
