import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Button: {
            props: {
                class: {
                    zh: '合并到按钮根元素上的补充 CSS 类名。',
                    en: 'Additional CSS classes merged into the button root element.',
                },
                variant: {
                    en: 'Controls the button’s visual variant, including its color and interaction-state styles.',
                },
                size: {
                    en: 'Controls the button dimensions and padding. Use `icon` for a square icon button.',
                },
                flair: {
                    en: 'Adds a decorative treatment such as stacked shadows, hazard stripes, or a ticket notch. It composes independently with the color variant.',
                },
                asChild: {
                    en: 'Merges the button props, styles, and interaction behavior into its single child element.',
                },
                type: {
                    en: 'Sets the native button type. When omitted, the rendered native button uses the browser’s default button behavior.',
                },
                loading: {
                    en: 'Shows a loading icon and places the button in its disabled state.',
                },
                disabled: {
                    en: 'Disables the button’s normal user interaction.',
                },
                pendingText: {
                    en: 'Text used as the default slot fallback while a submit button is loading. Explicit slot content takes precedence.',
                    fallback: {
                        'zh-CN': '当 `pendingText` 为 `undefined` 或 `null` 时读取 `submitButton.submitting`，简体中文文案为“提交中...”。',
                        en: 'When `pendingText` is `undefined` or `null`, the component reads `submitButton.submitting`, whose English text is “Submitting...”.',
                    },
                },
                pressed: {
                    en: 'Sets the pressed state for a toggle button and is reflected through `aria-pressed`.',
                },
                expanded: {
                    en: 'Sets whether the content controlled by the button is expanded and is reflected through `aria-expanded`.',
                },
                effect: {
                    en: 'Enables or disables the glitch visual effect. The effect is disabled by default.',
                },
                glitchTrigger: {
                    en: 'Selects how the glitch effect starts: on hover, on click, on autoplay, or never. It applies only when `effect="glitch"`.',
                },
                glitchInterval: {
                    en: 'Sets the autoplay interval for the glitch effect in milliseconds. It applies only when `glitchTrigger="autoplay"` and is clamped to the effect timing limits.',
                },
                glitchSpeed: {
                    en: 'Controls the playback speed of the glitch animation.',
                },
                glitchDirection: {
                    en: 'Controls the direction of the glitch distortion.',
                },
            },
            slots: {
                default: {
                    zh: '按钮主体内容。未提供插槽内容时，只有在 `type="submit"` 且 `loading` 为真时才显示等待文本；显式插槽内容优先。',
                    en: 'The button content. If no slot content is provided, pending text is shown only when `type="submit"` and `loading` are both true. Explicit slot content takes precedence.',
                },
            },
            exposes: {
                play: {
                    zh: '手动激活故障动画。仅在 `effect="glitch"` 时生效；此方法绕过触发方式和禁用状态的检查，但减少动态效果偏好仍会隐藏动画。',
                    en: 'Manually activates the glitch animation. It takes effect only when `effect="glitch"`; it bypasses the trigger and disabled checks, while a reduced-motion preference still hides the animation.',
                },
                stop: {
                    zh: '立即关闭故障动画状态。',
                    en: 'Immediately clears the active glitch animation state.',
                },
            },
        },
    },
    supplements: {
        Button: [
            {
                name: 'click',
                kind: 'events',
                type: 'MouseEvent',
                origin: 'fallthrough',
                source: { file: 'packages/ui/src/components/button/Button.vue' },
                description: {
                    'zh-CN': '渲染根元素的原生点击事件通过 Vue 属性透传交给使用方监听；Button 本身不声明同名自定义事件。',
                    en: 'The rendered root’s native click event is available to consumers through Vue attribute fallthrough; Button does not declare a custom event with this name.',
                },
                notes: {
                    'zh-CN': [
                        '当 `disabled` 或 `loading` 为真时，组件内部点击处理器会调用 `preventDefault()` 和 `stopPropagation()`；原生按钮模式同时设置 `disabled`，`asChild` 模式使用 `aria-disabled` 与 `pointer-events-none`。',
                    ],
                    en: [
                        'When `disabled` or `loading` is true, the internal click handler calls `preventDefault()` and `stopPropagation()`. Native button mode also sets `disabled`; `asChild` mode uses `aria-disabled` and `pointer-events-none`.',
                    ],
                },
            },
        ],
    },
} satisfies ApiContent

export default content
