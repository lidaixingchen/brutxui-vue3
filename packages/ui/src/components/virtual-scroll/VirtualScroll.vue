<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { virtualScrollRootVariants, virtualScrollItemVariants } from './virtual-scroll-variants'
import type { VirtualScrollProps, VirtualScrollEmits } from './types'

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

const virtualizer = useVirtualizer({
    count: props.items.length,
    getScrollElement: () => parentRef.value,
    estimateSize: () => props.itemHeight,
    overscan: props.overscan,
})

const virtualItems = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())

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
    virtualizer.value.measure()
})

onMounted(() => {
    if (parentRef.value) {
        parentRef.value.addEventListener('scroll', handleScroll)
    }
})

onUnmounted(() => {
    if (parentRef.value) {
        parentRef.value.removeEventListener('scroll', handleScroll)
    }
})

const rootClasses = computed(() =>
    cn(virtualScrollRootVariants({ size: props.size }), props.class)
)
</script>

<template>
    <div
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
        <div v-if="$slots.loading" class="flex items-center justify-center p-4">
            <slot name="loading" />
        </div>
    </div>
</template>