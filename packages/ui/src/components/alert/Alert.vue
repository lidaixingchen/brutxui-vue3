<script setup lang="ts">
import { computed, provide, ref, useSlots } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { X } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { alertVariants } from './alert-variants'
import { alertDescriptionIdsKey } from './alert-context'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import Button from '../button/Button.vue'
import { useLocale } from '@/composables/useLocale'

const slots = useSlots()
type AlertVariantProps = VariantProps<typeof alertVariants>

interface AlertProps {
    variant?: NonNullable<AlertVariantProps['variant']>
    closable?: boolean
    class?: string
}

const props = withDefaults(defineProps<AlertProps>(), {
    variant: 'default',
    closable: false,
    class: undefined,
})

const emit = defineEmits<{ close: [] }>()

const { t } = useLocale()

// role="alert" 隐式 aria-live="assertive"，显式声明冗余，故不在根节点重复设置
const descriptionIds = ref<string[]>([])
provide(alertDescriptionIdsKey, descriptionIds)

// 聚合 AlertDescription 注册的描述 id；多段描述以空格连接，空时不渲染 aria-describedby
const describedBy = computed(() => {
    if (descriptionIds.value.length === 0) return undefined
    return descriptionIds.value.join(' ')
})

const classes = computed(() =>
    cn(
        alertVariants({ variant: props.variant }),
        props.closable && 'pr-12',
        props.class
    )
)

const closeIconClasses = computed(() =>
    cn(iconSizeVariants({ size: 'md' }), 'stroke-[3]')
)
</script>

<template>
    <div role="alert" :class="classes" :aria-describedby="describedBy">
        <slot />
        <div v-if="slots.actions" class="mt-3 flex items-center gap-2">
            <slot name="actions" />
        </div>
        <Button
            v-if="closable"
            type="button"
            variant="ghost"
            size="icon"
            class="absolute right-3 top-3 h-8 w-8"
            :aria-label="t('alert.close')"
            @click.stop="emit('close')"
        >
            <X :class="closeIconClasses" />
        </Button>
    </div>
</template>
