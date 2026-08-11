<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, useId } from 'vue'
import { cn } from '@/lib/utils'
import { alertDescriptionIdsKey } from './alert-context'

interface AlertDescriptionProps {
    /** 描述文本的 DOM id；未传入时自动生成，供 Alert 根节点通过 aria-describedby 关联 */
    id?: string
    class?: string
}

const props = defineProps<AlertDescriptionProps>()

const resolvedId = computed(() => props.id ?? `alert-description-${useId()}`)

// 挂载时把描述 id 注册到父级 Alert，卸载时移除；独立使用（未注入）时仅渲染 id、不参与关联
const descriptionIds = inject(alertDescriptionIdsKey, null)

onMounted(() => {
    descriptionIds?.value.push(resolvedId.value)
})

onBeforeUnmount(() => {
    if (descriptionIds) {
        descriptionIds.value = descriptionIds.value.filter((id) => id !== resolvedId.value)
    }
})

const classes = computed(() =>
    cn('text-sm font-medium [&_p]:leading-relaxed', props.class)
)
</script>

<template>
    <div :id="resolvedId" :class="classes">
        <slot />
    </div>
</template>
