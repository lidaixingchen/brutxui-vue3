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

// 重置加载状态（供外部调用）
function resetLoading() {
    isLoading.value = false
}

// 监听 disabled 变化
watch(() => props.disabled, (disabled) => {
    if (disabled) {
        cleanupObserver()
        if (loadTimer.value) {
            clearTimeout(loadTimer.value)
            loadTimer.value = null
        }
    } else {
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
