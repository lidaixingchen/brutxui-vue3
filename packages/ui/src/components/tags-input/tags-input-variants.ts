import { cva } from 'class-variance-authority'

export const tagsInputItemVariants = cva(
    [
        'relative flex items-center gap-1.5 pl-4 pr-2.5 py-1',
        'border-3 border-brutal font-black text-sm rounded-brutal shadow-brutal-sm transition-all',
        /* 便签贴纸感：奇偶交替微倾斜（-1deg ~ 1.5deg 区间）；悬浮/按压时撕除预兆（歪斜缩小） */
        '[&:nth-child(odd)]:-rotate-1 [&:nth-child(even)]:rotate-[1.5deg]',
        'hover:rotate-[-4deg] hover:scale-95 active:scale-90',
        /* 左侧实体打孔圆点：底色挖孔叠于色块之上（纸带打孔隐喻），纯装饰由组件层打 aria-hidden */
        'before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2',
        'before:size-1.5 before:rounded-full before:bg-brutal-bg before:border before:border-brutal before:content-[""]',
        'data-[state=active]:ring-2 data-[state=active]:ring-brutal-ring data-[state=active]:ring-offset-1 data-[state=active]:ring-offset-brutal-bg data-[state=active]:outline-hidden',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-bg text-brutal-fg',
                primary: 'bg-brutal-primary text-brutal-primary-foreground',
                secondary: 'bg-brutal-secondary text-brutal-secondary-foreground',
                accent: 'bg-brutal-accent text-brutal-accent-foreground',
                danger: 'bg-brutal-destructive text-brutal-destructive-foreground',
                success: 'bg-brutal-success text-brutal-success-foreground',
            },
        },
        defaultVariants: {
            variant: 'primary',
        },
    }
)
