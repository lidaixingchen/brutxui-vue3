import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Tabs: {
            props: {
                modelValue: { zh: '受控模式下当前激活的标签页值，支持 v-model；为 undefined 时由组件维护选择状态。', en: 'The active tab value in controlled mode, supporting v-model. When undefined, the component maintains selection internally.' },
                defaultValue: {
                    zh: '非受控模式的初始标签页值，也用于数据列表中当前选择失效后的回退。', en: 'The initial uncontrolled tab value, also used as a fallback when the current selection disappears from the data list.',
                    fallback: { 'zh-CN': '未提供时，数据驱动模式使用 tabs 首项的 value；组合模式交由底层 TabsRoot 处理初始状态。', en: 'When omitted, data-driven mode uses the first tabs item value; composition mode leaves initial state handling to TabsRoot.' },
                },
                tabs: { zh: '标签页数据列表。非空时自动渲染触发器与默认内容面板；空数组显示本地化空状态；未提供时通过默认插槽自行组合。', en: 'The tab data list. A non-empty list renders triggers and default panels, an empty list shows a localized empty state, and omission enables composition through the default slot.' },
                orientation: { zh: '标签页根状态的排列方向和键盘导航方向，也为 TabsList 提供默认方向。', en: 'The root tab orientation for layout state and keyboard navigation, also providing the default orientation for TabsList.' },
                class: { zh: '自定义 CSS 类；提供 tabs 时作用于外层容器，组合模式下作用于 TabsRoot。', en: 'Custom CSS classes applied to the outer container when tabs is provided, or to TabsRoot in composition mode.' },
            },
            events: {
                'update:modelValue': { zh: '激活标签页改变时发出新的字符串值；非受控模式同时更新内部选择。', en: 'Emits the new string value when the active tab changes, also updating internal selection in uncontrolled mode.' },
            },
            slots: {
                header: { zh: '数据驱动模式下位于标签页区域上方的内容；tabs 为空数组时仍显示。', en: 'Content above the tabs in data-driven mode, also rendered when tabs is an empty array.' },
                default: { zh: '组合模式下放置完整标签页结构；数据驱动模式下替换自动生成的内容面板，需自行放置 TabsContent。tabs 为空数组时不渲染此插槽。', en: 'Contains the complete tab structure in composition mode. In data-driven mode, replaces the generated panels and should supply TabsContent components. It is not rendered for an empty tabs array.' },
                footer: { zh: '数据驱动模式下位于标签页区域下方的内容；tabs 为空数组时仍显示。', en: 'Content below the tabs in data-driven mode, also rendered when tabs is an empty array.' },
            },
        },
        TabsContent: {
            props: {
                value: { zh: '此内容面板对应的标签页值，应与 TabsTrigger 的 value 一致。', en: 'The tab value associated with this panel, matching its TabsTrigger value.' },
                surface: {
                    zh: '外壳渲染模式：plain 为零边距贴合（适合内嵌 Card），panel 为带实体边框与阴影的独立卡片面板。',
                    en: 'Surface shell mode: plain for zero-padding fitting (ideal for nested Card), panel for standalone card shell with borders and shadow.',
                },
                forceMount: { zh: '保持内容面板挂载，以便控制外部动画或保留面板实例。', en: 'Keeps the panel mounted for external animation control or to retain the panel instance.' },
                class: { zh: '合并到标签页内容面板的自定义 CSS 类。', en: 'Custom CSS classes merged onto the tab panel.' },
            },
            slots: { default: { zh: '此标签页对应的内容。', en: 'The content associated with this tab.' } },
        },
        TabsList: {
            props: {
                size: { zh: '标签列表容器的尺寸变体。', en: 'The size variant of the tab list container.' },
                orientation: {
                    zh: '覆盖标签列表自身的布局样式与 data-orientation，不改变根 Tabs 的键盘方向设置。', en: 'Overrides the list layout styles and data-orientation without changing the root Tabs keyboard orientation.',
                    fallback: { 'zh-CN': '依次使用此属性、父 Tabs 注入的方向、horizontal。', en: 'Resolves from this prop, then the parent Tabs orientation, then horizontal.' },
                },
                class: { zh: '合并到标签列表容器的自定义 CSS 类。', en: 'Custom CSS classes merged onto the tab list container.' },
            },
            slots: { default: { zh: '标签触发器列表，通常放置 TabsTrigger。', en: 'The tab trigger list, typically containing TabsTrigger components.' } },
        },
        TabsTrigger: {
            props: {
                value: { zh: '标签页的唯一字符串标识，用于关联对应的 TabsContent。', en: 'The unique string identifier linking this tab to its TabsContent.' },
                disabled: { zh: '禁用此标签页触发器，阻止用户激活。', en: 'Disables this tab trigger and prevents user activation.' },
                variant: { zh: '触发器的视觉变体，控制激活状态的配色及装饰。', en: 'The trigger visual variant, controlling active-state colors and decoration.' },
                class: { zh: '合并到标签页触发器的自定义 CSS 类。', en: 'Custom CSS classes merged onto the tab trigger.' },
            },
            slots: { default: { zh: '标签页触发器的文字、图标或其他标签内容。', en: 'Text, icons, or other label content inside the tab trigger.' } },
        },
    },
} satisfies ApiContent

export default content
