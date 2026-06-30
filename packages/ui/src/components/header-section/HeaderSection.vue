<script setup lang="ts">
import { computed, ref } from 'vue'
import { DialogRoot } from 'reka-ui'
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

export interface NavItem {
    label: string
    href?: string
}

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

const resolvedLogoText = computed(() => props.logoText ?? t('headerSection.defaultLogoText'))
const resolvedCtaText = computed(() => props.ctaText ?? t('headerSection.defaultCtaText'))
const menuLabel = computed(() => t('headerSection.menuLabel'))

const mobileMenuOpen = ref(false)

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
                        variant="primary"
                        size="sm"
                        class="hidden md:inline-flex"
                        @click="emit('cta-click')"
                    >
                        {{ resolvedCtaText }}
                    </Button>
                </slot>

                <Button
                    variant="outline"
                    size="sm"
                    class="md:hidden"
                    @click="mobileMenuOpen = true"
                >
                    <Menu :class="menuIconClasses" />
                    <span class="sr-only">{{ menuLabel }}</span>
                </Button>
            </div>
        </div>

        <DialogRoot v-model:open="mobileMenuOpen">
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>{{ resolvedLogoText }}</SheetTitle>
                    <SheetDescription>{{ menuLabel }}</SheetDescription>
                </SheetHeader>
                <nav class="flex flex-col gap-2 py-4">
                    <Button
                        v-for="(item, index) in navItems"
                        :key="index"
                        variant="ghost"
                        class="justify-start"
                        @click="emit('nav-click', index); mobileMenuOpen = false"
                    >
                        {{ item.label }}
                    </Button>
                </nav>
                <Separator />
                <div class="pt-4">
                    <Button
                        variant="primary"
                        class="w-full"
                        @click="emit('cta-click'); mobileMenuOpen = false"
                    >
                        {{ resolvedCtaText }}
                    </Button>
                </div>
            </SheetContent>
        </DialogRoot>
    </header>
</template>
