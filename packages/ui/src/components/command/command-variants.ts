import { cva } from 'class-variance-authority'
import { brutalHighlightLiftWithBorder, brutalHighlightPress, brutalPress } from '@/lib/brutal-interaction-variants'

export const commandInputWrapperVariants = cva(
    [
        'flex h-12 items-center gap-3 px-4',
        'border-b-3 border-brutal',
        'bg-brutal-accent',
        // 容器为 div（不可聚焦），内层 input 聚焦须用 focus-within:* 才可见（与 input 容器同模式）
        'focus-within:ring-2 focus-within:ring-brutal-ring focus-within:ring-offset-2 focus-within:ring-offset-brutal-bg focus-within:outline-hidden',
    ]
)

export const commandItemVariants = cva(
    [
        'relative flex cursor-pointer items-center gap-3 px-3 py-2',
        'text-sm font-semibold',
        // listbox 项不可聚焦（高亮由 reka Listbox 键盘导航管理），不携带 outline-none（见 C1 豁免规则）
        'select-none',
        'border-3 border-transparent',
        'data-[highlighted]:bg-brutal-secondary data-[highlighted]:text-brutal-fg',
        'data-[highlighted]:font-black',
        // 交互样式（lift/按压/焦点边框）无需为禁用态追加 data-[disabled] 覆盖：
        // reka Listbox 键盘导航与 changeHighlight 均过滤 data-disabled 项，handleSelect 对 disabled 有守卫，
        // 且 data-[disabled]:pointer-events-none 拦截 hover 高亮，禁用项在正常交互下不会进入 data-[highlighted] 状态。
        // 与 select/dropdown-menu 的既有模式保持一致。
        brutalHighlightLiftWithBorder,
        brutalPress,
        // data-[highlighted] 恒压过 active（字节序 data-* 后于 active，同特异度 0,2,0 后者胜）：
        // brutalHighlightPress 复合变体（特异度 0,3,0）恢复高亮项按压反馈（fallback 与共享变体同源）
        brutalHighlightPress,
        'transition-all',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    ]
)
