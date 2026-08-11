<script setup lang="ts">
import { computed } from 'vue'
import { DialogRoot } from 'reka-ui'
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import DialogContent from '../dialog/DialogContent.vue'
import DialogTitle from '../dialog/DialogTitle.vue'
import DialogDescription from '../dialog/DialogDescription.vue'
import Command from './Command.vue'

/**
 * 命令面板对话框。
 *
 * 完全受控组件：必须绑定 `v-model:open`（或监听 `update:open`）才能开合；
 * 未绑定时用户操作（如 Escape / 点击遮罩）不会改变对话框状态。
 */
interface CommandDialogProps {
    open?: boolean
    title?: string
    description?: string
    class?: ClassValue
}

const props = withDefaults(defineProps<CommandDialogProps>(), {
    open: false,
    title: undefined,
    description: undefined,
    class: undefined,
})

const { t } = useLocale()

// trim + 空串兜底：props.title 为空串时回退到 locale 文案，避免可访问名称变成空串或字面 key
const resolvedTitle = computed(() => props.title?.trim() || t('command.dialogTitle').trim())
const resolvedDescription = computed(() => props.description?.trim() || t('command.dialogDescription').trim())

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

// 结构性 class（overflow-hidden/p-0）放在 props.class 之后，调用方无法覆盖，保证命令面板布局不被破坏
const contentClass = computed(() => cn(props.class, 'overflow-hidden p-0'))
</script>

<template>
    <DialogRoot :open="props.open" @update:open="emit('update:open', $event)">
        <DialogContent :show-close-button="false" :class="contentClass">
            <div class="sr-only">
                <DialogTitle>{{ resolvedTitle }}</DialogTitle>
                <DialogDescription>{{ resolvedDescription }}</DialogDescription>
            </div>
            <Command class="[&_[data-slot=command-group-heading]]:px-2 [&_[data-slot=command-group-heading]]:font-black [&_[data-slot=command-group-heading]]:text-brutal-muted-foreground [&_[data-slot=command-group]]:px-2 [&_[data-slot=command-input]]:h-12 [&_[data-slot=command-item]]:px-3 [&_[data-slot=command-item]]:py-3">
                <slot />
            </Command>
        </DialogContent>
    </DialogRoot>
</template>
