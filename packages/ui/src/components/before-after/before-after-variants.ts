import { cva } from 'class-variance-authority'

// 层级契约（调整相对顺序会让交互静默失效，请勿改动）：
//   sliderLine z-10 < handle z-20 < range input z-30
// 手柄使用 pointer-events-none，交互由底层透明 range input 处理，请勿移除 range input
// 定位契约：
//   orientation=vertical 变体不含 top-*，纵向位置由调用方（BeforeAfter.vue）经内联 style 注入
//   `top: <value>%`（sliderStyle）；独立复用该变体时必须自行提供纵向定位，否则手柄落在容器顶部

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
