<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, type CSSProperties } from 'vue'
import { ArrowUp } from '@lucide/vue'
import { useThrottle } from '@/composables/useThrottle'
import { cn } from '@/lib/utils'
import { getWindow, getDocument, getMutationObserverCtor } from '@/lib/env'
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
let observer: MutationObserver | null = null

// target 模式下按钮 absolute 定位，相对最近的定位祖先（须把组件置于 position: relative 等已定位容器内，
// 否则相对初始包含块定位会错位）；无 target 监听 window 时 fixed 相对视口固定。
const positionClass = computed(() => (props.target ? 'absolute' : 'fixed'))

const styles = computed<CSSProperties>(() => ({
    right: `${props.right}px`,
    bottom: `${props.bottom}px`
}))

function getScrollContainer(): HTMLElement | Window | null {
    if (!props.target) return getWindow() ?? null
    if (typeof props.target === 'string') {
        const doc = getDocument()
        if (!doc) return null
        try {
            return doc.querySelector(props.target) as HTMLElement | null
        } catch {
            // 非法 CSS 选择器（如未闭合括号）会抛 DOMException，按未匹配处理回退为 null
            return null
        }
    }
    return props.target
}

function handleScroll() {
    if (!container) return
    const win = getWindow()
    const doc = getDocument()
    const scrollTop = (container === win || !('scrollTop' in container))
        ? (win?.scrollY || doc?.documentElement?.scrollTop || doc?.body?.scrollTop || 0)
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
    // Window 与 HTMLElement 的 scrollTo 均接受 ScrollToOptions，无需按实例分支
    container.scrollTo({ top: 0, behavior: 'smooth' })
}

function unbindContainer() {
    if (container) {
        container.removeEventListener('scroll', throttledScroll)
        container = null
    }
}

function stopObserving() {
    observer?.disconnect()
    observer = null
}

function observeDynamicTarget() {
    if (typeof props.target !== 'string') return
    const doc = getDocument()
    const MutationObserverCtor = getMutationObserverCtor()
    if (!doc?.body || !MutationObserverCtor) return
    // 选择器语法非法时不可能匹配到元素，无需开启监听
    try {
        doc.querySelector(props.target)
    } catch {
        return
    }
    stopObserving()
    observer = new MutationObserverCtor(() => {
        if (getScrollContainer()) {
            stopObserving()
            bindContainer()
        }
    })
    observer.observe(doc.body, { childList: true, subtree: true })
}

function bindContainer() {
    unbindContainer()
    container = getScrollContainer()
    if (container) {
        container.addEventListener('scroll', throttledScroll, { passive: true })
        handleScroll()
        stopObserving()
    } else {
        // 字符串选择器未匹配到元素（目标仍在动态渲染中）：重置显隐并监听 DOM，
        // 待元素出现后自动绑定滚动监听
        visible.value = false
        observeDynamicTarget()
    }
}

onMounted(() => {
    bindContainer()
})

watch(() => props.target, () => {
    bindContainer()
})

onBeforeUnmount(() => {
    unbindContainer()
    stopObserving()
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
