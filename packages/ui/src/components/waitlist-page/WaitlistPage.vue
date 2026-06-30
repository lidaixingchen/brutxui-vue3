<script setup lang="ts">
import { computed, ref } from 'vue'
import { Sparkles, Users, Star } from '@lucide/vue'
import { useLocale } from '@/composables/useLocale'
import { cn } from '@/lib/utils'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { EMAIL_REGEX } from '@/lib/validation'
import Button from '../button/Button.vue'
import Badge from '../badge/Badge.vue'
import Input from '../input/Input.vue'

interface WaitlistPageProps {
    title?: string
    description?: string
    ctaText?: string
    waitlistCount?: number
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<WaitlistPageProps>(), {
    title: undefined,
    description: undefined,
    ctaText: undefined,
    waitlistCount: 0,
    class: undefined,
    iconSize: 'default',
})

const { t } = useLocale()

const resolvedTitle = computed(() => props.title ?? t('waitlistPage.title'))
const resolvedDescription = computed(() => props.description ?? t('waitlistPage.defaultDescription'))
const resolvedCtaText = computed(() => props.ctaText ?? t('waitlistPage.ctaText'))

const emit = defineEmits<{
    submit: [email: string]
}>()

const email = ref('')
const errorMessage = ref('')

const rootClasses = computed(() => cn('w-full max-w-lg mx-auto text-center', props.class))

const sparklesIconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3] animate-spin')
)

const usersIconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)

const starIconClasses = cn(
    iconSizeVariants({ size: 'sm' }),
    'fill-brutal-accent text-brutal-accent'
)

function handleSubmit() {
    if (email.value && EMAIL_REGEX.test(email.value)) {
        errorMessage.value = ''
        emit('submit', email.value)
    } else {
        errorMessage.value = t('waitlistPage.invalidEmail')
    }
}
</script>

<template>
    <div :class="rootClasses">
        <Badge variant="accent" class="mb-6 gap-2 rotate-[-1deg] font-black">
            <Sparkles :class="sparklesIconClasses" />
            <span>{{ t('waitlistPage.earlyAccess') }}</span>
        </Badge>

        <h1 class="text-3xl font-black tracking-tight">
{{ resolvedTitle }}
</h1>
        <p v-if="resolvedDescription" class="mt-3 text-brutal-muted-foreground font-medium">
{{ resolvedDescription }}
</p>

        <form class="mt-8 flex flex-col sm:flex-row gap-3" @submit.prevent="handleSubmit">
            <Input v-model="email" type="email" :placeholder="t('waitlistPage.emailPlaceholder')" class="flex-1" />
            <Button type="submit" variant="primary">
{{ resolvedCtaText }}
</Button>
        </form>

        <p v-if="errorMessage" class="mt-3 text-sm font-bold text-brutal-destructive">
{{ errorMessage }}
</p>

        <div class="mt-8 flex items-center justify-center gap-6 text-sm font-bold text-brutal-muted-foreground">
            <div v-if="waitlistCount > 0" class="flex items-center gap-1">
                <Users :class="usersIconClasses" />
                <span>{{ t('waitlistPage.onWaitlist', { count: waitlistCount.toLocaleString() }) }}</span>
            </div>
            <div class="flex items-center gap-1">
                <Star v-for="i in 5" :key="i" :class="starIconClasses" />
            </div>
            <div class="flex items-center gap-1">
                <div class="h-2 w-2 rounded-full bg-brutal-success animate-pulse" />
                <span>{{ t('waitlistPage.live') }}</span>
            </div>
        </div>
    </div>
</template>
