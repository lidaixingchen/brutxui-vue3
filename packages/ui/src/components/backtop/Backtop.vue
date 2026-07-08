<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, type CSSProperties } from 'vue'
import { ArrowUp } from '@lucide/vue'
import { useThrottle } from '@/composables/useThrottle'
import { cn } from '@/lib/utils'
import Button from '../button/Button.vue'
import type { ButtonVariant } from '../button/shared-button-variants'

interface BacktopProps {
    visibilityHeight?: number
    target?: string | HTMLElement
    right?: number
    bottom?: number
    variant?: ButtonVariant
    class?: string
}

const props = withDefaults(defineProps<BacktopProps>(), {
    visibilityHeight: 200,
    target: undefined,
    right: 40,
    bottom: 40,
    variant: 'primary',
    class: undefined,
})

const emit = defineEmits<{
    (e: 'click', event: MouseEvent): void
}>()

const visible = ref(false)
let container: HTMLElement | Window | null = null

const positionClass = computed(() => (props.target ? 'absolute' : 'fixed'))

const styles = computed<CSSProperties>(() => ({
    right: `${props.right}px`,
    bottom: `${props.bottom}px`
}))

function getScrollContainer() {
    if (!props.target) return window
    if (typeof props.target === 'string') {
        return document.querySelector(props.target) as HTMLElement
    }
    return props.target
}

function handleScroll() {
    if (!container) return
    const scrollTop = (container === window || !('scrollTop' in container))
        ? (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop)
        : (container as HTMLElement).scrollTop
    visible.value = scrollTop >= props.visibilityHeight
}

const { throttled: throttledScroll, cancel: cancelThrottle } = useThrottle(handleScroll, 100)

function handleClick(event: MouseEvent) {
    emit('click', event)
    scrollToTop()
}

function scrollToTop() {
    if (!container) return
    if (container instanceof Window) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    } else {
        container.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }
}

function bindContainer() {
    if (container) {
        container.removeEventListener('scroll', throttledScroll)
    }
    container = getScrollContainer()
    if (container) {
        container.addEventListener('scroll', throttledScroll, { passive: true })
        handleScroll()
    }
}

onMounted(() => {
    bindContainer()
})

watch(() => props.target, () => {
    bindContainer()
})

onBeforeUnmount(() => {
    if (container) {
        container.removeEventListener('scroll', throttledScroll)
    }
    cancelThrottle()
})
</script>

<template>
    <Transition
        enter-active-class="transition-all duration-200 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        leave-to-class="opacity-0 translate-y-4 scale-95"
    >
        <Button
            v-if="visible"
            :style="styles"
            :variant="props.variant"
            size="icon"
            :class="cn(
                positionClass,
                'z-[999]',
                props.variant === 'primary' && 'bg-brutal-yellow text-brutal-black font-black',
                props.class
            )"
            aria-label="Back to top"
            @click="handleClick"
        >
            <slot>
                <ArrowUp class="w-5 h-5 stroke-[3]" />
            </slot>
        </Button>
    </Transition>
</template>
