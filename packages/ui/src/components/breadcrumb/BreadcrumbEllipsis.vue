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
    iconSize: 'default',
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
        <span aria-hidden="true">
            <slot>
                <MoreHorizontal :class="iconClasses" />
            </slot>
        </span>
        <span class="sr-only">{{ t('breadcrumb.more') }}</span>
    </span>
</template>
