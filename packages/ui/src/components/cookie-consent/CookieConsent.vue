<script setup lang="ts">
import { computed, useId } from 'vue'
import { Cookie } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import Card from '../card/Card.vue'
import CardContent from '../card/CardContent.vue'
import Button from '../button/Button.vue'

interface CookieConsentProps {
    modelValue?: boolean
    title?: string
    description?: string
    acceptText?: string
    declineText?: string
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<CookieConsentProps>(), {
    modelValue: true,
    title: undefined,
    description: undefined,
    acceptText: undefined,
    declineText: undefined,
    class: undefined,
    iconSize: 'xl',
})

const { t } = useLocale()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    accept: []
    decline: []
}>()

// 先 emit update:modelValue 再触发业务事件：emit 同步执行，父组件的 accept/decline
// 回调中读取绑定的 modelValue 时已是更新后的值（false），避免「回调里判断已关闭却仍是开启」的不一致
function handleAccept() {
    emit('update:modelValue', false)
    emit('accept')
}

function handleDecline() {
    emit('update:modelValue', false)
    emit('decline')
}

const rootClasses = computed(() =>
    cn(
        'fixed inset-x-0 bottom-0 z-toast max-h-dvh overflow-y-auto p-4',
        props.class
    )
)

const cardClasses = computed(() =>
    cn(
        '@container/cookie-consent mx-auto w-full max-w-4xl',
        'border-3 border-brutal shadow-brutal-lg',
    )
)

// 用 || 而非 ??：空字符串视为未设置，回退默认国际化文案（?? 只对 null/undefined 生效，
// 传 '' 会导致标题/按钮渲染为空）
const resolvedTitle = computed(() => props.title || t('cookieConsent.defaultTitle'))
const resolvedDescription = computed(() => props.description || t('cookieConsent.defaultDescription'))
const resolvedAcceptText = computed(() => props.acceptText || t('cookieConsent.defaultAcceptText'))
const resolvedDeclineText = computed(() => props.declineText || t('cookieConsent.defaultDeclineText'))

const titleId = `cookie-consent-title-${useId()}`

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'shrink-0 stroke-[2.5] mt-0.5')
)
</script>

<template>
    <Transition
        enter-active-class="transition-all duration-300 ease-out motion-reduce:transition-none"
        leave-active-class="transition-all duration-300 ease-in motion-reduce:transition-none"
        enter-from-class="opacity-0 translate-y-full"
        leave-to-class="opacity-0 translate-y-full"
    >
        <div v-if="modelValue" :class="rootClasses" aria-live="polite" role="region" :aria-labelledby="titleId">
            <Card :class="cardClasses" variant="default">
                <CardContent class="flex flex-col gap-4 @3xl/cookie-consent:flex-row @3xl/cookie-consent:items-center">
                    <div class="flex min-w-0 flex-1 items-start gap-3">
                        <Cookie :class="iconClasses" />
                        <div class="min-w-0">
                            <h3 :id="titleId" class="wrap-anywhere text-base font-black tracking-tight">
{{ resolvedTitle }}
</h3>
                            <p class="mt-1 wrap-anywhere text-sm font-medium text-brutal-muted-foreground">
{{ resolvedDescription }}
</p>
                        </div>
                    </div>
                    <div class="flex min-w-0 flex-wrap gap-2 @3xl/cookie-consent:max-w-1/2 @3xl/cookie-consent:justify-end">
                        <Button variant="outline" size="sm" class="h-auto min-h-9 w-full py-2 whitespace-normal wrap-anywhere @sm/cookie-consent:w-auto" @click="handleDecline">
                            {{ resolvedDeclineText }}
                        </Button>
                        <Button variant="primary" size="sm" class="h-auto min-h-9 w-full py-2 whitespace-normal wrap-anywhere @sm/cookie-consent:w-auto" @click="handleAccept">
                            {{ resolvedAcceptText }}
                        </Button>
                    </div>
                    <slot name="actions" />
                </CardContent>
            </Card>
        </div>
    </Transition>
</template>
