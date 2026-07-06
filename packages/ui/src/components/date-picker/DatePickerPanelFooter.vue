<script setup lang="ts">
import { cn } from '@/lib/utils'
import { datePickerFooterVariants } from './date-picker-variants'
import Button from '../button/Button.vue'

interface DatePickerPanelFooterProps {
    clearLabel: string
    confirmLabel: string
}

defineProps<DatePickerPanelFooterProps>()

const emit = defineEmits<{
    clear: []
    confirm: []
}>()

const footerClasses = cn(datePickerFooterVariants())
</script>

<template>
    <div :class="footerClasses">
        <Button variant="default" size="sm" type="button" @click="emit('clear')">
            {{ clearLabel }}
        </Button>
        <Button variant="primary" size="sm" type="button" @click="emit('confirm')">
            {{ confirmLabel }}
        </Button>
    </div>
</template>
