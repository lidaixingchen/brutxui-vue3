import { cva } from 'class-variance-authority';

export const counterVariants = cva(
    [
        'inline-flex items-baseline tabular-nums whitespace-nowrap',
        'font-black',
        'max-w-full min-w-0',
    ],
    {
        variants: {
            variant: {
                default: 'text-brutal-fg',
                primary: 'text-brutal-primary',
                // accent 作为文字色（黄色高亮）为有意设计：供深色/彩色背景上突出统计值；
                // 浅色主题下对比度偏低属已知限制（库内 accent 常规用法为表面色 bg-brutal-accent text-brutal-accent-foreground）
                accent: 'text-brutal-accent',
                success: 'text-brutal-success',
                danger: 'text-brutal-destructive',
            },
            size: {
                sm: 'text-2xl',
                md: 'text-4xl',
                lg: 'text-6xl',
                xl: 'text-8xl',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
);
