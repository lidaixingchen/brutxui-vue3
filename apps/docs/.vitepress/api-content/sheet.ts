import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        SheetContent: {
            props: {
                side: { zh: '面板从视口哪一侧滑入，控制定位、边框与过渡方向；left 时内置关闭按钮位于左上角，其余方向位于右上角。', en: 'The viewport edge from which the panel enters, controlling position, border, and transition direction. The close button is top-left for left and top-right otherwise.' },
                class: { zh: '合并到浮动内容面板的 CSS 类；其余属性和监听器通过 $attrs 传给 Reka UI DialogContent。', en: 'CSS classes merged onto the floating content panel. Other attributes and listeners are forwarded through $attrs to Reka UI DialogContent.' },
            },
            slots: { default: { zh: '面板主体，可组合 SheetHeader、内容区域与 SheetFooter；本地化的内置关闭按钮位于内容之后。', en: 'The panel body, typically composing SheetHeader, content, and SheetFooter. A localized built-in close button follows the content.' } },
        },
        SheetDescription: {
            props: { class: { zh: '合并到 Reka UI 描述原语的 CSS 类，默认使用辅助说明文字样式。', en: 'CSS classes merged onto the Reka UI description primitive, styled as supporting text by default.' } },
            slots: { default: { zh: '面板的辅助说明，用于无障碍描述关联；插槽没有有效内容时不渲染描述元素。', en: 'Supporting panel text used for its accessible description. The description element is omitted when the slot has no meaningful content.' } },
        },
        SheetFooter: {
            props: { class: { zh: '合并到面板底部操作区的 CSS 类。', en: 'CSS classes merged onto the panel footer action area.' } },
            slots: { default: { zh: '底部按钮或其他操作内容。', en: 'Footer buttons or other actions.' } },
        },
        SheetHeader: {
            props: { class: { zh: '合并到面板头部容器的 CSS 类。', en: 'CSS classes merged onto the panel header container.' } },
            slots: { default: { zh: '面板标题、描述与其他头部内容。', en: 'The panel title, description, and other header content.' } },
        },
        SheetTitle: {
            props: { class: { zh: '合并到 Reka UI 标题原语的 CSS 类，默认使用粗体标题样式。', en: 'CSS classes merged onto the Reka UI title primitive, styled as a bold heading by default.' } },
            slots: { default: { zh: '面板标题，用于无障碍名称关联；插槽没有有效内容时不渲染标题元素。', en: 'The panel title used for its accessible name. The title element is omitted when the slot has no meaningful content.' } },
        },
    },
    supplements: {
        SheetContent: [
            {
                name: 'openAutoFocus', kind: 'events', type: '[event: Event]', origin: 'fallthrough',
                source: { file: 'packages/ui/src/components/sheet/SheetContent.vue', line: 61 },
                description: { 'zh-CN': '通过 $attrs 转发的 Reka UI 事件，在内容打开时准备自动聚焦时触发，可调用 preventDefault() 接管聚焦。', en: 'A Reka UI event forwarded through $attrs before automatic focus on opening. Call preventDefault() to handle focus yourself.' },
            },
            {
                name: 'closeAutoFocus', kind: 'events', type: '[event: Event]', origin: 'fallthrough',
                source: { file: 'packages/ui/src/components/sheet/SheetContent.vue', line: 61 },
                description: { 'zh-CN': '通过 $attrs 转发的 Reka UI 事件，在内容关闭时准备恢复焦点时触发，可阻止默认聚焦。', en: 'A Reka UI event forwarded through $attrs before restoring focus on closing. Its default focus behavior can be prevented.' },
            },
            {
                name: 'interactOutside', kind: 'events', type: '[event: PointerDownOutsideEvent | FocusOutsideEvent]', origin: 'fallthrough',
                source: { file: 'packages/ui/src/components/sheet/SheetContent.vue', line: 61 },
                description: { 'zh-CN': '通过 $attrs 转发的 Reka UI 事件，在面板外发生指针按下或焦点交互时触发，可阻止由该交互引起的关闭。', en: 'A Reka UI event forwarded through $attrs for a pointer press or focus interaction outside the panel. It can prevent dismissal caused by that interaction.' },
            },
            {
                name: 'escapeKeyDown', kind: 'events', type: '[event: KeyboardEvent]', origin: 'fallthrough',
                source: { file: 'packages/ui/src/components/sheet/SheetContent.vue', line: 61 },
                description: { 'zh-CN': '通过 $attrs 转发的 Reka UI 事件，在顶层面板收到 Escape 按键时触发，可阻止默认关闭。', en: 'A Reka UI event forwarded through $attrs when the topmost panel receives Escape. It can prevent the default dismissal.' },
            },
            {
                name: 'pointerDownOutside', kind: 'events', type: '[event: PointerDownOutsideEvent]', origin: 'fallthrough',
                source: { file: 'packages/ui/src/components/sheet/SheetContent.vue', line: 61 },
                description: { 'zh-CN': '通过 $attrs 转发的 Reka UI 事件，在面板外按下指针时触发，可阻止默认关闭。', en: 'A Reka UI event forwarded through $attrs when the pointer is pressed outside the panel. It can prevent the default dismissal.' },
            },
            {
                name: 'focusOutside', kind: 'events', type: '[event: FocusOutsideEvent]', origin: 'fallthrough',
                source: { file: 'packages/ui/src/components/sheet/SheetContent.vue', line: 61 },
                description: { 'zh-CN': '通过 $attrs 转发的 Reka UI 事件，在焦点移到面板外时触发，可阻止该外部交互的默认处理。', en: 'A Reka UI event forwarded through $attrs when focus moves outside the panel. It can prevent the default handling of that outside interaction.' },
            },
        ],
    },
} satisfies ApiContent

export default content
