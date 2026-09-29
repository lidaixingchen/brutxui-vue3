import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Accordion: {
            props: {
                collapsible: { zh: '单选模式下允许再次激活已展开项以关闭全部内容；多选模式不受此属性影响。', en: 'In single mode, allows activating the open item again to close all content. It has no effect in multiple mode.', fallback: { 'zh-CN': '未提供时使用 Reka UI AccordionRoot 的默认值 false。', en: 'When omitted, uses the Reka UI AccordionRoot default of false.' } },
                disabled: { zh: '禁用整个折叠面板及其所有子项的交互。', en: 'Disables interaction with the entire accordion and all its items.', fallback: { 'zh-CN': '未提供时使用 Reka UI AccordionRoot 的默认值 false。', en: 'When omitted, uses the Reka UI AccordionRoot default of false.' } },
                dir: { zh: '折叠面板的阅读方向，影响键盘导航。', en: 'The reading direction of the accordion, used for keyboard navigation.', fallback: { 'zh-CN': '未提供时使用 Reka UI ConfigProvider 的方向，仍未设置时使用 ltr。', en: 'When omitted, uses the Reka UI ConfigProvider direction, then falls back to ltr.' } },
                orientation: { zh: '折叠面板的排列与方向键导航方向。', en: 'The accordion orientation used for layout state and arrow-key navigation.', fallback: { 'zh-CN': '未提供时使用 Reka UI AccordionRoot 的 vertical 方向。', en: 'When omitted, Reka UI AccordionRoot uses vertical orientation.' } },
                unmountOnHide: { zh: '控制关闭后是否卸载内容，可由子项的同名属性覆盖。', en: 'Controls whether closed content is unmounted; an item can override it with its own unmountOnHide prop.', fallback: { 'zh-CN': '未提供时使用 Reka UI AccordionRoot 的 true 值。', en: 'When omitted, Reka UI AccordionRoot uses true.' } },
                asChild: { zh: '将根原语的属性和行为合并到其子元素上。', en: 'Merges the root primitive props and behavior into its child element.' },
                as: { zh: '指定根原语渲染的元素或组件；asChild 启用时由子元素承载。', en: 'The element or component rendered by the root primitive; asChild delegates rendering to the child.' },
                type: { zh: '指定单项或多项展开模式，优先于根据 modelValue 或 defaultValue 推断的模式。', en: 'Selects single or multiple expansion, overriding the mode inferred from modelValue or defaultValue.' },
                modelValue: { zh: '受控模式下展开项的值，单选使用字符串，多选使用字符串数组，支持 v-model。', en: 'The controlled expanded value: a string for single mode or a string array for multiple mode. Supports v-model.' },
                defaultValue: { zh: '非受控模式下初始展开项的值。', en: 'The initially expanded value in uncontrolled mode.' },
                class: { zh: '合并到折叠面板根元素的自定义 CSS 类。', en: 'Custom CSS classes merged onto the accordion root element.' },
            },
            events: {
                'update:modelValue': { zh: '展开项改变时发出新的值，供 v-model 同步单选或多选状态。', en: 'Emits the new expanded value to synchronize single or multiple state through v-model.' },
            },
            slots: {
                default: { zh: '折叠面板子项，通常放置 AccordionItem；此包装组件不转发底层原语的插槽参数。', en: 'The accordion items, typically AccordionItem components. This wrapper does not forward the underlying primitive slot arguments.' },
            },
        },
        AccordionContent: {
            props: {
                forceMount: { zh: '强制挂载内容，以便使用外部动画库控制其显示过渡。', en: 'Forces content mounting so an external animation library can control its visibility transitions.' },
                asChild: { zh: '将内容原语的属性和行为合并到内部内容容器上。', en: 'Merges the content primitive props and behavior into the inner content container.' },
                as: { zh: '指定可折叠内容原语渲染的元素或组件。', en: 'The element or component rendered by the collapsible content primitive.' },
                class: { zh: '合并到负责折叠动画的外层内容元素；内部容器从 AccordionItem 继承视觉变体。', en: 'Classes merged onto the outer element that handles collapse animation. The inner container inherits its visual variant from AccordionItem.' },
            },
            slots: {
                default: { zh: '面板展开后显示的正文内容。', en: 'The body content displayed when the panel is expanded.' },
            },
        },
        AccordionItem: {
            props: {
                variant: { zh: '子项的视觉变体，同时传递给其触发器和内容区域。', en: 'The item visual variant, also provided to its trigger and content area.' },
                class: { zh: '合并到折叠面板子项根元素的自定义 CSS 类。', en: 'Custom CSS classes merged onto the accordion item root.' },
                disabled: { zh: '禁用此子项；根 Accordion 禁用时此子项同样不可交互。', en: 'Disables this item. It is also disabled whenever the root Accordion is disabled.' },
                value: { zh: '子项的唯一字符串标识，必须在同一 Accordion 内保持唯一。', en: 'The item string identifier, which must be unique within its Accordion.' },
                unmountOnHide: { zh: '控制此子项关闭时是否卸载内容。', en: 'Controls whether this item content is unmounted when closed.', fallback: { 'zh-CN': '未提供时继承根 Accordion 的 unmountOnHide。', en: 'Inherits unmountOnHide from the root Accordion when omitted.' } },
                asChild: { zh: '将子项原语的属性和行为合并到其子元素上。', en: 'Merges the item primitive props and behavior into its child element.' },
                as: { zh: '指定子项根原语渲染的元素或组件。', en: 'The element or component rendered by the item root primitive.' },
            },
            slots: {
                default: { zh: '子项的触发器及内容，通常组合 AccordionTrigger 和 AccordionContent；不提供作用域参数。', en: 'The item trigger and content, typically AccordionTrigger and AccordionContent. No scope arguments are provided.' },
            },
        },
        AccordionTrigger: {
            props: {
                asChild: { zh: '将触发器原语的属性和行为合并到子元素上，使用时需保留触发器可聚焦语义。', en: 'Merges the trigger primitive props and behavior into its child; preserve focusable trigger semantics when composing it.' },
                as: { zh: '指定触发器原语渲染的元素或组件。', en: 'The element or component rendered by the trigger primitive.' },
                class: { zh: '合并到触发器元素的自定义 CSS 类，不作用于外层标题元素。', en: 'Custom CSS classes merged onto the trigger element, rather than its surrounding heading.' },
                iconSize: { zh: '内置 ChevronDown 图标的尺寸；自定义 icon 插槽自行设置图标大小。', en: 'The size of the built-in ChevronDown icon. A custom icon slot controls its own icon size.' },
            },
            slots: {
                default: { zh: '触发器中的标题文字或内容。', en: 'The heading text or content inside the trigger.' },
                icon: { zh: '替换展开图标，默认使用 ChevronDown。图标容器继承变体样式并在展开时旋转；显式空插槽会隐藏整个图标容器。', en: 'Replaces the expansion icon, which defaults to ChevronDown. Its container inherits variant styles and rotates when expanded. An explicitly empty slot hides the icon container.' },
            },
        },
    },
} satisfies ApiContent

export default content
