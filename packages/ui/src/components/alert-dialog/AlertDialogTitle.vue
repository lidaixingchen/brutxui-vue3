<script setup lang="ts">
import { computed } from 'vue'
import type { ClassValue } from 'clsx'
import { AlertDialogTitle as AlertDialogTitlePrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { alertDialogTitleVariants } from './alert-dialog-variants'

interface AlertDialogTitleProps {
    class?: ClassValue
}

const props = defineProps<AlertDialogTitleProps>()

const classes = computed(() =>
    cn(alertDialogTitleVariants(), props.class)
)
</script>

<template>
    <AlertDialogTitlePrimitive :class="classes">
        <!-- 兜底占位文本：仅当调用方未提供标题内容时显示，保证可访问名称非空。
             业务方应始终传入有意义的标题；占位为英文且未接入 i18n（AlertDialog 组件族无
             locale 依赖），如需本地化请通过插槽内容覆盖 -->
        <slot>Alert</slot>
    </AlertDialogTitlePrimitive>
</template>
