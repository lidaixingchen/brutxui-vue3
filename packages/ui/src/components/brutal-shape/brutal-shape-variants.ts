import { cva } from 'class-variance-authority'

/** 图腾根元素基座：块级收缩为内容尺寸，禁止指针事件穿透干扰宿主交互 */
export const brutalShapeVariants = cva(['shrink-0', 'pointer-events-none'], {
    variants: {},
    defaultVariants: {},
})
