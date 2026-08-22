import { cva } from 'class-variance-authority'

export const spinnerVariants = cva(
    ['inline-block rounded-full', 'border-3', 'animate-spin'],
    {
        variants: {
            size: {
                sm: 'h-5 w-5',
                default: 'h-8 w-8',
                lg: 'h-12 w-12',
                xl: 'h-16 w-16',
            },
            variant: {
                default: 'border-b-brutal border-l-brutal border-t-transparent border-r-transparent',
                primary: 'border-b-brutal-primary border-l-brutal-primary border-t-transparent border-r-transparent',
                secondary: 'border-b-brutal-secondary border-l-brutal-secondary border-t-transparent border-r-transparent',
                accent: 'border-b-brutal-accent border-l-brutal-accent border-t-brutal-fg border-r-brutal-fg',
            },
        },
        defaultVariants: {
            size: 'default',
            variant: 'default',
        },
    }
)

export const blockSpinnerVariants = cva('grid grid-cols-2 gap-1', {
    variants: {
        size: {
            sm: 'h-5 w-5 gap-0.5',
            default: 'h-8 w-8 gap-1',
            lg: 'h-12 w-12 gap-1.5',
            xl: 'h-16 w-16 gap-2',
        },
    },
    defaultVariants: {
        size: 'default',
    },
})

export const barsSpinnerVariants = cva('flex items-end gap-0.5', {
    variants: {
        size: {
            sm: 'h-4',
            default: 'h-6',
            lg: 'h-8',
            xl: 'h-12',
        },
    },
    defaultVariants: {
        size: 'default',
    },
})

export const dotsSpinnerVariants = cva('flex items-center', {
    variants: {
        size: {
            sm: 'gap-1',
            default: 'gap-2',
            lg: 'gap-3',
            xl: 'gap-4',
        },
    },
    defaultVariants: {
        size: 'default',
    },
})

export const SPINNER_COLOR_CLASSES = {
    default: 'bg-brutal-fg',
    primary: 'bg-brutal-primary',
    secondary: 'bg-brutal-secondary',
    accent: 'bg-brutal-accent',
    info: 'bg-brutal-info',
} as const

/** ASCII 旋转字符变体容器：等宽终端风格（渲染分支由组件按 variant === 'ascii' 处理） */
export const spinnerAsciiVariants = cva(['inline-flex items-center justify-center'], {
    variants: {
        size: {
            sm: 'h-5 w-5 text-sm',
            default: 'h-8 w-8 text-lg',
            lg: 'h-12 w-12 text-2xl',
            xl: 'h-16 w-16 text-3xl',
        },
    },
    defaultVariants: {
        size: 'default',
    },
})

/** ASCII 旋转帧序列：经典终端 spinner 字符轮 */
export const SPINNER_ASCII_FRAMES = ['|', '/', '-', '\\'] as const

export type SpinnerColor = keyof typeof SPINNER_COLOR_CLASSES | 'mixed'

const MIXED_COLOR_ORDER: (keyof typeof SPINNER_COLOR_CLASSES)[] = ['primary', 'secondary', 'accent', 'info']

export function getSpinnerColorClasses(color: string, count: number): string[] {
    if (!Number.isInteger(count) || count <= 0) {
        return []
    }
    if (color === 'mixed') {
        return Array.from({ length: count }, (_, i) => {
            const colorKey = MIXED_COLOR_ORDER[i % MIXED_COLOR_ORDER.length] ?? 'default'
            return SPINNER_COLOR_CLASSES[colorKey]
        })
    }
    const resolved = Object.hasOwn(SPINNER_COLOR_CLASSES, color)
        ? SPINNER_COLOR_CLASSES[color as keyof typeof SPINNER_COLOR_CLASSES]
        : SPINNER_COLOR_CLASSES.default
    return Array(count).fill(resolved)
}

