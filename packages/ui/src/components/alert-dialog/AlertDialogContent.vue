<script setup lang="ts">
import { computed } from 'vue'
import type { ClassValue } from 'clsx'
import {
    AlertDialogPortal as AlertDialogPortalPrimitive,
    AlertDialogOverlay as AlertDialogOverlayPrimitive,
    AlertDialogContent as AlertDialogContentPrimitive,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { overlayVariants } from '@/lib/modal-variants'
import { alertDialogContentVariants } from './alert-dialog-variants'

// 根节点为 Portal（Teleport），Vue 无法将 attrs 自动落到弹层根元素上，
// 故关闭隐式继承，改由模板显式 v-bind="$attrs" 到 Content primitive，确保 aria-*/data-*/style 等透传可预期。
defineOptions({ inheritAttrs: false })

interface AlertDialogContentProps {
    class?: ClassValue
    /** 遮罩层自定义类名：合并进 overlay，供二次封装定制遮罩样式 */
    overlayClass?: ClassValue
}

const props = defineProps<AlertDialogContentProps>()

const overlayClasses = computed(() => cn(overlayVariants(), props.overlayClass))

const contentClasses = computed(() =>
    cn(alertDialogContentVariants(), props.class)
)
</script>

<template>
    <AlertDialogPortalPrimitive>
        <AlertDialogOverlayPrimitive :class="overlayClasses" />
        <AlertDialogContentPrimitive v-bind="$attrs" :class="contentClasses">
            <slot />
        </AlertDialogContentPrimitive>
    </AlertDialogPortalPrimitive>
</template>
