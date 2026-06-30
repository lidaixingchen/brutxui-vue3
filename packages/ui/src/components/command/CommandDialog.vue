<script setup lang="ts">
import { computed } from 'vue'
import { DialogRoot } from 'reka-ui'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import DialogContent from '../dialog/DialogContent.vue'
import DialogTitle from '../dialog/DialogTitle.vue'
import DialogDescription from '../dialog/DialogDescription.vue'
import Command from './Command.vue'

interface CommandDialogProps {
    open?: boolean
    title?: string
    description?: string
    class?: string
}

const props = withDefaults(defineProps<CommandDialogProps>(), {
    open: false,
    title: undefined,
    description: undefined,
    class: undefined,
})

const { t } = useLocale()

const resolvedTitle = computed(() => props.title ?? t('command.dialogTitle'))
const resolvedDescription = computed(() => props.description ?? t('command.dialogDescription'))

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const contentClass = computed(() => cn('overflow-hidden p-0', props.class))
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
