import type { ApiContent } from '../api-types'

const describe = (items: Record<string, [string, string]>) => Object.fromEntries(
    Object.entries(items).map(([name, [zh, en]]) => [name, { zh, en }]),
)

const content = {
    complete: true,
    members: {
        DropdownMenuContent: {
            props: describe({
                sideOffset: ['设置内容面板与触发器之间的像素间距。', 'Sets the pixel offset between the content panel and its trigger.'],
                align: ['设置内容面板相对触发器的水平对齐方式。', 'Sets the horizontal alignment of the content panel relative to its trigger.'],
                to: ['设置弹出面板传送到的目标选择器或元素；未设置时挂载到 body。', 'Sets the selector or element used as the teleport target for the popup; it defaults to body.'],
                class: ['追加到下拉菜单内容面板的 CSS 类。', 'CSS classes added to the dropdown menu content panel.'],
            }),
            slots: describe({ default: ['菜单项、标签、分隔线或子菜单等菜单内容。', 'Menu content such as items, labels, separators, or submenus.'] }),
        },
        DropdownMenuCheckboxItem: {
            props: describe({
                modelValue: ['复选框项的受控选中状态，支持 indeterminate；使用 update:modelValue 事件同步。', 'The controlled checked state of the checkbox item, including indeterminate; synchronize it with update:modelValue.'],
                defaultChecked: ['未传入 modelValue 时使用的初始选中状态。', 'The initial checked state used when modelValue is not provided.'],
                class: ['追加到复选框菜单项根元素的 CSS 类。', 'CSS classes added to the checkbox menu item root.'],
                iconSize: ['设置选中指示图标的尺寸。', 'Sets the size of the checked-state indicator icon.'],
            }),
            events: describe({ 'update:modelValue': ['复选框状态变化时发出新状态，可能为 true、false 或 indeterminate。', 'Emits the new checkbox state when it changes: true, false, or indeterminate.'] }),
            slots: describe({ default: ['复选框菜单项的文字和其他内容。', 'The checkbox menu item’s label and other content.'] }),
        },
        DropdownMenuItem: {
            props: describe({
                inset: ['为菜单项增加缩进，使其与带图标或子菜单触发项对齐。', 'Adds indentation to align the item with icon-bearing items or submenu triggers.'],
                disabled: ['阻止用户选择此菜单项。', 'Prevents the user from selecting this menu item.'],
                textValue: ['设置用于键盘类型搜索的文本值；适用于项内容无法直接推断文字时。', 'Sets the text used for keyboard typeahead, especially when the item’s text cannot be inferred from its content.'],
                closeOnSelect: ['控制选择该项后是否关闭菜单。', 'Controls whether selecting this item closes the menu.'],
                class: ['追加到菜单项根元素的 CSS 类。', 'CSS classes added to the menu item root.'],
            }),
            slots: describe({ default: ['菜单项的标签及其可选图标或快捷键说明。', 'The menu item label and any optional icon or shortcut hint.'] }),
        },
        DropdownMenuLabel: {
            props: describe({ inset: ['为菜单标签增加缩进，使其与菜单项内容对齐。', 'Adds indentation to align the menu label with menu item content.'], class: ['追加到菜单标签元素的 CSS 类。', 'CSS classes added to the menu label element.'] }),
            slots: describe({ default: ['菜单分组或菜单内容的标题。', 'The heading for a menu group or menu content.'] }),
        },
        DropdownMenuRadioItem: {
            props: describe({ value: ['此单选项在 RadioGroup 中对应的字符串值。', 'The string value represented by this radio item in its RadioGroup.'], class: ['追加到单选菜单项根元素的 CSS 类。', 'CSS classes added to the radio menu item root.'] }),
            slots: describe({ default: ['单选菜单项的标签和可选内容。', 'The radio menu item’s label and optional content.'] }),
        },
        DropdownMenuSeparator: {
            props: describe({ class: ['追加到菜单分隔线元素的 CSS 类。', 'CSS classes added to the menu separator element.'] }),
        },
        DropdownMenuShortcut: {
            props: describe({ class: ['追加到快捷键说明元素的 CSS 类。', 'CSS classes added to the keyboard shortcut hint element.'] }),
            slots: describe({ default: ['显示的快捷键文本或符号。', 'The keyboard shortcut text or symbols to display.'] }),
        },
        DropdownMenuSubContent: {
            props: describe({ sideOffset: ['设置子菜单面板与触发器之间的像素间距。', 'Sets the pixel offset between the submenu panel and its trigger.'], class: ['追加到子菜单内容面板的 CSS 类。', 'CSS classes added to the submenu content panel.'] }),
            slots: describe({ default: ['子菜单中的菜单项及其分组内容。', 'Menu items and grouped content inside the submenu.'] }),
        },
        DropdownMenuSubTrigger: {
            props: describe({
                inset: ['为子菜单触发项增加缩进，使其与同级菜单项对齐。', 'Adds indentation to align the submenu trigger with sibling menu items.'],
                disabled: ['阻止打开此子菜单。', 'Prevents this submenu from opening.'],
                class: ['追加到子菜单触发项根元素的 CSS 类。', 'CSS classes added to the submenu trigger root.'],
                iconSize: ['设置表示子菜单展开方向的图标尺寸。', 'Sets the size of the icon indicating the submenu direction.'],
            }),
            slots: describe({ default: ['子菜单触发项显示的标签内容。', 'The label content displayed by the submenu trigger.'] }),
        },
    },
} satisfies ApiContent

export default content
