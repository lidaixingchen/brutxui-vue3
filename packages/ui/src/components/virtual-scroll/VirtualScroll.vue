<script setup lang="ts" generic="T">
import { ref, computed, onMounted, onBeforeUnmount, watch, useSlots, shallowRef, triggerRef } from 'vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { virtualScrollRootVariants, virtualScrollItemVariants } from './virtual-scroll-variants'
import type { VirtualScrollProps, VirtualScrollEmits, VirtualizerInstance } from './types'

const slots = useSlots()

const props = withDefaults(defineProps<VirtualScrollProps<T>>(), {
    itemHeight: 48,
    size: 'default',
    variant: 'default',
    overscan: 5,
    scrollEndThreshold: 50,
    class: undefined,
    dynamicHeight: false,
    role: 'list',
    itemRole: 'listitem',
})

const emit = defineEmits<VirtualScrollEmits>()

const { t } = useLocale()

const parentRef = ref<HTMLElement | null>(null)

const isAvailable = ref<boolean | null>(null)

const virtualizerRef = shallowRef<VirtualizerInstance | null>(null)

let cleanup: (() => void) | null = null
let stopWatchScrollElement: (() => void) | null = null
let stopWatchOptions: (() => void) | null = null
let isUnmounted = false

// 使用 .then()/.catch() 模式动态加载
import('@tanstack/vue-virtual')
    .then((mod) => {
        if (isUnmounted) return
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
            () => [props.items.length, props.itemHeight, props.overscan, props.dynamicHeight] as const,
            (newVals, oldVals) => {
                virtualizer.setOptions({
                    ...getOptions(),
                    onChange: () => {
                        triggerRef(virtualizerRef)
                    }
                })
                const oldDynamicHeight = oldVals?.[3]
                const newDynamicHeight = newVals[3]
                if (oldDynamicHeight !== undefined && newDynamicHeight !== oldDynamicHeight) {
                    virtualizer.measure()
                }
                virtualizer._willUpdate()
                triggerRef(virtualizerRef)
                isScrollEndEmitting.value = false
            },
            { immediate: true }
        )

        isAvailable.value = true
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

const isScrollEndEmitting = ref(false)

function handleScroll() {
    if (!parentRef.value) return

    const { scrollTop, scrollHeight, clientHeight } = parentRef.value

    emit('scroll', scrollTop)

    const isNearEnd = scrollHeight - scrollTop - clientHeight < props.scrollEndThreshold
    if (isNearEnd && !isScrollEndEmitting.value) {
        isScrollEndEmitting.value = true
        emit('scroll-end')
    } else if (!isNearEnd) {
        isScrollEndEmitting.value = false
    }
}

onMounted(() => {
    if (parentRef.value) {
        parentRef.value.addEventListener('scroll', handleScroll)
    }
})

onBeforeUnmount(() => {
    isUnmounted = true
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

function measureElement(el: Element | null) {
    if (el && virtualizerRef.value && 'measureElement' in virtualizerRef.value) {
        virtualizerRef.value.measureElement(el)
    }
}

function onItemRef(el: unknown) {
    if (el instanceof Element && props.dynamicHeight) {
        measureElement(el)
    }
}

// 重新测量全部已挂载项：dynamic-height 模式下外部内容高度变化后调用
function measure() {
    virtualizerRef.value?.measure()
}

defineExpose({ scrollToIndex, measureElement, measure, virtualizer: virtualizerRef })
</script>

<template>
    <div
        v-if="isAvailable === false"
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
        v-else-if="isAvailable === null && slots.loading"
        :class="rootClasses"
        :role="props.role"
        :aria-label="t('virtualScroll.label')"
    >
        <div class="flex items-center justify-center p-8">
            <slot name="loading" />
        </div>
    </div>
    <div
        v-else
        ref="parentRef"
        :class="rootClasses"
        :role="props.role"
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
                :key="virtualRow.key"
                :ref="onItemRef"
                :data-index="virtualRow.index"
                :class="cn(
                    virtualScrollItemVariants({ variant: props.variant }),
                    props.variant === 'striped' && virtualRow.index % 2 === 1 && 'bg-brutal-muted/50'
                )"
                :style="{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: props.dynamicHeight ? undefined : `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                }"
                :role="props.itemRole"
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