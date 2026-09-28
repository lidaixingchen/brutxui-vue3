import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Rate: {
            props: {
                modelValue: {
                    zh: '当前评分，通过 v-model 绑定；鼠标悬停时临时预览悬停分值，移出后恢复显示绑定值。',
                    en: 'The current rating, bound with v-model. Hovering temporarily previews a rating; leaving restores the bound value.',
                },
                max: {
                    zh: '评分上限，同时决定渲染的图标数量和键盘 End 键选中的分值；应传入正整数。',
                    en: 'The maximum rating, number of rendered icons, and value selected by the End key. Supply a positive integer.',
                },
                allowHalf: {
                    zh: '启用半分选择与半图标填充；鼠标可选择每个图标的左半区，方向键步长也变为半分。',
                    en: 'Enables half-point selection and half-filled icons. The left half of each icon selects a half point, and arrow keys move in half-point steps.',
                },
                readonly: {
                    zh: '仅展示评分，停止鼠标预览、点击选择和键盘修改，并将组件移出 Tab 焦点顺序。',
                    en: 'Displays the rating while preventing hover previews, pointer selection, and keyboard changes, and removes the component from the Tab order.',
                },
                size: {
                    zh: '控制评分图标的尺寸和图标之间的间距。',
                    en: 'Controls the rating icon dimensions and spacing between icons.',
                },
                icon: {
                    zh: '用于评分图标的 BrutalShape 图腾名称，例如 heart、lightning 或 star-5。',
                    en: 'The BrutalShape name used for rating icons, such as heart, lightning, or star-5.',
                    fallback: {
                        'zh-CN': '未提供、传入空字符串或名称不在图腾库中时，使用 Lucide Star 星形。',
                        en: 'When omitted, empty, or not recognized by the shape library, the component uses the Lucide Star icon.',
                    },
                },
            },
            events: {
                'update:modelValue': {
                    zh: '用户通过鼠标或键盘选择了与当前值不同的评分时触发，用于更新 v-model；悬停预览不会触发。',
                    en: 'Emitted when pointer or keyboard selection chooses a rating different from the current value, updating v-model. Hover previews do not emit it.',
                },
                change: {
                    zh: '用户选中的评分发生变化时，在 update:modelValue 之后触发，参数为相同的新评分。',
                    en: 'Emitted after update:modelValue when the user selects a different rating, with the same new rating as its payload.',
                },
            },
        },
    },
} satisfies ApiContent

export default content
