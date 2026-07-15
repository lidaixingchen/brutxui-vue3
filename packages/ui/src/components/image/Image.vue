<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { FocusScope } from 'reka-ui'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, RotateCcw, FlipHorizontal } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { Z_INDEX } from '@/lib/z-index'
import { hasIntersectionObserver } from '@/lib/env'

interface ImageProps {
    src: string
    alt?: string
    fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
    previewSrcList?: string[]
    initialIndex?: number
    hideOnClickModal?: boolean
    zoomRate?: number
    preview?: boolean
    fallback?: string
    loading?: 'eager' | 'lazy'
}

const props = withDefaults(defineProps<ImageProps>(), {
    alt: '',
    fit: 'cover',
    previewSrcList: () => [],
    initialIndex: 0,
    hideOnClickModal: false,
    zoomRate: 1.2,
    preview: false,
    loading: 'eager',
    fallback: undefined,
})

const emit = defineEmits<{
    (e: 'load', event: Event): void
    (e: 'error', event: Event): void
    (e: 'show'): void
    (e: 'close'): void
    (e: 'switch', index: number): void
}>()

// 图像加载状态
const isLoaded = ref(false)
const hasError = ref(false)
const isInView = ref(false)
const isFallbackActive = ref(false)

// 懒加载 observer
const containerRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// 大图预览状态
const showViewer = ref(false)
const currentIndex = ref(props.initialIndex)

// 变换状态
const scale = ref(1)
const rotate = ref(0)
const isFlipped = ref(false)
const offset = ref({ x: 0, y: 0 })

// 拖拽状态
let startX = 0
let startY = 0
let initialX = 0
let initialY = 0
let isDragging = false

const srcToShow = computed(() => {
    if (isFallbackActive.value && props.fallback) {
        return props.fallback
    }
    if (props.loading === 'lazy') {
        return isInView.value || !hasIntersectionObserver ? props.src : ''
    }
    return props.src
})

const isLoading = computed(() => {
    if (props.loading === 'lazy' && hasIntersectionObserver && !isInView.value) return true
    return !isLoaded.value && !hasError.value
})

const imageStyle = computed(() => {
    return {
        objectFit: props.fit,
    }
})

const previewImageStyle = computed(() => {
    const scaleX = scale.value * (isFlipped.value ? -1 : 1)
    const scaleY = scale.value
    return {
        transform: `translate(${offset.value.x}px, ${offset.value.y}px) scale(${scaleX}, ${scaleY}) rotate(${rotate.value}deg)`,
    }
})

const currentPreviewSrc = computed(() => {
    if (props.previewSrcList && props.previewSrcList.length > 0) {
        const len = props.previewSrcList.length
        const index = Math.min(Math.max(currentIndex.value, 0), len - 1)
        return props.previewSrcList[index] ?? props.src
    }
    return props.src
})

// 重置变换状态
const resetTransform = () => {
    scale.value = 1
    rotate.value = 0
    isFlipped.value = false
    offset.value = { x: 0, y: 0 }
}

// 观察 src 的变化，重置状态
watch(
    () => props.src,
    () => {
        isLoaded.value = false
        hasError.value = false
        isFallbackActive.value = false
    }
)

watch(
    () => props.initialIndex,
    (val) => {
        const len = props.previewSrcList?.length ?? 0
        const maxIndex = len > 0 ? len - 1 : 0
        currentIndex.value = Math.min(Math.max(val, 0), maxIndex)
    }
)

watch(
    () => props.previewSrcList,
    (list) => {
        if (list && list.length > 0) {
            if (currentIndex.value >= list.length) {
                currentIndex.value = list.length - 1
            } else if (currentIndex.value < 0) {
                currentIndex.value = 0
            }
        }
    },
    { deep: true, immediate: true }
)

const handleLoad = (e: Event) => {
    isLoaded.value = true
    hasError.value = false
    emit('load', e)
}

const handleError = (e: Event) => {
    if (props.fallback && !isFallbackActive.value) {
        isFallbackActive.value = true
        hasError.value = false
    } else {
        hasError.value = true
        isLoaded.value = false
        emit('error', e)
    }
}

const handlePreview = () => {
    if (!props.preview) return
    if (props.previewSrcList && props.previewSrcList.length > 0) {
        const index = props.previewSrcList.indexOf(props.src)
        if (index !== -1) {
            currentIndex.value = index
        } else {
            currentIndex.value = props.initialIndex
        }
    } else {
        currentIndex.value = 0
    }
    resetTransform()
    showViewer.value = true
    emit('show')
}

const closeViewer = () => {
    showViewer.value = false
    resetTransform()
    emit('close')
}

const handleMaskClick = () => {
    if (props.hideOnClickModal) {
        closeViewer()
    }
}

// 切换图片
const prevImage = () => {
    const list = props.previewSrcList.length > 0 ? props.previewSrcList : [props.src]
    if (list.length <= 1) return
    const len = list.length
    currentIndex.value = (currentIndex.value - 1 + len) % len
    resetTransform()
    emit('switch', currentIndex.value)
}

const nextImage = () => {
    const list = props.previewSrcList.length > 0 ? props.previewSrcList : [props.src]
    if (list.length <= 1) return
    const len = list.length
    currentIndex.value = (currentIndex.value + 1) % len
    resetTransform()
    emit('switch', currentIndex.value)
}

// 变换操作
const zoomIn = () => {
    scale.value = Math.min(10, scale.value * props.zoomRate)
}

const zoomOut = () => {
    scale.value = Math.max(0.2, scale.value / props.zoomRate)
}

const rotateLeft = () => {
    rotate.value -= 90
}

const rotateRight = () => {
    rotate.value += 90
}

const flipHorizontal = () => {
    isFlipped.value = !isFlipped.value
}

// 拖拽逻辑
const handleDragStart = (e: MouseEvent) => {
    e.preventDefault()
    isDragging = true
    startX = e.clientX
    startY = e.clientY
    initialX = offset.value.x
    initialY = offset.value.y
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
}

const handleDragMove = (e: MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    offset.value = {
        x: initialX + dx,
        y: initialY + dy,
    }
}

const handleDragEnd = () => {
    isDragging = false
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)
}

// 键盘事件
const handleKeyDown = (e: KeyboardEvent) => {
    if (!showViewer.value) return
    if (e.key === 'Escape') {
        closeViewer()
    } else if (e.key === 'ArrowLeft') {
        prevImage()
    } else if (e.key === 'ArrowRight') {
        nextImage()
    }
}

// 绑定/解绑键盘事件
watch(showViewer, (val) => {
    if (val) {
        window.addEventListener('keydown', handleKeyDown)
    } else {
        window.removeEventListener('keydown', handleKeyDown)
    }
})

// 懒加载初始化
const initObserver = () => {
    if (props.loading !== 'lazy') return
    if (!hasIntersectionObserver) {
        isInView.value = true
        return
    }
    if (!containerRef.value) return

    observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[0]
            if (entry && entry.isIntersecting) {
                isInView.value = true
                if (observer && containerRef.value) {
                    observer.unobserve(containerRef.value)
                }
            }
        },
        { rootMargin: '0px' }
    )

    observer.observe(containerRef.value)
}

onMounted(() => {
    if (props.loading === 'lazy') {
        initObserver()
    }
})

onUnmounted(() => {
    if (observer) {
        observer.disconnect()
    }
    window.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)
})
</script>

<template>
    <div
        ref="containerRef"
        :class="cn('relative inline-block overflow-hidden w-full h-full border-3 border-brutal bg-brutal-bg rounded-brutal shadow-brutal', $attrs.class as string)"
    >
        <img
            v-if="!hasError && srcToShow"
            :src="srcToShow"
            :alt="alt"
            :class="cn('w-full h-full select-none transition-opacity duration-300', preview ? 'cursor-pointer' : '')"
            :style="imageStyle"
            @load="handleLoad"
            @error="handleError"
            @click="handlePreview"
        >

        <!-- 占位符/加载状态 -->
        <slot v-if="isLoading" name="placeholder">
            <div class="absolute inset-0 flex items-center justify-center w-full h-full font-bold select-none border-3 border-brutal" style="background: repeating-linear-gradient(45deg, var(--brutal-muted, #e5e5e5), var(--brutal-muted, #e5e5e5) 6px, var(--brutal-bg, #fff) 6px, var(--brutal-bg, #fff) 12px)">
                <span class="bg-brutal-bg px-2 py-0.5 border-2 border-brutal shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">加载中...</span>
            </div>
        </slot>

        <!-- 错误状态 -->
        <slot v-if="hasError" name="error">
            <div class="absolute inset-0 flex items-center justify-center w-full h-full font-bold select-none border-3 border-brutal-destructive" style="background: repeating-linear-gradient(45deg, rgba(239,68,68,0.08), rgba(239,68,68,0.08) 6px, var(--brutal-bg, #fff) 6px, var(--brutal-bg, #fff) 12px)">
                <span class="bg-brutal-bg px-2 py-0.5 border-2 border-brutal-destructive text-brutal-destructive shadow-[2px_2px_0px_0px_rgba(239,68,68,0.3)]">加载失败</span>
            </div>
        </slot>
    </div>

    <!-- 大图预览 Viewer -->
    <Teleport to="body">
        <div
            v-if="preview && showViewer"
            class="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm select-none"
            :style="{ zIndex: Z_INDEX.IMAGE_PREVIEW_OVERLAY }"
            @click.self="handleMaskClick"
        >
            <FocusScope trapped loop>
                <!-- 关闭按钮 -->
                <button
                    class="absolute top-6 right-6 flex items-center justify-center w-12 h-12 bg-brutal-accent text-brutal-accent-foreground border-3 border-brutal rounded-brutal shadow-brutal transition-all hover:translate-y-[-2px] hover:shadow-brutal-lg active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none cursor-pointer focus:outline focus:outline-[3px] focus:outline-brutal-ring focus:outline-offset-2"
                    :style="{ zIndex: Z_INDEX.IMAGE_PREVIEW_CONTROL }"
                    aria-label="关闭预览"
                    data-testid="image-viewer-close"
                    @click="closeViewer"
                >
                    <X class="w-6 h-6 stroke-[3]" />
                </button>

                <!-- 切换上一张 -->
                <button
                    v-if="previewSrcList && previewSrcList.length > 1"
                    class="absolute left-6 flex items-center justify-center w-12 h-12 bg-brutal-bg text-brutal-fg border-3 border-brutal rounded-brutal shadow-brutal transition-all hover:translate-y-[-2px] hover:shadow-brutal-lg active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none cursor-pointer focus:outline focus:outline-[3px] focus:outline-brutal-ring focus:outline-offset-2"
                    :style="{ zIndex: Z_INDEX.IMAGE_PREVIEW_CONTROL }"
                    aria-label="上一张"
                    data-testid="image-viewer-prev"
                    @click="prevImage"
                >
                    <ChevronLeft class="w-6 h-6 stroke-[3]" />
                </button>

                <!-- 切换下一张 -->
                <button
                    v-if="previewSrcList && previewSrcList.length > 1"
                    class="absolute right-6 flex items-center justify-center w-12 h-12 bg-brutal-bg text-brutal-fg border-3 border-brutal rounded-brutal shadow-brutal transition-all hover:translate-y-[-2px] hover:shadow-brutal-lg active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none cursor-pointer focus:outline focus:outline-[3px] focus:outline-brutal-ring focus:outline-offset-2"
                    :style="{ zIndex: Z_INDEX.IMAGE_PREVIEW_CONTROL }"
                    aria-label="下一张"
                    data-testid="image-viewer-next"
                    @click="nextImage"
                >
                    <ChevronRight class="w-6 h-6 stroke-[3]" />
                </button>

                <!-- 图片展示区域 -->
                <div
                    class="relative flex items-center justify-center max-w-[80vw] max-h-[80vh] border-4 border-brutal bg-brutal-bg rounded-brutal shadow-brutal-xl overflow-hidden p-2"
                    data-testid="image-viewer-canvas"
                >
                    <img
                        :src="currentPreviewSrc"
                        alt="预览图片"
                        class="max-w-full max-h-[70vh] select-none transition-transform duration-100 ease-out cursor-grab active:cursor-grabbing"
                        :style="previewImageStyle"
                        @mousedown="handleDragStart"
                    >
                </div>

                <!-- 工具栏 -->
                <div
                    class="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-brutal-bg border-3 border-brutal rounded-brutal shadow-brutal"
                    :style="{ zIndex: Z_INDEX.IMAGE_PREVIEW_CONTROL }"
                >
                    <!-- 缩小 -->
                    <button
                        class="flex items-center justify-center w-10 h-10 bg-brutal-muted hover:bg-brutal-muted/80 text-brutal-fg border-2 border-brutal rounded-brutal shadow-brutal-sm hover:translate-y-[-1px] hover:shadow-brutal active:translate-y-[var(--brutal-pressed-offset,1px)] active:shadow-none cursor-pointer focus:outline focus:outline-[2px] focus:outline-brutal-ring focus:outline-offset-2"
                        title="缩小"
                        data-testid="image-viewer-zoom-out"
                        @click="zoomOut"
                    >
                        <ZoomOut class="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <!-- 放大 -->
                    <button
                        class="flex items-center justify-center w-10 h-10 bg-brutal-muted hover:bg-brutal-muted/80 text-brutal-fg border-2 border-brutal rounded-brutal shadow-brutal-sm hover:translate-y-[-1px] hover:shadow-brutal active:translate-y-[var(--brutal-pressed-offset,1px)] active:shadow-none cursor-pointer focus:outline focus:outline-[2px] focus:outline-brutal-ring focus:outline-offset-2"
                        title="放大"
                        data-testid="image-viewer-zoom-in"
                        @click="zoomIn"
                    >
                        <ZoomIn class="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <!-- 左旋 -->
                    <button
                        class="flex items-center justify-center w-10 h-10 bg-brutal-muted hover:bg-brutal-muted/80 text-brutal-fg border-2 border-brutal rounded-brutal shadow-brutal-sm hover:translate-y-[-1px] hover:shadow-brutal active:translate-y-[var(--brutal-pressed-offset,1px)] active:shadow-none cursor-pointer focus:outline focus:outline-[2px] focus:outline-brutal-ring focus:outline-offset-2"
                        title="向左旋转"
                        data-testid="image-viewer-rotate-left"
                        @click="rotateLeft"
                    >
                        <RotateCcw class="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <!-- 右旋 -->
                    <button
                        class="flex items-center justify-center w-10 h-10 bg-brutal-muted hover:bg-brutal-muted/80 text-brutal-fg border-2 border-brutal rounded-brutal shadow-brutal-sm hover:translate-y-[-1px] hover:shadow-brutal active:translate-y-[var(--brutal-pressed-offset,1px)] active:shadow-none cursor-pointer focus:outline focus:outline-[2px] focus:outline-brutal-ring focus:outline-offset-2"
                        title="向右旋转"
                        data-testid="image-viewer-rotate-right"
                        @click="rotateRight"
                    >
                        <RotateCw class="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <!-- 翻转 -->
                    <button
                        class="flex items-center justify-center w-10 h-10 bg-brutal-muted hover:bg-brutal-muted/80 text-brutal-fg border-2 border-brutal rounded-brutal shadow-brutal-sm hover:translate-y-[-1px] hover:shadow-brutal active:translate-y-[var(--brutal-pressed-offset,1px)] active:shadow-none cursor-pointer focus:outline focus:outline-[2px] focus:outline-brutal-ring focus:outline-offset-2"
                        title="左右翻转"
                        data-testid="image-viewer-flip"
                        @click="flipHorizontal"
                    >
                        <FlipHorizontal class="w-5 h-5 stroke-[2.5]" />
                    </button>
                </div>
            </FocusScope>
        </div>
    </Teleport>
</template>
