<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { datePickerFooterVariants } from './date-picker-variants'
import Button from '../button/Button.vue'

interface DatePickerPanelFooterProps {
    clearLabel?: string
    confirmLabel?: string
    /** 异步提交期间禁用两个按钮，避免重复 emit */
    disabled?: boolean
}

const props = withDefaults(defineProps<DatePickerPanelFooterProps>(), {
    clearLabel: undefined,
    confirmLabel: undefined,
    disabled: false,
})

const { t } = useLocale()

// 空字符串与 undefined 都回退语言包文案，避免按钮显示空白且保持 i18n 体系一致
const resolvedClearLabel = computed(() => props.clearLabel || t('datePicker.clear'))
const resolvedConfirmLabel = computed(() => props.confirmLabel || t('datePicker.confirm'))

const emit = defineEmits<{
    clear: []
    confirm: []
}>()

const footerClasses = cn(datePickerFooterVariants())
</script>

<template>
    <div :class="footerClasses">
        <Button variant="default" size="sm" type="button" :disabled="disabled" @click="emit('clear')">
            {{ resolvedClearLabel }}
        </Button>
        <Button variant="primary" size="sm" type="button" :disabled="disabled" @click="emit('confirm')">
            {{ resolvedConfirmLabel }}
        </Button>
    </div>
</template>
