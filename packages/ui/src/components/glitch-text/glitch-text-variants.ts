import { cva } from 'class-variance-authority'
import { brutalHoverLiftSmNoX, brutalPress } from '@/lib/brutal-interaction-variants'

// 隐式 CSS 契约（实现于 GlitchText.vue 的 scoped 样式，重构时须同步）：
// - speed 变体经任意属性语法生成 [--glitch-duration] 自定义属性，驱动伪元素动画时长（缺省 300ms）
// - direction 变体对应 .glitch-horizontal / .glitch-vertical / .glitch-both 类选择器
export const glitchTextVariants = cva(
    [
        'glitch-text',
        'relative inline-block',
        'font-black tracking-wide',
        'text-brutal-fg',
        // 仅过渡交互相关的 transform（hover/press 位移）与阴影，避免过渡无关属性
        'transition-[transform,box-shadow] duration-150',
        brutalHoverLiftSmNoX,
        brutalPress,
    ],
    {
        variants: {
            speed: {
                slow: '[--glitch-duration:800ms]',
                medium: '[--glitch-duration:300ms]',
                fast: '[--glitch-duration:100ms]',
            },
            direction: {
                horizontal: 'glitch-horizontal',
                vertical: 'glitch-vertical',
                both: 'glitch-both',
            },
        },
        defaultVariants: {
            speed: 'medium',
            direction: 'horizontal',
        },
    }
)
