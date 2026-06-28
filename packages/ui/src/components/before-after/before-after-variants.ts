import { cva } from 'class-variance-authority'

// 手柄使用 pointer-events-none，交互由底层透明 range input 处理，请勿移除 range input

export const beforeAfterRootVariants = cva(
    'relative overflow-hidden w-full aspect-video border-3 border-brutal bg-brutal-bg rounded-brutal shadow-brutal select-none'
)

export const beforeAfterHandleVariants = cva(
    [
        'absolute h-10 w-10 border-3 border-brutal bg-brutal-primary rounded-brutal shadow-brutal-sm',
        'flex items-center justify-center pointer-events-none z-20 select-none',
    ],
    {
        variants: {
            orientation: {
                horizontal: 'top-1/2 -translate-y-1/2 -translate-x-1/2',
                vertical: 'left-1/2 -translate-x-1/2 -translate-y-1/2',
            },
        },
        defaultVariants: {
            orientation: 'horizontal',
        },
    }
)
