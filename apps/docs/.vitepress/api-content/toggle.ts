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
                variant: ['设置 Toggle 的视觉变体。', 'Sets the visual variant of the Toggle.'],
                size: ['设置 Toggle 按钮的尺寸。', 'Sets the size of the Toggle button.'],
                disabled: ['禁用按钮交互。', 'Disables button interaction.'],
                loading: ['显示加载指示器并禁用交互；加载时默认插槽内容被加载状态替代。', 'Shows a loading indicator and disables interaction; the loading state replaces default-slot content.'],
                class: ['追加到 Toggle 根按钮的 CSS 类。', 'CSS classes added to the Toggle root button.'],
                ariaLabel: ['设置 Toggle 的无障碍名称；图标按钮应提供此标签。', 'Sets the Toggle’s accessible name; provide it for icon-only buttons.'],
            }),
            events: describe({ 'update:modelValue': ['用户切换按下状态时发出新的布尔值。', 'Emits the new boolean when the user changes the pressed state.'] }),
            slots: describe({ default: ['按钮中显示的文本、图标或其他内容；loading 为真时由加载指示器替代。', 'Text, an icon, or other button content; replaced by the loading indicator while loading is true.'] }),
        },
    },
} satisfies ApiContent

export default content
