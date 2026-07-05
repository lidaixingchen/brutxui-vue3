declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<object, object, unknown>
    export default component
}

declare module 'prismjs/components/prism-*' {}

// 生产构建中 process.env.NODE_ENV 的类型声明（替代 vitest/globals 提供的 Node 类型）
declare const process: { env: { NODE_ENV?: string } }

declare module 'embla-carousel' {
    export type EmblaOptionsType = Record<string, unknown>
    export type EmblaPluginType = Record<string, unknown>
    export interface EmblaCarouselType {
        canScrollNext: () => boolean
        canScrollPrev: () => boolean
        containerNode: () => HTMLElement
        destroy: () => void
        off: (event: string, handler: (...args: unknown[]) => void) => void
        on: (event: string, handler: (...args: unknown[]) => void) => void
        emit: (event: string, ...args: unknown[]) => void
        previousScrollSnap: () => number
        reInit: (options?: EmblaOptionsType, plugins?: EmblaPluginType[]) => void
        rootNode: () => HTMLElement
        scrollNext: (jump?: boolean) => void
        scrollPrev: (jump?: boolean) => void
        scrollProgress: () => number
        scrollSnapList: () => number[]
        scrollTo: (index: number, jump?: boolean) => void
        selectedScrollSnap: () => number
        slideNodes: () => HTMLElement[]
        slidesInView: () => number[]
        slidesNotInView: () => number[]
        [key: string]: unknown
    }
}
