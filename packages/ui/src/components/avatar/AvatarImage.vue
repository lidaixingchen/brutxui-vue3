<script setup lang="ts">
import { computed } from 'vue'
import { AvatarImage as AvatarImagePrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'

interface AvatarImageProps {
    src?: string
    alt?: string
    class?: string
}

const props = defineProps<AvatarImageProps>()

const classes = computed(() =>
    cn('aspect-square h-full w-full object-cover', props.class)
)
</script>

<template>
    <!-- 去掉 v-if：src 从有值变空时避免卸载原语，reka-ui 内部自行管理 imageLoadingStatus/fallback 状态。
         注意：reka-ui 类型将 src 标注为必填 string，但其运行时接受 undefined（resolveLoadingStatus 对空值返回 'error'，
         fallback 仍正常显示），故此处显式断言。 -->
    <AvatarImagePrimitive :src="src as string" :alt="alt" :class="classes" />
</template>
