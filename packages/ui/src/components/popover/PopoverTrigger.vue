<script setup lang="ts">
import { ref, useId, watch } from 'vue'
import type { PopoverTriggerProps as RekaPopoverTriggerProps } from 'reka-ui'
import { injectPopoverRootContext, PopoverTrigger as PopoverTriggerPrimitive } from 'reka-ui'

interface PopoverTriggerProps extends RekaPopoverTriggerProps {
    /** 触发器 ID，同时用于弹出内容的名称引用。 */
    id?: string
}

const props = defineProps<PopoverTriggerProps>()
const context = injectPopoverRootContext()
const generatedId = useId()
const triggerId = ref(props.id?.trim() || generatedId)

// Reka 的 ID 上下文是普通属性；通过 ref 访问器让已打开的弹层同步读取名称引用。
Object.defineProperty(context, 'triggerId', {
    configurable: true,
    enumerable: true,
    get: () => triggerId.value,
    set: (id: string) => { triggerId.value = id },
})

watch(() => props.id, (id) => {
    triggerId.value = id?.trim() || generatedId
}, { immediate: true })
</script>

<template>
    <PopoverTriggerPrimitive v-bind="props">
        <slot />
    </PopoverTriggerPrimitive>
</template>
