<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import Button from '../button/Button.vue'
import Separator from '../separator/Separator.vue'
import type { FooterLink, FooterLinkGroup } from './types'

export type { FooterLink, FooterLinkGroup };

interface FooterSectionProps {
    logoText?: string
    description?: string
    linkGroups?: FooterLinkGroup[]
    copyright?: string
    class?: string
}

const props = withDefaults(defineProps<FooterSectionProps>(), {
    logoText: undefined,
    description: undefined,
    linkGroups: () => [],
    copyright: undefined,
    class: undefined,
})

const emit = defineEmits<{
    'link-click': [payload: { groupIndex: number; linkIndex: number; event: MouseEvent }]
}>()

const { t } = useLocale()

// 品牌默认值属实例配置而非界面文案，不放入语言包（避免随 locale 分裂）
const DEFAULT_LOGO_TEXT = 'BrutxUI'

const resolvedLogoText = computed(() => props.logoText ?? DEFAULT_LOGO_TEXT)
const resolvedDescription = computed(() => props.description ?? t('footerSection.defaultDescription'))
// 版权年份动态生成，避免硬编码跨年后过期；语言包文案通过 {year} 占位符插值。
// 年份在 computed 首次求值时缓存：组件跨年保持挂载时不自动更新（页面长开至跨年的边界，业界普遍接受）
const resolvedCopyright = computed(() => props.copyright ?? t('footerSection.defaultCopyright', { year: String(new Date().getFullYear()) }))

const rootClasses = computed(() =>
    cn(
        '@container/footer-section w-full',
        'bg-brutal-bg border-t-3 border-brutal',
        props.class
    )
)

const isSafeHref = (href?: string): boolean =>
    !href || !/^(?:javascript|data|vbscript):/i.test(href.trim())
</script>

<template>
    <footer :class="rootClasses">
        <div class="mx-auto max-w-7xl px-4 py-10 @3xl/footer-section:px-6">
            <slot name="header">
                <div class="mb-8">
                    <span class="wrap-anywhere text-xl font-black tracking-tight text-brutal-fg">
                        {{ resolvedLogoText }}
                    </span>
                    <p v-if="resolvedDescription" class="mt-2 max-w-sm wrap-anywhere text-sm font-medium text-brutal-muted-foreground">
                        {{ resolvedDescription }}
                    </p>
                </div>
            </slot>

            <slot>
                <div v-if="linkGroups.length > 0" class="mb-8 grid grid-cols-1 gap-8 @3xs/footer-section:grid-cols-2 @3xl/footer-section:grid-cols-4">
                    <!-- 复合 key 保证唯一性：title 未约束不重复 -->
                    <div v-for="(group, groupIndex) in linkGroups" :key="`${group.title}-${groupIndex}`">
                        <h3 class="mb-3 wrap-anywhere text-sm font-black tracking-wide text-brutal-fg">
                            {{ group.title }}
                        </h3>
                        <ul class="space-y-2 list-none">
                            <li v-for="(link, linkIndex) in group.links" :key="`${link.href ?? link.label}-${linkIndex}`" class="flex items-start gap-2">
                                <span class="mt-2 size-1.5 shrink-0 bg-brutal-fg" />
                                <a
                                    v-if="link.href && isSafeHref(link.href)"
                                    :href="link.href"
                                    class="min-w-0 cursor-pointer wrap-anywhere text-sm font-medium text-brutal-muted-foreground transition-all hover:text-brutal-fg active:translate-y-[2px] active:shadow-none"
                                    @click="(event) => emit('link-click', { groupIndex, linkIndex, event })"
                                >
                                    {{ link.label }}
                                </a>
                                <Button
                                    v-else
                                    variant="ghost"
                                    size="sm"
                                    class="h-auto min-w-0 justify-start p-0 text-left whitespace-normal wrap-anywhere text-brutal-muted-foreground hover:text-brutal-fg"
                                    @click="(event: MouseEvent) => emit('link-click', { groupIndex, linkIndex, event })"
                                >
                                    {{ link.label }}
                                </Button>
                            </li>
                        </ul>
                    </div>
                </div>
            </slot>

            <Separator />

            <slot name="footer">
                <div class="pt-6 text-center">
                    <p class="wrap-anywhere text-sm font-medium text-brutal-muted-foreground">
                        {{ resolvedCopyright }}
                    </p>
                </div>
            </slot>
        </div>
    </footer>
</template>
