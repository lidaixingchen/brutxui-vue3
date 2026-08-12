import { cva } from 'class-variance-authority'

/**
 * `--sep-thickness` 的默认 fallback 值（经 index.ts `export *` 供外部读取的信息常量）。
 * 注意：类名字符串硬编码 `3px` 字面量而非插值本常量——Tailwind @source 扫描无法从 `${...}`
 * 插值推断类名，类名内禁止插值（见 check:class-literals 门禁）。调整默认厚度需同步
 * 本常量与三处 `3px` 字面量。
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
