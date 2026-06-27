import type { VNode } from 'vue'

export interface VirtualScrollItem {
    id: string | number
    [key: string]: unknown
}

export interface VirtualScrollProps {
    /** 数据列表 */
    items: VirtualScrollItem[]
    /** 每项高度（像素） */
    itemHeight?: number
    /** 尺寸变体 */
    size?: 'sm' | 'default' | 'lg' | 'xl' | 'full'
    /** 列表项样式变体 */
    variant?: 'default' | 'striped' | 'bordered'
    /** 可视区域外预渲染的项目数量 */
    overscan?: number
    /** 滚动到底部检测阈值（像素） */
    scrollEndThreshold?: number
    /** 自定义类名 */
    class?: string
}

export interface VirtualScrollEmits {
    /** 滚动到底部时触发 */
    (e: 'scroll-end'): void
    /** 滚动时触发 */
    (e: 'scroll', scrollTop: number): void
}

export interface VirtualScrollSlots {
    /** 默认插槽 - 渲染每个项目 */
    default: (props: { item: VirtualScrollItem; index: number }) => VNode[]
    /** 空状态插槽 */
    empty: () => VNode[]
    /** 加载更多插槽 */
    loading: () => VNode[]
}