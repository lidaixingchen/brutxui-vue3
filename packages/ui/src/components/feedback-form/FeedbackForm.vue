<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { Send } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import Card from '../card/Card.vue'
import CardContent from '../card/CardContent.vue'
import Input from '../input/Input.vue'
import Textarea from '../textarea/Textarea.vue'
import Button from '../button/Button.vue'

interface FeedbackFormProps {
    title?: string
    description?: string
    submitText?: string
    class?: string
}

const props = withDefaults(defineProps<FeedbackFormProps>(), {
    title: undefined,
    description: undefined,
    submitText: undefined,
    class: undefined,
})

const emit = defineEmits<{
    submit: [payload: { name: string; email: string; subject: string; message: string }]
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
    if (!validate()) return

    emit('submit', {
        name: name.value,
        email: email.value,
        subject: subject.value,
        message: message.value,
    })
}
</script>

<template>
    <div :class="rootClasses">
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
                    <form class="space-y-4" @submit.prevent="handleSubmit">
                        <div class="space-y-2">
                            <label for="feedback-name" class="text-sm font-bold text-brutal-fg">
                                {{ nameLabel }}
                            </label>
                            <Input id="feedback-name" v-model="name" :placeholder="nameLabel" :variant="errors.name ? 'error' : 'default'" />
                            <p v-if="errors.name" class="text-sm text-red-500 font-medium">{{ errors.name }}</p>
                        </div>
                        <div class="space-y-2">
                            <label for="feedback-email" class="text-sm font-bold text-brutal-fg">
                                {{ emailLabel }}
                            </label>
                            <Input id="feedback-email" v-model="email" type="email" :placeholder="emailLabel" :variant="errors.email ? 'error' : 'default'" />
                            <p v-if="errors.email" class="text-sm text-red-500 font-medium">{{ errors.email }}</p>
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
                            </label>
                            <Textarea id="feedback-message" v-model="message" :placeholder="messageLabel" :variant="errors.message ? 'error' : 'default'" />
                            <p v-if="errors.message" class="text-sm text-red-500 font-medium">{{ errors.message }}</p>
                        </div>
                        <Button variant="primary" type="submit" class="w-full">
                            <Send class="h-4 w-4 mr-2" />
                            {{ resolvedSubmitText }}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </slot>

        <slot name="footer" />
    </div>
</template>
