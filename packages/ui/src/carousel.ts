export { default as Carousel } from './components/carousel/Carousel.vue'
export { default as CarouselEnhanced } from './components/carousel/CarouselEnhanced.vue'
export { default as CarouselItem } from './components/carousel/CarouselItem.vue'
export { carouselRootVariants, carouselButtonVariants } from './components/carousel/carousel-variants'
export type { CarouselThumbnails, AutoplayIndicator, ParallaxEffect, CarouselEnhancedProps } from './components/carousel/types'

export { default as GallerySection } from './components/gallery-section/GallerySection.vue'
export type { GalleryItem } from './components/gallery-section/types'

export { useCarousel } from './composables/useCarousel'
export type { UseCarouselOptions, UseCarouselReturn } from './composables/useCarousel'
