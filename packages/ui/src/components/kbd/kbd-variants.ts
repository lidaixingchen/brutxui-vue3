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
        // 3D 机械键帽：底边加厚形成侧面厚度，按压时下沉消除侧面完成「按下」物理隐喻；
        // reduced-motion 下保留边框消失的静态按压态、取消位移与过渡
        'shadow-brutal-sm',
        'border-b-4',
        'transition-all duration-75',
        'active:border-b-0 active:translate-y-1',
        'motion-reduce:transition-none motion-reduce:active:translate-y-0',
        'select-none whitespace-nowrap',
    ],
    {
        variants: {
            variant: {
                default: chipColorVariants.default,
                primary: chipColorVariants.primary,
                secondary: chipColorVariants.secondary,
                accent: chipColorVariants.accent,
                /* 工控背光键帽：恒黑底 + accent 发光字符。
                   --brutal-black 在亮暗预设均为纯黑，黄字对比度跨主题稳定（≈14:1） */
                backlit: 'bg-brutal-black text-brutal-accent border-brutal-black',
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
