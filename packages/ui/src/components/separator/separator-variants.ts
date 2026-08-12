import { cva } from 'class-variance-authority'

/**
 * CSS variable `--sep-thickness` 的默认 fallback 值（公共导出常量，仅供外部读取/文档参考）。
 * 类名字符串必须硬编码字面量 `3px`（与 DEFAULT_THICKNESS 同值）：Tailwind @source 扫描
 * 无法从 `${...}` 插值推断类名，类名内禁止 ${} 插值（见 check:class-literals 门禁）。
 */
export const DEFAULT_THICKNESS = '3px'

const separatorColorVariants = {
    default: 'bg-brutal-fg',
    primary: 'bg-brutal-primary',
    muted: 'bg-brutal-muted',
}

const separatorSizeVariants = {
    sm: '[--sep-thickness:2px]',
    default: '[--sep-thickness:var(--brutal-border-width,3px)]',
    lg: '[--sep-thickness:5px]',
}

export const separatorVariants = cva('shrink-0', {
    variants: {
        variant: separatorColorVariants,
        size: separatorSizeVariants,
        orientation: {
            horizontal: 'h-[var(--sep-thickness,3px)] w-full',
            vertical: 'h-full w-[var(--sep-thickness,3px)]',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
        orientation: 'horizontal',
    },
})

export const separatorLineVariants = cva('flex-1 h-[var(--sep-thickness,3px)]', {
    variants: {
        variant: separatorColorVariants,
        size: separatorSizeVariants,
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
})
