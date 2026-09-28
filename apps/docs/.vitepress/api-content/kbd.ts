import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Kbd: {
            props: {
                variant: {
                    zh: '控制键帽的配色；backlit 使用黑色背景和 accent 色文字，呈现背光键帽效果。',
                    en: 'Controls the keycap colors. The backlit variant uses a black background and accent-colored text for a backlit appearance.',
                },
                size: {
                    zh: '控制键帽的内边距、字号与最小宽度。',
                    en: 'Controls the keycap padding, font size, and minimum width.',
                },
                class: {
                    zh: '合并到原生 kbd 根元素上的补充 CSS 类名。',
                    en: 'Additional CSS classes merged into the native kbd root element.',
                },
            },
            slots: {
                default: {
                    zh: '键帽内展示的按键名称、符号或图标；组件本身只负责展示快捷键提示。',
                    en: 'The key name, symbol, or icon displayed inside the keycap. The component presents a keyboard shortcut hint.',
                },
            },
        },
    },
} satisfies ApiContent

export default content
