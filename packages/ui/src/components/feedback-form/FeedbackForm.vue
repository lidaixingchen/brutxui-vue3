<script setup lang="ts">
import { computed, ref, reactive, useId, watch } from 'vue'
import { Send } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import Card from '../card/Card.vue'
import CardContent from '../card/CardContent.vue'
import Input from '../input/Input.vue'
import Textarea from '../textarea/Textarea.vue'
import Button from '../button/Button.vue'
import Result from '../result/Result.vue'
import Label from '../label/Label.vue'

interface FeedbackFormProps {
    title?: string
    description?: string
    submitText?: string
    loading?: boolean
    success?: boolean
    successTitle?: string
    successDescription?: string
    successConfirmText?: string
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<FeedbackFormProps>(), {
    title: undefined,
    description: undefined,
    submitText: undefined,
    loading: false,
    success: false,
    successTitle: undefined,
    successDescription: undefined,
    successConfirmText: undefined,
    class: undefined,
    iconSize: 'md',
})

const emit = defineEmits<{
    submit: [payload: { name: string; email: string; subject: string; message: string }]
    'success-confirm': []
}>()

const { t } = useLocale()

const uid = useId()
const fieldId = (suffix: string) => `feedback-${uid}-${suffix}`

const resolvedTitle = computed(() => props.title ?? t('feedbackForm.defaultTitle'))
const resolvedDescription = computed(() => props.description ?? t('feedbackForm.defaultDescription'))
const resolvedSubmitText = computed(() => props.submitText ?? t('feedbackForm.defaultSubmitText'))
const resolvedSuccessTitle = computed(() => props.successTitle ?? t('feedbackForm.successTitle'))
const resolvedSuccessDescription = computed(() => props.successDescription ?? t('feedbackForm.successDescription'))
const resolvedSuccessConfirmText = computed(() => props.successConfirmText ?? t('feedbackForm.successConfirmText'))
const nameLabel = computed(() => t('feedbackForm.nameLabel'))
const emailLabel = computed(() => t('feedbackForm.emailLabel'))
const subjectLabel = computed(() => t('feedbackForm.subjectLabel'))
const messageLabel = computed(() => t('feedbackForm.messageLabel'))

const name = ref('')
const email = ref('')
const subject = ref('')
const message = ref('')

const rootClasses = computed(() => cn('w-full max-w-2xl mx-auto', props.class))

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'mr-2')
)

const errors = reactive({
    name: '',
    email: '',
    message: '',
})

const submitting = ref(false)

// 输入修正时即时清除对应错误，避免旧错误滞留误导
watch(name, () => {
    errors.name = ''
})
watch(email, () => {
    errors.email = ''
})
watch(message, () => {
    errors.message = ''
})

// 父组件 loading 结束或进入成功态时复位防重锁，允许下一次提交
watch(
    () => [props.loading, props.success],
    ([loading, success]) => {
        if (!loading || success) submitting.value = false
    },
)

function validate(): boolean {
    errors.name = ''
    errors.email = ''
    errors.message = ''

    const trimmedName = name.value.trim()
    const trimmedEmail = email.value.trim()
    const trimmedMessage = message.value.trim()

    if (!trimmedName) {
        errors.name = t('feedbackForm.nameRequired')
    }
    if (!trimmedEmail) {
        errors.email = t('feedbackForm.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        errors.email = t('feedbackForm.emailInvalid')
    }
    if (!trimmedMessage) {
        errors.message = t('feedbackForm.messageRequired')
    }

    return !errors.name && !errors.email && !errors.message
}

function handleSubmit() {
    if (props.loading || submitting.value) return
    if (!validate()) return

    submitting.value = true
    emit('submit', {
        name: name.value.trim(),
        email: email.value.trim(),
        subject: subject.value.trim(),
        message: message.value.trim(),
    })
}

function handleSuccessConfirm() {
    name.value = ''
    email.value = ''
    subject.value = ''
    message.value = ''
    errors.name = ''
    errors.email = ''
    errors.message = ''
    emit('success-confirm')
}
</script>

<template>
    <div :class="rootClasses">
        <Result
            v-if="success"
            status="success"
            :title="resolvedSuccessTitle"
            :sub-title="resolvedSuccessDescription"
            :icon-size="iconSize"
        >
            <template #extra>
                <Button variant="primary" @click="handleSuccessConfirm">
                    {{ resolvedSuccessConfirmText }}
                </Button>
            </template>
        </Result>

        <template v-else>
            <slot name="header">
                <div class="text-center mb-8">
                    <h2 class="text-3xl font-black tracking-tight">
                        {{ resolvedTitle }}
                    </h2>
                    <p v-if="resolvedDescription" class="mt-2 text-brutal-muted-foreground font-medium">
                        {{ resolvedDescription }}
                    </p>
                </div>
            </slot>

            <slot>
                <Card variant="default">
                    <CardContent class="pt-6">
                        <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
                            <div class="space-y-2">
                                <Label :for="fieldId('name')" required>
                                    {{ nameLabel }}
                                </Label>
                                <Input
                                    :id="fieldId('name')"
                                    v-model="name"
                                    :placeholder="nameLabel"
                                    :variant="errors.name ? 'error' : 'default'"
                                    :disabled="loading"
                                    :aria-invalid="!!errors.name"
                                    :aria-errormessage="errors.name ? fieldId('name-error') : undefined"
                                    :aria-required="true"
                                />
                                <p v-if="errors.name" :id="fieldId('name-error')" class="text-sm text-red-500 font-medium" role="alert">
                                    {{ errors.name }}
                                </p>
                            </div>
                            <div class="space-y-2">
                                <Label :for="fieldId('email')" required>
                                    {{ emailLabel }}
                                </Label>
                                <Input
                                    :id="fieldId('email')"
                                    v-model="email"
                                    type="email"
                                    :placeholder="emailLabel"
                                    :variant="errors.email ? 'error' : 'default'"
                                    :disabled="loading"
                                    :aria-invalid="!!errors.email"
                                    :aria-errormessage="errors.email ? fieldId('email-error') : undefined"
                                    :aria-required="true"
                                />
                                <p v-if="errors.email" :id="fieldId('email-error')" class="text-sm text-red-500 font-medium" role="alert">
                                    {{ errors.email }}
                                </p>
                            </div>
                            <div class="space-y-2">
                                <Label :for="fieldId('subject')">
                                    {{ subjectLabel }}
                                </Label>
                                <Input :id="fieldId('subject')" v-model="subject" :placeholder="subjectLabel" :disabled="loading" />
                            </div>
                            <div class="space-y-2">
                                <Label :for="fieldId('message')" required>
                                    {{ messageLabel }}
                                </Label>
                                <Textarea
                                    :id="fieldId('message')"
                                    v-model="message"
                                    :placeholder="messageLabel"
                                    :variant="errors.message ? 'error' : 'default'"
                                    :disabled="loading"
                                    :aria-invalid="!!errors.message"
                                    :aria-errormessage="errors.message ? fieldId('message-error') : undefined"
                                    :aria-required="true"
                                />
                                <p v-if="errors.message" :id="fieldId('message-error')" class="text-sm text-red-500 font-medium" role="alert">
                                    {{ errors.message }}
                                </p>
                            </div>
                            <Button variant="primary" type="submit" class="w-full" :loading="loading">
                                <Send :class="iconClasses" />
                                {{ resolvedSubmitText }}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </slot>

            <slot name="footer" />
        </template>
    </div>
</template>
