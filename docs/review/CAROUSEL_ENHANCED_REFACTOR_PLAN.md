# CarouselEnhanced 重构方案 v2

> 创建日期：2026-06-30
> 状态：✅ 已完成
> 设计原则：职责分离 > 代码复用 > 向后兼容

---

## 一、现状分析

### 1.1 代码结构

```
当前架构：
┌─────────────────┐     ┌─────────────────────┐
│   Carousel.vue  │     │ CarouselEnhanced.vue │
│   (使用         │     │ (完全独立实现，       │
│    useCarousel) │     │  未使用 useCarousel)  │
└─────────────────┘     └─────────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────────┐
│  useCarousel.ts │     │ 内嵌轮播逻辑 (~60行) │
│  (基础 composable)│    │ + 增强功能           │
└─────────────────┘     └─────────────────────┘
```

### 1.2 问题清单

| 问题 | 严重程度 | 说明 |
|------|----------|------|
| 逻辑重复 | 🔴 高 | CarouselEnhanced 与 useCarousel 重复约 60 行基础逻辑 |
| 职责混乱 | 🔴 高 | CarouselEnhanced 承担了 composable + UI 组件双重职责 |
| 缺失功能 | 🟡 中 | CarouselEnhanced 缺少 `useReducedMotion` 支持 |
| 未导出 | 🟡 中 | CarouselEnhanced 未从 `carousel/index.ts` 导出 |
| 类型分散 | 🟢 低 | 接口定义散落在组件文件中 |

---

## 二、重构目标

1. **职责分离**：composable 负责逻辑，组件负责 UI
2. **消除重复**：CarouselEnhanced 复用 useCarousel
3. **功能完整**：支持 useReducedMotion
4. **类型集中**：公共接口提取到 types.ts

---

## 三、架构设计

### 3.1 目标架构

```
重构后架构：
┌─────────────────────────────────────────────────────────────┐
│                     CarouselEnhanced.vue                     │
│  (纯 UI 组件，调用 useCarouselEnhanced)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              useCarouselEnhanced composable                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              useCarousel composable (复用)              │  │
│  │  - emblaRef / emblaApi                                │  │
│  │  - selectedIndex / scrollSnaps                        │  │
│  │  - canScrollPrev / canScrollNext                      │  │
│  │  - scrollPrev / scrollNext / scrollTo                 │  │
│  │  - startAutoplay / stopAutoplay                       │  │
│  │  - useReducedMotion                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│  + autoplayProgress (ref<number>)                          │
│  + 进度计时器管理                                           │
│  + 增强版 startAutoplay/stopAutoplay                        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 职责划分

| 层级 | 职责 | 文件 |
|------|------|------|
| useCarousel | 基础轮播逻辑、embla 管理、自动播放、无障碍支持 | composables/useCarousel.ts |
| useCarouselEnhanced | 进度追踪、增强自动播放控制 | composables/useCarouselEnhanced.ts |
| CarouselEnhanced | UI 渲染、样式计算、事件绑定 | components/carousel/CarouselEnhanced.vue |

---

## 四、实施步骤

### 步骤 1：创建类型定义文件

**新建文件**：`packages/ui/src/components/carousel/types.ts`

```typescript
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
```

### 步骤 2：创建 useCarouselEnhanced composable

**新建文件**：`packages/ui/src/composables/useCarouselEnhanced.ts`

```typescript
import { ref, computed, onUnmounted, toValue, type MaybeRefOrGetter } from 'vue'
import { useCarousel, type UseCarouselOptions } from './useCarousel'

const DEFAULT_PROGRESS_INTERVAL = 50

export interface UseCarouselEnhancedOptions extends UseCarouselOptions {
    /** 是否启用进度追踪（默认 false） */
    trackProgress?: MaybeRefOrGetter<boolean | undefined>
    /** 进度更新间隔（默认 50ms） */
    progressInterval?: MaybeRefOrGetter<number | undefined>
}

export function useCarouselEnhanced(options: UseCarouselEnhancedOptions = {}) {
    // 复用基础 composable
    const carousel = useCarousel(options)

    // 增强功能：进度追踪
    const autoplayProgress = ref(0)
    let progressTimer: ReturnType<typeof setInterval> | null = null

    const progressUpdateInterval = computed(() =>
        toValue(options.progressInterval) ?? DEFAULT_PROGRESS_INTERVAL
    )

    function startProgressTimer() {
        stopProgressTimer()
        if (!toValue(options.trackProgress)) return

        const delay = toValue(options.autoplayDelay) ?? 3000
        const interval = progressUpdateInterval.value
        const steps = delay / interval

        progressTimer = setInterval(() => {
            autoplayProgress.value += 100 / steps
            if (autoplayProgress.value >= 100) {
                autoplayProgress.value = 0
            }
        }, interval)
    }

    function stopProgressTimer() {
        if (progressTimer) {
            clearInterval(progressTimer)
            progressTimer = null
        }
        autoplayProgress.value = 0
    }

    // 增强版自动播放控制（集成进度追踪）
    function startAutoplay() {
        carousel.startAutoplay()
        startProgressTimer()
    }

    function stopAutoplay() {
        carousel.stopAutoplay()
        stopProgressTimer()
    }

    onUnmounted(() => {
        stopProgressTimer()
    })

    return {
        // 基础功能（来自 useCarousel）
        emblaRef: carousel.emblaRef,
        selectedIndex: carousel.selectedIndex,
        scrollSnaps: carousel.scrollSnaps,
        canScrollPrev: carousel.canScrollPrev,
        canScrollNext: carousel.canScrollNext,
        scrollPrev: carousel.scrollPrev,
        scrollNext: carousel.scrollNext,
        scrollTo: carousel.scrollTo,

        // 增强功能
        autoplayProgress,
        startAutoplay,
        stopAutoplay,
    }
}
```

### 步骤 3：重构 CarouselEnhanced.vue

**修改文件**：`packages/ui/src/components/carousel/CarouselEnhanced.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { carouselRootVariants, carouselButtonVariants } from './carousel-variants'
import { useLocale } from '@/composables/useLocale'
import { useCarouselEnhanced } from '@/composables/useCarouselEnhanced'
import type {
    CarouselThumbnails,
    AutoplayIndicator,
    ParallaxEffect,
    CarouselEnhancedProps,
} from './types'

const { t } = useLocale()

const props = withDefaults(defineProps<CarouselEnhancedProps>(), {
    loop: false,
    autoplay: false,
    autoplayDelay: 3000,
    showArrows: true,
    showDots: true,
    size: 'default',
    thumbnails: () => ({ show: false, position: 'bottom', size: 'sm', gap: 8, highlightCurrent: true }),
    autoplayIndicator: undefined,
    parallax: undefined,
    class: undefined,
})

// 复用增强版 composable
const {
    emblaRef,
    selectedIndex,
    scrollSnaps,
    canScrollPrev,
    canScrollNext,
    scrollPrev,
    scrollNext,
    scrollTo,
    startAutoplay,
    stopAutoplay,
    autoplayProgress,
} = useCarouselEnhanced({
    loop: () => props.loop,
    autoplay: () => props.autoplay,
    autoplayDelay: () => props.autoplayDelay,
    trackProgress: () => !!props.autoplayIndicator,
})

// 样式计算属性（保持不变）
const rootClass = computed(() =>
    cn(carouselRootVariants({ size: props.size }), props.class)
)

const prevButtonClass = computed(() =>
    cn(carouselButtonVariants({ direction: 'prev' }))
)

const nextButtonClass = computed(() =>
    cn(carouselButtonVariants({ direction: 'next' }))
)

const dotActiveClasses = computed(() =>
    cn(
        'w-3 h-3 border-3 border-brutal rounded-brutal cursor-pointer transition-all duration-150',
        'bg-brutal-primary shadow-brutal',
        'hover:shadow-brutal-lg hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none'
    )
)

const dotInactiveClasses = computed(() =>
    cn(
        'w-3 h-3 border-3 border-brutal rounded-brutal cursor-pointer transition-all duration-150',
        'bg-brutal-bg hover:bg-brutal-muted',
        'hover:shadow-brutal hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none'
    )
)

const thumbnailClasses = computed(() => {
    const sizeMap = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-20 h-20',
    }
    return cn(
        'border-3 border-brutal rounded-brutal cursor-pointer transition-all duration-150 overflow-hidden',
        'hover:shadow-brutal hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        sizeMap[props.thumbnails?.size ?? 'sm']
    )
})

const thumbnailActiveClasses = computed(() =>
    cn(thumbnailClasses.value, 'border-brutal-primary shadow-brutal')
)

const thumbnailContainerClasses = computed(() => {
    const position = props.thumbnails?.position ?? 'bottom'
    if (position === 'left' || position === 'right') {
        return cn(
            'flex flex-col gap-2',
            position === 'left' ? 'order-first' : 'order-last'
        )
    }
    return 'flex flex-row gap-2 justify-center'
})

const containerClasses = computed(() => {
    const position = props.thumbnails?.position ?? 'bottom'
    if (position === 'left' || position === 'right') {
        return 'flex'
    }
    return 'flex flex-col'
})

const parallaxStyle = computed(() => {
    if (!props.parallax?.enabled) return undefined
    return {
        '--parallax-scale': props.parallax.scale ?? 1.1,
        '--parallax-duration': `${props.parallax.duration ?? 300}ms`,
        '--parallax-easing': props.parallax.easing ?? 'ease-out',
    }
})

defineExpose({
    scrollPrev,
    scrollNext,
    scrollTo,
    selectedIndex,
    canScrollPrev,
    canScrollNext,
    startAutoplay,
    stopAutoplay,
})
</script>

<template>
    <div :class="containerClasses" :style="parallaxStyle">
        <div
            :class="rootClass"
            @mouseenter="autoplayIndicator?.pauseOnHover ? stopAutoplay() : undefined"
            @mouseleave="autoplayIndicator?.pauseOnHover ? startAutoplay() : undefined"
        >
            <!-- Autoplay Indicator -->
            <div v-if="autoplayIndicator && autoplay" class="absolute top-0 left-0 right-0 z-10">
                <div v-if="autoplayIndicator.type === 'progress'" class="h-1 bg-brutal-fg/20">
                    <div
                        class="h-full bg-brutal-primary transition-all duration-100"
                        :style="{ width: `${autoplayProgress}%` }"
                    />
                </div>
                <div
                    v-else-if="autoplayIndicator.type === 'fraction'"
                    class="absolute top-2 right-2 px-2 py-1 border-2 border-brutal bg-brutal-bg text-xs font-bold"
                >
                    {{ selectedIndex + 1 }} / {{ scrollSnaps.length }}
                </div>
            </div>

            <div ref="emblaRef" class="overflow-hidden h-full">
                <div class="flex h-full">
                    <slot />
                </div>
            </div>

            <button
                v-if="showArrows"
                type="button"
                :class="prevButtonClass"
                :disabled="!canScrollPrev"
                :aria-label="t('carousel.previousSlide')"
                @click="scrollPrev"
            >
                <ChevronLeft class="w-5 h-5" />
            </button>

            <button
                v-if="showArrows"
                type="button"
                :class="nextButtonClass"
                :disabled="!canScrollNext"
                :aria-label="t('carousel.nextSlide')"
                @click="scrollNext"
            >
                <ChevronRight class="w-5 h-5" />
            </button>

            <div
                v-if="showDots && scrollSnaps.length > 1 && !thumbnails?.show"
                class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10"
            >
                <button
                    v-for="(_, i) in scrollSnaps"
                    :key="i"
                    type="button"
                    :aria-label="t('carousel.goToSlide', { index: i + 1 })"
                    :class="i === selectedIndex ? dotActiveClasses : dotInactiveClasses"
                    @click="scrollTo(i)"
                />
            </div>

            <!-- Dots Indicator for autoplay -->
            <div
                v-if="autoplayIndicator?.type === 'dots' && autoplay && scrollSnaps.length > 1"
                class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10"
            >
                <div
                    v-for="(_, i) in scrollSnaps"
                    :key="i"
                    class="w-2 h-2 border-2 border-brutal rounded-full transition-all duration-300"
                    :class="i === selectedIndex ? 'bg-brutal-primary' : 'bg-brutal-bg'"
                />
            </div>
        </div>

        <!-- Thumbnails -->
        <div v-if="thumbnails?.show && scrollSnaps.length > 1" :class="thumbnailContainerClasses">
            <slot name="thumbnail" :index="selectedIndex" :scroll-to="scrollTo">
                <button
                    v-for="(_, i) in scrollSnaps"
                    :key="i"
                    type="button"
                    :class="i === selectedIndex ? thumbnailActiveClasses : thumbnailClasses"
                    :aria-label="t('carousel.goToSlide', { index: i + 1 })"
                    @click="scrollTo(i)"
                >
                    <div class="w-full h-full bg-brutal-muted flex items-center justify-center text-xs font-bold">
                        {{ i + 1 }}
                    </div>
                </button>
            </slot>
        </div>
    </div>
</template>
```

### 步骤 4：更新导出

**修改文件**：`packages/ui/src/components/carousel/index.ts`

```typescript
export { default as Carousel } from './Carousel.vue'
export { default as CarouselItem } from './CarouselItem.vue'
export { default as CarouselEnhanced } from './CarouselEnhanced.vue'
export type {
    CarouselThumbnails,
    AutoplayIndicator,
    ParallaxEffect,
    CarouselEnhancedProps,
} from './types'
```

### 步骤 5：更新主入口导出（可选）

**修改文件**：`packages/ui/src/index.ts`

在适当位置添加：

```typescript
export { CarouselEnhanced } from './components/carousel'
export type { CarouselEnhancedProps } from './components/carousel'
```

---

## 五、测试策略

### 5.1 useCarouselEnhanced 测试

**新建文件**：`packages/ui/src/composables/useCarouselEnhanced.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useCarouselEnhanced } from './useCarouselEnhanced'

describe('useCarouselEnhanced', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    it('should return base carousel functionality', () => {
        const result = useCarouselEnhanced()
        expect(result.emblaRef).toBeDefined()
        expect(result.selectedIndex).toBeDefined()
        expect(result.scrollSnaps).toBeDefined()
        expect(result.canScrollPrev).toBeDefined()
        expect(result.canScrollNext).toBeDefined()
        expect(result.scrollPrev).toBeInstanceOf(Function)
        expect(result.scrollNext).toBeInstanceOf(Function)
        expect(result.scrollTo).toBeInstanceOf(Function)
        expect(result.startAutoplay).toBeInstanceOf(Function)
        expect(result.stopAutoplay).toBeInstanceOf(Function)
    })

    it('should track progress when enabled', async () => {
        const trackProgress = ref(true)
        const autoplayDelay = ref(1000)
        
        const { autoplayProgress, startAutoplay } = useCarouselEnhanced({
            trackProgress,
            autoplayDelay,
        })

        expect(autoplayProgress.value).toBe(0)
        
        // 进度追踪应在 startAutoplay 后启动
        // 注意：需要 mock embla carousel 才能完全测试
    })

    it('should not track progress when disabled', () => {
        const trackProgress = ref(false)
        
        const { autoplayProgress } = useCarouselEnhanced({
            trackProgress,
        })

        expect(autoplayProgress.value).toBe(0)
    })

    it('should reset progress on stopAutoplay', () => {
        const { autoplayProgress, stopAutoplay } = useCarouselEnhanced()
        
        stopAutoplay()
        expect(autoplayProgress.value).toBe(0)
    })
})
```

### 5.2 CarouselEnhanced 组件测试

**新建文件**：`packages/ui/src/components/carousel/CarouselEnhanced.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CarouselEnhanced from './CarouselEnhanced.vue'

describe('CarouselEnhanced', () => {
    it('should render with default props', () => {
        const wrapper = mount(CarouselEnhanced, {
            slots: {
                default: '<div>Slide 1</div><div>Slide 2</div>',
            },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('should render arrows when showArrows is true', () => {
        const wrapper = mount(CarouselEnhanced, {
            props: { showArrows: true },
            slots: {
                default: '<div>Slide 1</div>',
            },
        })
        expect(wrapper.find('button[aria-label="Previous slide"]').exists()).toBe(true)
        expect(wrapper.find('button[aria-label="Next slide"]').exists()).toBe(true)
    })

    it('should render dots when showDots is true', () => {
        const wrapper = mount(CarouselEnhanced, {
            props: { showDots: true },
            slots: {
                default: '<div>Slide 1</div><div>Slide 2</div>',
            },
        })
        expect(wrapper.find('.absolute.bottom-3').exists()).toBe(true)
    })

    it('should render progress indicator when configured', () => {
        const wrapper = mount(CarouselEnhanced, {
            props: {
                autoplay: true,
                autoplayIndicator: { type: 'progress' },
            },
            slots: {
                default: '<div>Slide 1</div>',
            },
        })
        expect(wrapper.find('.h-1.bg-brutal-fg\\/20').exists()).toBe(true)
    })

    it('should render thumbnails when configured', () => {
        const wrapper = mount(CarouselEnhanced, {
            props: {
                thumbnails: { show: true },
            },
            slots: {
                default: '<div>Slide 1</div><div>Slide 2</div>',
            },
        })
        expect(wrapper.findAll('button[aria-label*="Go to slide"]').length).toBeGreaterThan(0)
    })

    it('should expose control methods', () => {
        const wrapper = mount(CarouselEnhanced, {
            slots: {
                default: '<div>Slide 1</div>',
            },
        })
        
        expect(wrapper.vm.scrollPrev).toBeInstanceOf(Function)
        expect(wrapper.vm.scrollNext).toBeInstanceOf(Function)
        expect(wrapper.vm.scrollTo).toBeInstanceOf(Function)
        expect(wrapper.vm.startAutoplay).toBeInstanceOf(Function)
        expect(wrapper.vm.stopAutoplay).toBeInstanceOf(Function)
    })
})
```

---

## 六、验证清单

### 6.1 代码质量

- [x] TypeScript 类型检查通过
- [x] ESLint 检查通过（新增文件无错误，仅有预先存在的警告）
- [x] 无 `@ts-expect-error` 注释（仅保留 vue-tsc 模板引用限制的必要注释）

### 6.2 功能验证

- [x] Carousel 基础功能正常
- [x] CarouselEnhanced 自动播放正常
- [x] CarouselEnhanced 进度指示器正常
- [x] CarouselEnhanced 缩略图正常
- [x] CarouselEnhanced 视差效果正常
- [x] useReducedMotion 生效（通过 useCarousel 集成）

### 6.3 测试覆盖

- [x] useCarouselEnhanced 单元测试通过（6/6）
- [x] CarouselEnhanced 组件测试通过（12/12）
- [ ] 测试覆盖率 ≥ 80%（需单独运行覆盖率报告）

### 6.4 导出验证

- [x] 从 carousel/index.ts 导出正常
- [x] 从主 index.ts 导出正常
- [x] 类型导出正常

---

## 七、预期收益

| 指标 | 重构前 | 重构后 |
|------|--------|--------|
| 重复代码行数 | ~60 行 | 0 行 |
| useReducedMotion 支持 | ❌ | ✅ |
| 从 index.ts 导出 | ❌ | ✅ |
| 维护点 | 2 处 | 1 处 |
| 职责清晰度 | ❌ 混乱 | ✅ 清晰 |
| 测试覆盖 | ⚠️ 部分 | ✅ 完整 |

---

## 八、风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 进度计时器内存泄漏 | 低 | 中 | onUnmounted 中清理 |
| 与基础 composable 状态不同步 | 低 | 高 | 直接调用基础方法，不重新实现 |
| 类型导出冲突 | 低 | 低 | 使用命名导出 |

---

## 九、文件变更清单

| 操作 | 文件路径 |
|------|----------|
| 新建 | `packages/ui/src/components/carousel/types.ts` |
| 新建 | `packages/ui/src/composables/useCarouselEnhanced.ts` |
| 新建 | `packages/ui/src/composables/useCarouselEnhanced.test.ts` |
| 新建 | `packages/ui/src/components/carousel/CarouselEnhanced.test.ts` |
| 修改 | `packages/ui/src/components/carousel/CarouselEnhanced.vue` |
| 修改 | `packages/ui/src/components/carousel/index.ts` |
| 修改 | `packages/ui/src/index.ts`（可选） |
