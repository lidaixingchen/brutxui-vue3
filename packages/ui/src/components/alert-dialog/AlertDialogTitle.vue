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
        <!-- 无插槽内容时提供默认占位，避免空标题导致对话框可访问名称缺失 -->
        <slot>Alert</slot>
    </AlertDialogTitlePrimitive>
</template>
