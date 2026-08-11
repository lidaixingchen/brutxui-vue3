<script setup lang="ts">
import { computed } from 'vue'
import { MoreHorizontal } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { breadcrumbEllipsisVariants } from './breadcrumb-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'

interface BreadcrumbEllipsisProps {
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<BreadcrumbEllipsisProps>(), {
    class: undefined,
    iconSize: 'md',
})

const { t } = useLocale()

const classes = computed(() =>
    cn(breadcrumbEllipsisVariants(), props.class)
)

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }))
)
</script>

<template>
    <span
        role="presentation"
        :class="classes"
    >
        <!-- aria-hidden 仅作用于默认图标；自定义 slot 内容（如可聚焦元素）不被隐藏，避免 aria-hidden-focus 冲突 -->
        <slot>
            <span aria-hidden="true">
                <MoreHorizontal :class="iconClasses" />
            </span>
        </slot>
        <span class="sr-only">{{ t('breadcrumb.more') }}</span>
    </span>
</template>
