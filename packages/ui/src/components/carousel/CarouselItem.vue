<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/lib/utils';

interface CarouselItemProps {
    class?: string;
    /**
     * 标记当前项不可见（WAI-ARIA Carousel 模式）：非可见 slide 应设为 true，
     * 供父级在滚动切换时同步传入（如 `:aria-hidden="i !== currentIndex"`）
     */
    ariaHidden?: boolean;
}

const props = withDefaults(defineProps<CarouselItemProps>(), {
    class: undefined,
    ariaHidden: undefined,
});

const itemClass = computed(() =>
    cn('flex-none w-full h-full', props.class)
);
</script>

<template>
    <div
        :class="itemClass"
        role="group"
        aria-roledescription="slide"
        :aria-hidden="ariaHidden || undefined"
    >
        <slot />
    </div>
</template>
