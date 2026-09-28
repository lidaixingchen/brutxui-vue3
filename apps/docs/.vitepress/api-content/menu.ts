import type { ApiContent } from '../api-types'

const describe = (items: Record<string, [string, string]>) => Object.fromEntries(
    Object.entries(items).map(([name, [zh, en]]) => [name, { zh, en }]),
)

const content = {
    complete: true,
    members: {
        Menu: {
            props: describe({
                mode: ['设置菜单项的排列方向，可选水平或垂直。', 'Sets the menu item layout direction to horizontal or vertical.'],
                defaultActive: ['设置初始高亮菜单项的 index；该值也用于初始化当前激活项。', 'Sets the index of the initially highlighted menu item and initializes the active item.'],
                router: ['启用后，带 route 的菜单项会通过 vue-router 进行导航。', 'When enabled, menu items with route navigate through vue-router.'],
                class: ['追加到菜单根元素的 CSS 类。', 'CSS classes added to the menu root element.'],
            }),
            events: describe({ select: ['菜单项被选中时发出其 index。', 'Emits the selected menu item’s index.'] }),
            slots: describe({ default: ['菜单内容，通常包含 MenuItem 和 SubMenu。', 'Menu content, typically MenuItem and SubMenu components.'] }),
        },
        MenuItem: {
            props: describe({
                index: ['菜单项唯一标识，用于激活状态和 select 事件；路由模式下也用于匹配当前路由。', 'Unique item identifier used for active state and the select event; router mode also uses it to match the current route.'],
                disabled: ['禁用该菜单项的选择和导航交互。', 'Disables selection and navigation for this menu item.'],
                route: ['路由模式下点击此项要导航到的路径或路由对象。', 'The path or route object to navigate to when this item is clicked in router mode.'],
                inset: ['缩进菜单项内容，使其与含图标的项对齐。', 'Indents the item content to align it with items that include icons.'],
                class: ['追加到菜单项根元素的 CSS 类。', 'CSS classes added to the menu item root element.'],
            }),
            slots: describe({ default: ['菜单项的标签内容，可包含图标。', 'The menu item label, optionally including an icon.'] }),
        },
        SubMenu: {
            props: describe({
                index: ['子菜单唯一标识，用于菜单状态和嵌套层级标识。', 'Unique identifier for this submenu, used by menu state and nested hierarchy tracking.'],
                title: ['子菜单触发器标题；提供 title 插槽时由插槽内容呈现。', 'The submenu trigger title; the title slot provides the rendered content when supplied.'],
                disabled: ['禁用子菜单触发器，阻止展开交互。', 'Disables the submenu trigger and prevents it from opening.'],
                inset: ['缩进子菜单触发器内容，使其与含图标的菜单项对齐。', 'Indents the submenu trigger content to align it with menu items that include icons.'],
                class: ['追加到子菜单根容器的 CSS 类。', 'CSS classes added to the submenu root container.'],
                triggerClass: ['追加到子菜单标题触发器的 CSS 类。', 'CSS classes added to the submenu title trigger.'],
            }),
            slots: describe({
                title: ['自定义子菜单触发器内容；提供时优先于 title 属性。', 'Customizes the submenu trigger content and takes precedence over the title prop.'],
                default: ['子菜单内容，可包含 MenuItem 或继续嵌套 SubMenu。', 'Submenu content, which can contain MenuItem or further nested SubMenu components.'],
            }),
        },
    },
} satisfies ApiContent

export default content
