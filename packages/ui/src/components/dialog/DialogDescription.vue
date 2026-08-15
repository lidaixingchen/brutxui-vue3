<script setup lang="ts">
import { computed } from 'vue'
import { DialogDescription as DialogDescriptionPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'

interface DialogDescriptionProps {
    class?: string
}

const props = defineProps<DialogDescriptionProps>()

const classes = computed(() =>
    cn('text-sm text-brutal-muted-foreground font-medium', props.class)
)

// 显式转发 $attrs：id / aria-describedby 等无障碍关联属性依赖隐式透传，
// 显式化后可获得类型稳定性，结构变化时不会静默失效
defineOptions({ inheritAttrs: false })
</script>

<template>
    <DialogDescriptionPrimitive :class="classes" v-bind="$attrs">
        <slot />
    </DialogDescriptionPrimitive>
</template>
