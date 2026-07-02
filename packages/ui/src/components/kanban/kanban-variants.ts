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
    ],
    {
        variants: {
            dragging: {
                true: 'opacity-40',
                false: '',
            },
            dragOver: {
                true: 'border-3 border-brutal-primary rounded-brutal',
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
                true: 'opacity-40 shadow-none',
                false: '',
            },
        },
        defaultVariants: {
            dragging: false,
        },
    }
);
