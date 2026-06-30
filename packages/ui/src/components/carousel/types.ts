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

export interface CarouselEnhancedProps {
    loop?: boolean
    autoplay?: boolean
    autoplayDelay?: number
    showArrows?: boolean
    showDots?: boolean
    size?: 'sm' | 'md' | 'lg' | 'full' | 'default'
    thumbnails?: CarouselThumbnails
    autoplayIndicator?: AutoplayIndicator
    parallax?: ParallaxEffect
    class?: string
}
