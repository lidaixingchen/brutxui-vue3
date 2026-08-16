<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, watch } from 'vue'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { hasIntersectionObserver, getIntersectionObserverCtor } from '@/lib/env'

interface InfiniteScrollProps {
    /** 触发距离阈值 (px) */
    distance?: number
    /** 防抖延迟 (ms) */
    delay?: number
    /** 是否禁用 */
    disabled?: boolean
    /** 是否立即检查 */
    immediate?: boolean
    class?: string
}

const props = withDefaults(defineProps<InfiniteScrollProps>(), {
    distance: 100,
    delay: 200,
    disabled: false,
    immediate: true,
    class: undefined,
})

const emit = defineEmits<{
    load: []
}>()

const prefersReducedMotion = useReducedMotion()

const sentinelRef = ref<HTMLElement | null>(null)
const isLoading = ref(false)
// 使用 shallowRef 存储原生对象，避免不必要的深层响应式追踪
const observer = shallowRef<IntersectionObserver | null>(null)
const loadTimer = shallowRef<ReturnType<typeof setTimeout> | null>(null)
type ObserverSetupResult = 'observed' | 'unsupported' | 'missing-target'

// 检查是否应该加载
function shouldLoad(): boolean {
    if (props.disabled) return false
    if (isLoading.value) return false
    return true
}

// 触发加载
function triggerLoad() {
    if (!shouldLoad()) return

    // 防抖处理
    if (loadTimer.value) {
        clearTimeout(loadTimer.value)
    }

    loadTimer.value = setTimeout(() => {
        isLoading.value = true
        emit('load')
    }, props.delay)
}

// 设置 IntersectionObserver
function setupObserver(): ObserverSetupResult {
    if (!sentinelRef.value) return 'missing-target'
    if (!hasIntersectionObserver) return 'unsupported'

    const Ctor = getIntersectionObserverCtor()
    if (!Ctor) return 'unsupported'

    observer.value = new Ctor(
        (entries) => {
            const entry = entries[0]
            if (entry.isIntersecting) {
                triggerLoad()
            }
        },
        {
            root: null,
            rootMargin: `${props.distance}px`,
            threshold: 0,
        }
    )

    observer.value.observe(sentinelRef.value)
    return 'observed'
}

// 清理 Observer
function cleanupObserver() {
    if (observer.value) {
        observer.value.disconnect()
        observer.value = null
    }
}

/**
 * 重置加载状态（供外部调用）。
 *
 * 契约：该函数在复位 isLoading 后会主动复查哨兵位置——若哨兵仍位于视口（含 distance 阈值）
 * 扩展范围内，会立即重新触发一次 load（通过「解除并重新观察」触发 observer 初始回调实现）。
 * 因此父组件在数据耗尽时必须同步绑定 disabled=true，否则哨兵持续停留视口内将形成自动加载循环。
 */
function resetLoading() {
    isLoading.value = false

    // 清理未决的防抖定时器，避免与新触发的加载定时器叠加
    if (loadTimer.value) {
        clearTimeout(loadTimer.value)
        loadTimer.value = null
    }

    if (!sentinelRef.value || props.disabled) return

    if (observer.value) {
        // 解除并重新观察哨兵，触发一次携带当前相交状态的初始回调。
        // IntersectionObserver 仅在交叉状态变化时回调，若加载指示器高度不足以把哨兵
        // 推出（含 distance 阈值扩展的）视口，resetLoading 后哨兵仍 intersecting，
        // 不会产生新回调导致无限滚动停滞；重新 observe 会复用与 setupObserver 完全一致的
        // rootMargin/threshold 语义，避免手动几何复查的 DOM-flush 与视口口径偏差。
        observer.value.unobserve(sentinelRef.value)
        observer.value.observe(sentinelRef.value)
    } else {
        // unsupported（无 IntersectionObserver）环境回退：保守触发一次，避免永久不加载。
        // 限制：该环境无 observer 回调，滚动/复位均无法再次触发加载，
        // 持续加载需依赖父组件主动调用 resetLoading（此处会再保守触发一次）
        triggerLoad()
    }
}

// 监听 distance 变化：IntersectionObserver 的 rootMargin 不支持原位更新，须重建 observer
watch(() => props.distance, () => {
    if (!props.disabled) {
        cleanupObserver()
        setupObserver()
    }
})

// 监听 disabled 变化
watch(() => props.disabled, (disabled) => {
    if (disabled) {
        cleanupObserver()
        if (loadTimer.value) {
            clearTimeout(loadTimer.value)
            loadTimer.value = null
        }
    } else {
        // 重新启用时复位 isLoading：禁用期间残留的 true 会拦截本次 setupObserver 产生的初始回调，
        // 导致组件一直无法加载，直到外部手动 resetLoading
        isLoading.value = false
        const observerResult = setupObserver()
        if (props.immediate || observerResult === 'unsupported') {
            triggerLoad()
        }
    }
})

onMounted(() => {
    if (!props.disabled) {
        const observerResult = setupObserver()

        // 立即检查；无 Observer 时保守触发一次，避免永久不加载。
        if (props.immediate || observerResult === 'unsupported') {
            triggerLoad()
        }
    }
})

onUnmounted(() => {
    cleanupObserver()
    if (loadTimer.value) {
        clearTimeout(loadTimer.value)
    }
})

defineExpose({
    resetLoading,
})
</script>

<template>
    <div :class="cn('w-full', props.class)">
        <!-- 默认插槽 -->
        <slot />

        <!-- 加载状态 -->
        <div
            v-if="isLoading"
            class="flex items-center justify-center py-4"
        >
            <slot name="loading">
                <div
                    :class="cn(
                        'flex items-center gap-2 text-brutal-placeholder',
                        !prefersReducedMotion && 'animate-pulse',
                    )"
                >
                    <div class="w-2 h-2 rounded-full bg-brutal-primary" />
                    <div class="w-2 h-2 rounded-full bg-brutal-primary animation-delay-200" />
                    <div class="w-2 h-2 rounded-full bg-brutal-primary animation-delay-400" />
                </div>
            </slot>
        </div>

        <!-- 哨兵元素 -->
        <div
            ref="sentinelRef"
            class="h-1"
            aria-hidden="true"
        />
    </div>
</template>

<style scoped>
.animation-delay-200 {
    animation-delay: 200ms;
}

.animation-delay-400 {
    animation-delay: 400ms;
}
</style>
