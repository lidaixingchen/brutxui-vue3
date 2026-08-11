import { cva } from 'class-variance-authority'
import { brutalHighlightLiftWithBorder, brutalPress } from '@/lib/brutal-interaction-variants'

export const commandInputWrapperVariants = cva(
    [
        'flex h-12 items-center gap-3 px-4',
        'border-b-3 border-brutal',
        'bg-brutal-accent',
    ]
)

export const commandItemVariants = cva(
    [
        'relative flex cursor-pointer items-center gap-3 px-3 py-2',
        'text-sm font-semibold',
        'select-none outline-none',
        'border-3 border-transparent',
        'data-[highlighted]:bg-brutal-secondary data-[highlighted]:text-brutal-fg',
        'data-[highlighted]:font-black',
        // 交互样式（lift/按压/焦点边框）无需为禁用态追加 data-[disabled] 覆盖：
        // reka Listbox 键盘导航与 changeHighlight 均过滤 data-disabled 项，handleSelect 对 disabled 有守卫，
        // 且 data-[disabled]:pointer-events-none 拦截 hover 高亮，禁用项在正常交互下不会进入 data-[highlighted] 状态。
        // 与 select/dropdown-menu 的既有模式保持一致。
        brutalHighlightLiftWithBorder,
        brutalPress,
        'transition-all',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    ]
)
