import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Breadcrumb: {
            props: { class: { zh: '追加到面包屑导航 `<nav>` 根元素的 CSS 类。', en: 'CSS classes added to the breadcrumb navigation `<nav>` root.' } },
            slots: { default: { zh: '面包屑导航的子组件，通常包含 `BreadcrumbList`。', en: 'Breadcrumb navigation children, usually containing `BreadcrumbList`.' } },
        },
        BreadcrumbEllipsis: {
            props: {
                class: { zh: '追加到省略号展示元素的 CSS 类。', en: 'CSS classes added to the ellipsis presentation element.' },
                iconSize: { zh: '默认省略图标的尺寸，使用项目的 `IconSize` 预设。', en: 'The size of the default ellipsis icon, using the project `IconSize` presets.' },
            },
            slots: { default: { zh: '替换默认 `MoreHorizontal` 图标；自定义内容应提供合适的可访问名称。', en: 'Replaces the default `MoreHorizontal` icon; custom content should provide an appropriate accessible name.' } },
        },
        BreadcrumbItem: {
            props: { class: { zh: '追加到表示单个面包屑条目的 `<li>` 元素的 CSS 类。', en: 'CSS classes added to the `<li>` element for one breadcrumb item.' } },
            slots: { default: { zh: '单个面包屑条目的内容，通常是链接或当前页面。', en: 'One breadcrumb item, usually a link or the current page.' } },
        },
        BreadcrumbLink: {
            props: {
                class: { zh: '追加到链接或被 `asChild` 接管的子元素的 CSS 类。', en: 'CSS classes added to the link or to the child element composed through `asChild`.' },
                asChild: { zh: '使用 Reka UI Primitive 的子元素组合方式，将本组件的属性和行为合并到唯一子元素上。', en: 'Uses the Reka UI Primitive child-composition pattern to merge this component’s props and behavior into its single child.' },
                as: { zh: '选择链接渲染的 HTML 标签或组件；`asChild` 生效时由子元素决定渲染目标。', en: 'Selects the HTML tag or component used for the link; the child determines the rendered target when `asChild` is enabled.' },
            },
            slots: { default: { zh: '链接可见文本或内容。', en: 'The visible link text or content.' } },
        },
        BreadcrumbList: {
            props: {
                class: { zh: '追加到有序列表 `<ol>` 的 CSS 类。', en: 'CSS classes added to the ordered list `<ol>`.' },
                variant: { zh: '`default` 使用常规列表样式；`folder` 将链接呈现为档案文件夹标签插片。', en: '`default` uses the regular list style; `folder` renders links as folder-tab labels.' },
            },
            slots: { default: { zh: '面包屑条目和分隔符；子项应为有序列表允许的列表项组件。', en: 'Breadcrumb items and separators; children should use list-item components valid inside an ordered list.' } },
        },
        BreadcrumbPage: {
            props: { class: { zh: '追加到当前页面 `<span>` 的 CSS 类。', en: 'CSS classes added to the current-page `<span>`.' } },
            slots: { default: { zh: '当前页面名称；组件会以 `aria-current="page"` 标记且不渲染为链接。', en: 'The current page label. The component marks it with `aria-current="page"` and does not render it as a link.' } },
        },
        BreadcrumbSeparator: {
            props: { class: { zh: '追加到分隔符列表项的 CSS 类。', en: 'CSS classes added to the separator list item.' } },
            slots: { default: { zh: '自定义分隔符内容；未提供时显示正斜杠 `/`。该项从无障碍树中隐藏。', en: 'Custom separator content; a forward slash `/` is shown when omitted. The separator is hidden from the accessibility tree.' } },
        },
    },
} satisfies ApiContent

export default content
