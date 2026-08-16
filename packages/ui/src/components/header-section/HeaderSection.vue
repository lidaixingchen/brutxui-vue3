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

const mobileMenuOpen = ref(false)

// 移动端抽屉内的导航/CTA：先关闭抽屉再通知父组件，
// 父级监听器同步抛错也不会让用户卡在打开状态
function handleNavClick(index: number) {
    mobileMenuOpen.value = false
    emit('nav-click', index)
}

function handleCtaClick() {
    mobileMenuOpen.value = false
    emit('cta-click')
}

const rootClasses = computed(() =>
    cn(
        'sticky top-0 z-40 w-full',
        'bg-brutal-bg border-b-3 border-brutal shadow-brutal-sm',
        props.class
    )
)

const menuIconClasses = computed(() => iconSizeVariants({ size: props.iconSize }))
</script>

<template>
    <header :class="rootClasses">
        <DialogRoot v-model:open="mobileMenuOpen">
            <div class="flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
                <slot name="header">
                    <span class="text-xl font-black tracking-tight text-brutal-fg">
                        {{ resolvedLogoText }}
                    </span>
                </slot>

                <slot>
                    <nav class="hidden md:flex items-center gap-1">
                        <Button
                            v-for="(item, index) in navItems"
                            :key="index"
                            type="button"
                            variant="ghost"
                            size="sm"
                            @click="emit('nav-click', index)"
                        >
                            {{ item.label }}
                        </Button>
                    </nav>
                </slot>

                <div class="flex items-center gap-3">
                    <slot name="footer">
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            class="hidden md:inline-flex"
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
                            class="md:hidden"
                        >
                            <Menu :class="menuIconClasses" />
                            <span class="sr-only">{{ menuLabel }}</span>
                        </Button>
                    </DialogTrigger>
                </div>
            </div>

            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>{{ resolvedLogoText }}</SheetTitle>
                    <SheetDescription>{{ menuLabel }}</SheetDescription>
                </SheetHeader>
                <nav class="flex flex-col gap-2 py-4">
                    <Button
                        v-for="(item, index) in navItems"
                        :key="index"
                        type="button"
                        variant="ghost"
                        class="justify-start"
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
                        class="w-full"
                        @click="handleCtaClick"
                    >
                        {{ resolvedCtaText }}
                    </Button>
                </div>
            </SheetContent>
        </DialogRoot>
    </header>
</template>
