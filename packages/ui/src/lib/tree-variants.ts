import { brutalPress } from '@/lib/brutal-interaction-variants'

export const INDENT_PER_DEPTH = 20
export const BASE_INDENT_TREE_VIEW = 4
export const BASE_INDENT_TREE_SELECT = 8

export const treeNodeBaseClasses = [
    'flex items-center gap-2 px-2 py-1.5 cursor-pointer select-none',
    'border-3 border-transparent rounded-brutal',
    'text-sm text-brutal-fg font-medium',
    'transition-all duration-150',
    brutalPress,
] as const

// 选中态需显式覆盖文字颜色，否则在 theme-mono/dark 下 --brutal-primary 与 --brutal-fg 相同，会出现黑底黑字/白底白字
export const treeSelectedClass = 'bg-brutal-primary text-brutal-primary-foreground border-brutal shadow-brutal'

export const treeChevronBaseClass = 'flex-shrink-0 transition-transform duration-150'

export const treeChevronExpandedClass = 'rotate-90'

export const treeLabelBaseClass = 'truncate'
