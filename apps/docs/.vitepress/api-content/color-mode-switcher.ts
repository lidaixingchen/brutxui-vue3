import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        ColorModeSwitcher: {
            props: {
                display: { zh: '选择图标按钮、带当前模式文本的按钮或下拉选择器；两种按钮模式按可用模式顺序循环切换。', en: 'Chooses an icon button, a button labeled with the current mode, or a select. Both button modes cycle through the available modes.' },
                showSystem: {
                    zh: '将跟随系统模式包含在循环切换与下拉选项中。',
                    en: 'Includes system mode in the button cycle and select options.',
                    notes: {
                        'zh-CN': ['设为假不会修改现有主题状态。若当前模式仍为 system，按钮保留该状态，下拉框显示实际解析的亮暗模式，直到选择一个可用选项。'],
                        en: ['Disabling it does not change existing theme state. If the current mode is system, buttons preserve that state and the select displays the resolved light or dark mode until an available option is selected.'],
                    },
                },
                class: { zh: '传给当前展示模式的根组件：按钮模式为 Button，下拉模式为 SelectRoot。', en: 'Classes passed to the active mode root: Button in button modes, or SelectRoot in select mode.' },
            },
        },
    },
} satisfies ApiContent

export default content
