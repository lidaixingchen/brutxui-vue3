<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, useSlots } from 'vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { virtualScrollRootVariants, virtualScrollItemVariants } from './virtual-scroll-variants'
import type { VirtualScrollProps, VirtualScrollEmits } from './types'
import type { useVirtualizer } from '@tanstack/vue-virtual'

const slots = useSlots()
type UseVirtualizerFn = typeof useVirtualizer

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

let useVirtualizerFn: UseVirtualizerFn | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 动态导入的虚拟化器类型需要运行时确定
let virtualizerRef: any = null

const virtualizerOptions = computed(() => ({
    count: props.items.length,
    getScrollElement: () => parentRef.value,
    estimateSize: () => props.itemHeight,
    overscan: props.overscan,
}))

function initVirtualizer(): void {
    if (useVirtualizerFn && !virtualizerRef) {
        virtualizerRef = useVirtualizerFn(virtualizerOptions.value)
    }
}

// 使用 .then()/.catch() 模式而非顶层 await
import('@tanstack/vue-virtual')
    .then((mod) => {
        useVirtualizerFn = mod.useVirtualizer as UseVirtualizerFn
        initVirtualizer()
    })
    .catch(() => {
        console.warn('[BrutxUI] VirtualScroll component requires @tanstack/vue-virtual. Install it: pnpm add @tanstack/vue-virtual')
        isAvailable.value = false
    })

const virtualItems = computed(() => virtualizerRef?.value.getVirtualItems() ?? [])
const totalSize = computed(() => virtualizerRef?.value.getTotalSize() ?? 0)

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
    virtualizerRef?.value.measure()
})

onMounted(() => {
    if (parentRef.value) {
        parentRef.value.addEventListener('scroll', handleScroll)
    }
    initVirtualizer()
})

onBeforeUnmount(() => {
    if (parentRef.value) {
        parentRef.value.removeEventListener('scroll', handleScroll)
    }
})

const rootClasses = computed(() =>
    cn(virtualScrollRootVariants({ size: props.size }), props.class)
)

function scrollToIndex(index: number) {
    const itemCount = props.items.length

    if (itemCount === 0 || !virtualizerRef) return

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