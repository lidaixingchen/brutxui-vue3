<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, Sparkles } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { iconSizeVariants, type IconSize } from '../../lib/icon-size-variants'
import Button from '../button/Button.vue'
import Badge from '../badge/Badge.vue'
import Card from '../card/Card.vue'
import CardContent from '../card/CardContent.vue'

interface BrutalistHeroProps {
    title?: string
    subtitle?: string
    primaryCtaText?: string
    secondaryCtaText?: string
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<BrutalistHeroProps>(), {
    title: undefined,
    subtitle: undefined,
    primaryCtaText: undefined,
    secondaryCtaText: undefined,
    class: undefined,
    iconSize: 'lg',
})

const { t } = useLocale()

const resolvedTitle = computed(() => props.title ?? t('brutalistHero.title'))
const resolvedSubtitle = computed(() => props.subtitle ?? t('brutalistHero.defaultSubtitle'))
const resolvedPrimaryCtaText = computed(() => props.primaryCtaText ?? t('brutalistHero.primaryCtaText'))
const resolvedSecondaryCtaText = computed(() => props.secondaryCtaText ?? t('brutalistHero.secondaryCtaText'))

const emit = defineEmits<{
    'primary-cta': []
    'secondary-cta': []
}>()

const rootClasses = computed(() => cn('w-full', props.class))

const primaryCtaIconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'ml-2 stroke-[3]')
)

const badgeIconClasses = cn(iconSizeVariants({ size: 'default' }), 'stroke-[3]')
</script>

<template>
    <div :class="rootClasses">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
                <Badge variant="accent" class="mb-6 gap-2 rotate-[-1deg] font-black">
                    <Sparkles :class="badgeIconClasses" />
                    <span>{{ t('brutalistHero.neoBrutalismUI') }}</span>
                </Badge>
                <h1 class="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
{{ resolvedTitle }}
</h1>
                <p v-if="resolvedSubtitle" class="mt-4 text-lg text-brutal-muted-foreground font-medium">
{{ resolvedSubtitle }}
</p>
                <div class="mt-8 flex flex-wrap gap-4">
                    <Button variant="primary" size="lg" @click="emit('primary-cta')">
                        {{ resolvedPrimaryCtaText }}
                        <ArrowRight :class="primaryCtaIconClasses" />
                    </Button>
                    <Button variant="outline" size="lg" @click="emit('secondary-cta')">
{{ resolvedSecondaryCtaText }}
</Button>
                </div>
            </div>

            <div class="relative">
                <div class="absolute inset-0 bg-brutal-primary border-3 border-brutal translate-x-3 translate-y-3" />
                <Card variant="default" padding="default" class="relative bg-brutal-bg font-mono text-sm">
                    <CardContent>
                        <div class="space-y-1">
                            <p class="text-brutal-muted-foreground">
$ npx brutxui init
</p>
                            <p class="text-brutal-success font-bold">
✓ Project initialized
</p>
                            <p class="text-brutal-muted-foreground">
$ npx brutxui add button
</p>
                            <p class="text-brutal-success font-bold">
✓ Button component added
</p>
                            <p class="text-brutal-muted-foreground">
$ npx brutxui add card dialog
</p>
                            <p class="text-brutal-success font-bold">
✓ 2 components added
</p>
                            <p class="text-brutal-accent font-bold animate-pulse">
█
</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
</template>
