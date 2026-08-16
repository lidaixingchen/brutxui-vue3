import { cva } from 'class-variance-authority'
import { chipBaseClasses, chipColorVariants } from '@/lib/chip-variants'

// 有意复用 chip 的强描边基础类（border-3 + rounded-brutal）：粗描边是 Neo-Brutalist
// 设计语言的一部分，kbd 观感与 Button/Badge 保持一致；若未来需要更轻的按键样式，
// 应在此处独立定义 base 类而非改 chipBaseClasses（会影响 Badge 等共享消费方）
export const kbdVariants = cva(
    [
        ...chipBaseClasses,
        'justify-center',
        'font-mono font-black',
        'shadow-brutal-sm',
        'select-none whitespace-nowrap',
    ],
    {
        variants: {
            variant: {
                default: chipColorVariants.default,
                primary: chipColorVariants.primary,
                secondary: chipColorVariants.secondary,
                accent: chipColorVariants.accent,
            },
            size: {
                sm: 'px-1.5 py-0.5 text-xs min-w-[1.25rem]',
                md: 'px-2 py-1 text-sm min-w-[1.75rem]',
                lg: 'px-3 py-1.5 text-base min-w-[2.25rem]',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
)
