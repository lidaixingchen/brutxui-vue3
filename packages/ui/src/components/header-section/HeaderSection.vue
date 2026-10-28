<script setup lang="ts">
import { computed, ref } from 'vue'
import { DialogRoot, DialogTrigger } from 'reka-ui'
import { Menu } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import Button from '../button/Button.vue'
import SheetContent from '../sheet/SheetContent.vue'
import SheetHeader from '../sheet/SheetHeader.vue'
import SheetTitle from '../sheet/SheetTitle.vue'
import SheetDescription from '../sheet/SheetDescription.vue'
import Separator from '../separator/Separator.vue'
import type { NavItem } from './types'

export type { NavItem };

interface HeaderSectionProps {
    logoText?: string
    navItems?: NavItem[]
    ctaText?: string
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<HeaderSectionProps>(), {
    logoText: undefined,
    navItems: () => [],
    ctaText: undefined,
    class: undefined,
    iconSize: 'lg',
})

const emit = defineEmits<{
    'cta-click': []
    'nav-click': [index: number]
}>()

const { t } = useLocale()

// 品牌默认值属实例配置而非界面文案，不放入语言包
const DEFAULT_LOGO_TEXT = 'BrutxUI'

const resolvedLogoText = computed(() => props.logoText ?? DEFAULT_LOGO_TEXT)
const resolvedCtaText = computed(() => props.ctaText ?? t('headerSection.defaultCtaText'))
const menuLabel = computed(() => t('headerSection.menuLabel'))

const navigationDrawerOpen = ref(false)

// 抽屉内的导航/CTA：先关闭抽屉再通知父组件，
// 父级监听器同步抛错也不会让用户卡在打开状态
function handleNavClick(index: number) {
    navigationDrawerOpen.value = false
    emit('nav-click', index)
}

function handleCtaClick() {
    navigationDrawerOpen.value = false
    emit('cta-click')
}

const rootClasses = computed(() =>
    cn(
        'sticky top-0 z-header w-full',
        'bg-brutal-bg border-b-3 border-brutal shadow-brutal-sm',
        props.class
    )
)

const menuIconClasses = computed(() => iconSizeVariants({ size: props.iconSize }))
</script>

<template>
    <header :class="rootClasses">
        <DialogRoot v-model:open="navigationDrawerOpen">
            <div class="@container/header-section header-section-inner mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 md:px-6">
                <div class="header-section-brand min-w-0 flex-1 basis-40 @4xl/header-section:flex-none">
                    <slot name="header">
                        <span class="block truncate text-xl font-black tracking-tight text-brutal-fg">
                            {{ resolvedLogoText }}
                        </span>
                    </slot>
                </div>

                <slot>
                    <nav class="header-section-nav hidden min-w-0 flex-1 flex-wrap items-center justify-center gap-0 @4xl/header-section:flex">
                        <Button
                            v-for="(item, index) in navItems"
                            :key="index"
                            type="button"
                            variant="ghost"
                            size="sm"
                            class="h-auto min-h-9 max-w-full shrink-0 whitespace-normal break-words px-1.5 text-left"
                            @click="emit('nav-click', index)"
                        >
                            {{ item.label }}
                        </Button>
                    </nav>
                </slot>

                <div class="header-section-actions min-w-0 max-w-full flex flex-wrap items-center justify-end gap-3">
                    <slot name="footer">
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            class="header-section-cta h-auto min-h-9 max-w-full min-w-0 whitespace-normal break-words"
                            @click="emit('cta-click')"
                        >
                            {{ resolvedCtaText }}
                        </Button>
                    </slot>

                    <!-- DialogTrigger 位于 DialogRoot 内，自动获得 aria-haspopup/aria-expanded/aria-controls 与焦点管理 -->
                    <DialogTrigger as-child>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            class="header-section-menu-trigger @4xl/header-section:hidden"
                        >
                            <Menu :class="menuIconClasses" />
                            <span class="sr-only">{{ menuLabel }}</span>
                        </Button>
                    </DialogTrigger>
                </div>
            </div>

            <SheetContent side="right">
                <SheetHeader>
                <SheetTitle class="break-words">{{ resolvedLogoText }}</SheetTitle>
                    <SheetDescription>{{ menuLabel }}</SheetDescription>
                </SheetHeader>
                <nav class="flex flex-col gap-2 py-4">
                    <Button
                        v-for="(item, index) in navItems"
                        :key="index"
                        type="button"
                        variant="ghost"
                        class="min-w-0 justify-start whitespace-normal break-words text-left"
                        @click="handleNavClick(index)"
                    >
                        {{ item.label }}
                    </Button>
                </nav>
                <Separator />
                <div class="pt-4">
                    <Button
                        type="button"
                        variant="primary"
                        class="w-full whitespace-normal break-words"
                        @click="handleCtaClick"
                    >
                        {{ resolvedCtaText }}
                    </Button>
                </div>
            </SheetContent>
        </DialogRoot>
    </header>
</template>
