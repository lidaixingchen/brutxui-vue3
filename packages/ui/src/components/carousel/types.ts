export interface CarouselThumbnails {
    show?: boolean
    position?: 'bottom' | 'left' | 'right'
    size?: 'sm' | 'md' | 'lg'
    gap?: number
    highlightCurrent?: boolean
}

export interface AutoplayIndicator {
    type: 'progress' | 'dots' | 'fraction'
    position?: 'top' | 'bottom'
    pauseOnHover?: boolean
}

export interface ParallaxEffect {
    enabled?: boolean
    scale?: number
    opacity?: boolean
    duration?: number
    easing?: string
}

export interface CarouselProps {
    loop?: boolean
    autoplay?: boolean
    autoplayDelay?: number
    showArrows?: boolean
    showDots?: boolean
    size?: 'sm' | 'md' | 'lg' | 'full' | 'default'
    thumbnails?: CarouselThumbnails
    autoplayIndicator?: AutoplayIndicator
    parallax?: ParallaxEffect
    /** 附加到根节点的 class（声明为 prop 后不再作为 fallthrough 属性，需组件内部手动合并） */
    class?: string
}
