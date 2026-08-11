<script setup lang="ts">
import { AccordionRoot, type AccordionRootProps, type AccordionRootEmits, useForwardPropsEmits } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<AccordionRootProps & { class?: string }>()
// 事件转发为单路径：defineEmits 生成的 emits 选项使 @update:model-value 等监听器
// 被 Vue 识别为声明事件、从 attrs 剥离，只经 useForwardPropsEmits → emit 触发一次。
// 因此不设置 inheritAttrs: false（会丢失 id/data-* 等非声明 attrs 的透传），
// 未来 AccordionRootEmits 新增事件时类型继承自动跟进，保持单路径。
const emit = defineEmits<AccordionRootEmits>()

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props
    return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emit)

const classes = computed(() => cn(props.class))
</script>

<template>
    <AccordionRoot v-bind="forwarded" :class="classes">
        <slot />
    </AccordionRoot>
</template>
