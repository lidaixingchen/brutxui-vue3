<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, Sparkles } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import Button from '../button/Button.vue'
import Badge from '../badge/Badge.vue'
import Card from '../card/Card.vue'
import CardContent from '../card/CardContent.vue'
import CardWindowHeader from '../card-window-header/CardWindowHeader.vue'
import BrutalShape from '../brutal-shape/BrutalShape.vue'

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

// 空字符串视为未提供：与 subtitle 的 v-if 语义一致，title="" 不会渲染空白标题/空 CTA 按钮
const resolvedTitle = computed(() => props.title || t('brutalistHero.title'))
const resolvedSubtitle = computed(() => props.subtitle || t('brutalistHero.defaultSubtitle'))
const resolvedPrimaryCtaText = computed(() => props.primaryCtaText || t('brutalistHero.primaryCtaText'))
const resolvedSecondaryCtaText = computed(() => props.secondaryCtaText || t('brutalistHero.secondaryCtaText'))

const emit = defineEmits<{
    'primary-cta': []
    'secondary-cta': []
}>()

const rootClasses = computed(() => cn('w-full', props.class))

const primaryCtaIconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'ml-2 stroke-[3]')
)

const badgeIconClasses = cn(iconSizeVariants({ size: 'md' }), 'stroke-[3]')
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
                    <Button variant="primary" size="lg" flair="stacked" @click="emit('primary-cta')">
                        {{ resolvedPrimaryCtaText }}
                        <ArrowRight :class="primaryCtaIconClasses" />
                    </Button>
                    <Button variant="outline" size="lg" @click="emit('secondary-cta')">
{{ resolvedSecondaryCtaText }}
</Button>
                </div>
            </div>

            <div class="relative">
                <!-- 背景水印字符：低透明度等宽符号，纯装饰层 -->
                <span
                    aria-hidden="true"
                    class="pointer-events-none select-none absolute -top-14 right-4 font-mono text-[120px] font-black leading-none text-brutal-fg opacity-5"
                >&lt;/&gt;</span>
                <!-- 四角爆炸星图腾点缀（内收定位避免溢出污染相邻布局） -->
                <BrutalShape
                    name="star-8"
                    :size="40"
                    class="absolute -left-3 -top-3 z-10 rotate-12"
                />
                <BrutalShape
                    name="star-12"
                    :size="26"
                    color="var(--brutal-secondary)"
                    class="absolute -bottom-2.5 -right-2 z-10 -rotate-6"
                />
                <div class="absolute inset-0 bg-brutal-primary border-3 border-brutal translate-x-3 translate-y-3" />
                <Card texture="grid" variant="default" padding="none" class="relative bg-brutal-bg font-mono text-sm">
                    <CardWindowHeader title="terminal_shell // brutxui" />
                    <CardContent class="p-5">
                        <!-- terminal 插槽：允许调用方替换 CLI 演示内容（默认展示 brutxui 安装命令） -->
                        <slot name="terminal">
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
                                <p class="text-brutal-accent font-bold motion-safe:animate-pulse">
█
</p>
                            </div>
                        </slot>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
</template>
