import { cva } from 'class-variance-authority';
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'

export const kanbanColumnVariants = cva(
    [
        'flex flex-col gap-3 min-w-[260px] w-[280px]',
        'border-3 border-brutal shadow-brutal rounded-brutal',
        'bg-brutal-muted p-3',
        'transition-shadow duration-200',
    ],
    {
        variants: {
            dragOver: {
                true: 'shadow-brutal-lg border-brutal-primary',
                false: '',
            },
        },
        defaultVariants: {
            dragOver: false,
        },
    }
);

export const kanbanColumnHeaderVariants = cva(
    [
        'flex items-center justify-between mb-1',
        'select-none',
        'transition-opacity duration-150',
        // 预留透明边框占位：dragOver 时仅切换颜色，避免 3px 边框出现造成尺寸跳变与内容位移
        'border-3 border-transparent',
    ],
    {
        variants: {
            dragging: {
                true: 'opacity-40',
                false: '',
            },
            dragOver: {
                true: 'border-brutal-primary rounded-brutal',
                false: '',
            },
        },
        defaultVariants: {
            dragging: false,
            dragOver: false,
        },
    }
);

export const kanbanCardVariants = cva(
    [
        'border-3 border-brutal shadow-brutal rounded-brutal',
        'bg-brutal-bg px-3 py-2',
        'cursor-grab active:cursor-grabbing', /* 组件私有：拖拽抓取状态语义，不抽取 */
        'transition-all duration-150',
        brutalHoverLift,
        brutalPress,
    ],
    {
        variants: {
            dragging: {
                // 抵消基础类 brutalHoverLift/brutalPress 的 hover/active 位移与阴影，
                // 拖拽中鼠标悬停/按下时卡片保持静止，与 opacity-40 拖拽态视觉一致
                true: 'opacity-40 shadow-none hover:shadow-none hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0',
                false: '',
            },
        },
        defaultVariants: {
            dragging: false,
        },
    }
);
