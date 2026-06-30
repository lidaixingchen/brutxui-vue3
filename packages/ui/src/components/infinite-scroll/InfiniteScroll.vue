<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/composables/useReducedMotion'

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

const { prefersReducedMotion } = useReducedMotion()

const sentinelRef = ref<HTMLElement | null>(null)
const isLoading = ref(false)
const observer = ref<IntersectionObserver | null>(null)
const loadTimer = ref<ReturnType<typeof setTimeout> | null>(null)

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
function setupObserver() {
    if (!sentinelRef.value) return

    observer.value = new IntersectionObserver(
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
    } else {
        setupObserver()
    }
})

onMounted(() => {
    if (!props.disabled) {
        setupObserver()

        // 立即检查
        if (props.immediate) {
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
