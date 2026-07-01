<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, useSlots, shallowRef, triggerRef } from 'vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { virtualScrollRootVariants, virtualScrollItemVariants } from './virtual-scroll-variants'
import type { VirtualScrollProps, VirtualScrollEmits } from './types'

const slots = useSlots()

const props = withDefaults(defineProps<VirtualScrollProps>(), {
    itemHeight: 48,
    size: 'default',
    variant: 'default',
    overscan: 5,
    scrollEndThreshold: 50,
    class: undefined,
})

const emit = defineEmits<VirtualScrollEmits>()

const { t } = useLocale()

const parentRef = ref<HTMLElement | null>(null)

const isAvailable = ref(true)

interface VirtualizerInstance {
    getVirtualItems: () => Array<{ key: unknown; index: number; size: number; start: number }>
    getTotalSize: () => number
    scrollToIndex: (index: number) => void
    measure: () => void
}

const virtualizerRef = shallowRef<VirtualizerInstance | null>(null)

let cleanup: (() => void) | null = null
let stopWatchScrollElement: (() => void) | null = null
let stopWatchOptions: (() => void) | null = null

// 使用 .then()/.catch() 模式而非顶层 await
import('@tanstack/vue-virtual')
    .then((mod) => {
        const { Virtualizer, observeElementRect, observeElementOffset, elementScroll } = mod

        const getOptions = () => ({
            observeElementRect,
            observeElementOffset,
            scrollToFn: elementScroll,
            count: props.items.length,
            getScrollElement: () => parentRef.value,
            estimateSize: () => props.itemHeight,
            overscan: props.overscan,
        })

        // @ts-ignore
        const virtualizer = new Virtualizer(getOptions())
        virtualizerRef.value = virtualizer as unknown as VirtualizerInstance

        cleanup = virtualizer._didMount()

        stopWatchScrollElement = watch(
            () => parentRef.value,
            (el) => {
                if (el) {
                    virtualizer._willUpdate()
                    triggerRef(virtualizerRef)
                }
            },
            { immediate: true }
        )

        stopWatchOptions = watch(
            () => [props.items.length, props.itemHeight, props.overscan],
            () => {
                virtualizer.setOptions({
                    ...getOptions(),
                    onChange: () => {
                        triggerRef(virtualizerRef)
                    }
                })
                virtualizer._willUpdate()
                triggerRef(virtualizerRef)
            },
            { immediate: true }
        )

        virtualizer._willUpdate()
        triggerRef(virtualizerRef)
    })
    .catch((err) => {
        console.warn('[BrutxUI] VirtualScroll component requires @tanstack/vue-virtual. Install it: pnpm add @tanstack/vue-virtual', err)
        isAvailable.value = false
    })

const virtualItems = computed(() => virtualizerRef.value?.getVirtualItems() ?? [])
const totalSize = computed(() => virtualizerRef.value?.getTotalSize() ?? 0)

const isEmpty = computed(() => props.items.length === 0)

function handleScroll() {
    if (!parentRef.value) return

    const { scrollTop, scrollHeight, clientHeight } = parentRef.value

    emit('scroll', scrollTop)

    // 检测是否滚动到底部
    if (scrollHeight - scrollTop - clientHeight < props.scrollEndThreshold) {
        emit('scroll-end')
    }
}

watch(() => props.items.length, () => {
    virtualizerRef.value?.measure()
})

onMounted(() => {
    if (parentRef.value) {
        parentRef.value.addEventListener('scroll', handleScroll)
    }
})

onBeforeUnmount(() => {
    if (parentRef.value) {
        parentRef.value.removeEventListener('scroll', handleScroll)
    }
    if (cleanup) {
        cleanup()
    }
    if (stopWatchScrollElement) {
        stopWatchScrollElement()
    }
    if (stopWatchOptions) {
        stopWatchOptions()
    }
})

const rootClasses = computed(() =>
    cn(virtualScrollRootVariants({ size: props.size }), props.class)
)

function scrollToIndex(index: number) {
    const itemCount = props.items.length

    if (itemCount === 0 || !virtualizerRef.value) return

    const clampedIndex = Math.max(0, Math.min(index, itemCount - 1))
    virtualizerRef.value.scrollToIndex(clampedIndex)
}

defineExpose({ scrollToIndex })
</script>

<template>
    <div
        v-if="!isAvailable"
        :class="rootClasses"
        role="list"
        :aria-label="t('virtualScroll.label')"
    >
        <div class="flex items-center justify-center p-8 text-brutal-fg/50">
            <p class="font-bold">
                [BrutxUI] VirtualScroll component requires @tanstack/vue-virtual. Install it: pnpm add @tanstack/vue-virtual
            </p>
        </div>
    </div>
    <div
        v-else
        ref="parentRef"
        :class="rootClasses"
        role="list"
        :aria-label="t('virtualScroll.label')"
    >
        <!-- 空状态 -->
        <div v-if="isEmpty" class="flex items-center justify-center p-8 text-brutal-fg/50">
            <slot name="empty">
                <p class="font-bold">
                    {{ t('virtualScroll.empty') }}
                </p>
            </slot>
        </div>

        <!-- 虚拟列表 -->
        <div
            v-else
            class="relative w-full"
            :style="{ height: `${totalSize}px` }"
        >
            <div
                v-for="virtualRow in virtualItems"
                :key="Number(virtualRow.key)"
                :class="cn(virtualScrollItemVariants({ variant: props.variant }))"
                :style="{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                }"
                role="listitem"
                :aria-setsize="items.length"
                :aria-posinset="virtualRow.index + 1"
            >
                <slot
                    :item="items[virtualRow.index]"
                    :index="virtualRow.index"
                />
            </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="slots.loading" class="flex items-center justify-center p-4">
            <slot name="loading" />
        </div>
    </div>
</template>