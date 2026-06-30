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
    'scroll-end': []
    /** 滚动时触发 */
    scroll: [scrollTop: number]
}