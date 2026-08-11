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

// useId 须在 setup 只调用一次（Vue 约定）：放进 computed getter 会在 id prop 变化重算时
// 生成新 id，导致 onMounted 注册与 onBeforeUnmount 清理的 id 不一致（父级 aria-describedby 残留过期 id）
const generatedId = useId()
const resolvedId = computed(() => props.id ?? `alert-description-${generatedId}`)

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
