<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { Send } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import Card from '../card/Card.vue'
import CardContent from '../card/CardContent.vue'
import Input from '../input/Input.vue'
import Textarea from '../textarea/Textarea.vue'
import Button from '../button/Button.vue'
import SuccessCard from '../success-card/SuccessCard.vue'

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
    iconSize: 'default',
})

const emit = defineEmits<{
    submit: [payload: { name: string; email: string; subject: string; message: string }]
    'success-confirm': []
}>()

const { t } = useLocale()

const resolvedTitle = computed(() => props.title ?? t('feedbackForm.defaultTitle'))
const resolvedDescription = computed(() => props.description ?? t('feedbackForm.defaultDescription'))
const resolvedSubmitText = computed(() => props.submitText ?? t('feedbackForm.defaultSubmitText'))
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

function validate(): boolean {
    errors.name = ''
    errors.email = ''
    errors.message = ''

    if (!name.value.trim()) {
        errors.name = t('feedbackForm.nameRequired')
    }
    if (!email.value.trim()) {
        errors.email = t('feedbackForm.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        errors.email = t('feedbackForm.emailInvalid')
    }
    if (!message.value.trim()) {
        errors.message = t('feedbackForm.messageRequired')
    }

    return !errors.name && !errors.email && !errors.message
}

function handleSubmit() {
    if (props.loading) return
    if (!validate()) return

    emit('submit', {
        name: name.value,
        email: email.value,
        subject: subject.value,
        message: message.value,
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
        <SuccessCard
            v-if="success"
            :title="successTitle"
            :description="successDescription"
            :confirm-text="successConfirmText"
            :icon-size="iconSize"
            @confirm="handleSuccessConfirm"
        />

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
                                <label for="feedback-name" class="text-sm font-bold text-brutal-fg">
                                    {{ nameLabel }}
                                    <span class="text-brutal-destructive" aria-hidden="true">*</span>
                                </label>
                                <Input
                                    id="feedback-name"
                                    v-model="name"
                                    :placeholder="nameLabel"
                                    :variant="errors.name ? 'error' : 'default'"
                                    :aria-invalid="!!errors.name"
                                    :aria-errormessage="errors.name ? 'feedback-name-error' : undefined"
                                    aria-required="true"
                                />
                                <p v-if="errors.name" id="feedback-name-error" class="text-sm text-red-500 font-medium" role="alert">{{ errors.name }}</p>
                            </div>
                            <div class="space-y-2">
                                <label for="feedback-email" class="text-sm font-bold text-brutal-fg">
                                    {{ emailLabel }}
                                    <span class="text-brutal-destructive" aria-hidden="true">*</span>
                                </label>
                                <Input
                                    id="feedback-email"
                                    v-model="email"
                                    type="email"
                                    :placeholder="emailLabel"
                                    :variant="errors.email ? 'error' : 'default'"
                                    :aria-invalid="!!errors.email"
                                    :aria-errormessage="errors.email ? 'feedback-email-error' : undefined"
                                    aria-required="true"
                                />
                                <p v-if="errors.email" id="feedback-email-error" class="text-sm text-red-500 font-medium" role="alert">{{ errors.email }}</p>
                            </div>
                            <div class="space-y-2">
                                <label for="feedback-subject" class="text-sm font-bold text-brutal-fg">
                                    {{ subjectLabel }}
                                </label>
                                <Input id="feedback-subject" v-model="subject" :placeholder="subjectLabel" />
                            </div>
                            <div class="space-y-2">
                                <label for="feedback-message" class="text-sm font-bold text-brutal-fg">
                                    {{ messageLabel }}
                                    <span class="text-brutal-destructive" aria-hidden="true">*</span>
                                </label>
                                <Textarea
                                    id="feedback-message"
                                    v-model="message"
                                    :placeholder="messageLabel"
                                    :variant="errors.message ? 'error' : 'default'"
                                    :aria-invalid="!!errors.message"
                                    :aria-errormessage="errors.message ? 'feedback-message-error' : undefined"
                                    aria-required="true"
                                />
                                <p v-if="errors.message" id="feedback-message-error" class="text-sm text-red-500 font-medium" role="alert">{{ errors.message }}</p>
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
