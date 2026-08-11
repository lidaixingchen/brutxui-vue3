import { cva } from 'class-variance-authority';

// 阴影统一由各 variant / compoundVariant 显式声明，base 不挂任何 shadow-* 类：
// 避免 base 与 compoundVariants 同时出现两个 box-shadow 工具类，把渲染结果
// 交给 tailwind-merge 的类顺序决定（顺序变化即渲染变化）。
export const chatBubbleVariants = cva(
    [
        'relative max-w-[75%]',
        'border-3 border-brutal rounded-brutal',
        'font-medium leading-relaxed',
    ],
    {
        variants: {
            variant: {
                sent: 'ml-auto',
                received: 'bg-brutal-bg text-brutal-fg mr-auto shadow-brutal',
                // system 强制 text-xs / 无阴影，且忽略 size prop —— 与 ChatBubble.vue 中
                // isSystem && 'text-xs' 尾置类配合，经 tailwind-merge 恒定胜过 size 变体的字号。
                // shadow-none 保留为显式「无阴影」声明，防止未来 base 恢复阴影时波及 system。
                system: 'bg-brutal-muted text-brutal-fg mx-auto text-center italic border-dashed shadow-none text-xs',
            },
            // color 变体仅对 variant='sent' 生效（见 compoundVariants）；received/system 传 color 会被静默忽略，
            // 这是已固化的设计（组件文档与测试均锁定），调用方不应依赖 received/system 的 color 效果。
            color: {
                default: '', // no-op: sent 配色经 compoundVariants 应用
                primary: '',
                accent: '',
            },
            size: {
                sm: 'px-3 py-1.5 text-xs',
                default: 'px-4 py-2.5 text-sm',
                lg: 'px-5 py-3.5 text-base',
            },
        },
        compoundVariants: [
            {
                variant: 'sent',
                color: 'default',
                class: 'bg-brutal-primary text-brutal-primary-foreground shadow-brutal',
            },
            {
                variant: 'sent',
                color: 'primary',
                class: 'bg-brutal-primary text-brutal-primary-foreground shadow-brutal-primary',
            },
            {
                variant: 'sent',
                color: 'accent',
                class: 'bg-brutal-accent text-brutal-accent-foreground shadow-brutal',
            },
        ],
        defaultVariants: {
            variant: 'received',
            color: 'default',
            size: 'default',
        },
    }
);

export const chatAvatarVariants = cva(
    [
        'flex-shrink-0 rounded-brutal border-3 border-brutal',
        'flex items-center justify-center font-bold',
        'bg-brutal-secondary text-brutal-secondary-foreground',
    ],
    {
        variants: {
            size: {
                sm: 'w-6 h-6 text-[10px]',
                default: 'w-8 h-8 text-xs',
                lg: 'w-10 h-10 text-sm',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
);
