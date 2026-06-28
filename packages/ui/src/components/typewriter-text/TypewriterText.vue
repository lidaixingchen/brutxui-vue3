<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { useReducedMotion } from '../../composables/useReducedMotion'
import { typewriterTextVariants } from './typewriter-text-variants'

type TypewriterTextVariantProps = VariantProps<typeof typewriterTextVariants>

interface TypewriterTextProps {
    /** 要显示的文本 */
    text: string
    /** 打字速度（毫秒/字符） */
    speed?: number
    /** 开始延迟（毫秒） */
    delay?: number
    /** 是否循环播放 */
    loop?: boolean
    /** 是否显示光标 */
    cursor?: boolean
    /** 文本尺寸 */
    size?: NonNullable<TypewriterTextVariantProps['size']>
    /** 文本粗细 */
    weight?: NonNullable<TypewriterTextVariantProps['weight']>
    /** 自定义类名 */
    class?: string
}

const props = withDefaults(defineProps<TypewriterTextProps>(), {
    speed: 50,
    delay: 0,
    loop: false,
    cursor: true,
    size: 'default',
    weight: 'normal',
    class: undefined,
})

const emit = defineEmits<{
    complete: []
    start: []
}>()

const prefersReducedMotion = useReducedMotion()

const displayedText = ref('')
const currentIndex = ref(0)
const isTyping = ref(false)
let typeTimer: ReturnType<typeof setTimeout> | null = null
let startTimer: ReturnType<typeof setTimeout> | null = null

function clearAllTimers() {
    if (typeTimer) {
        clearTimeout(typeTimer)
        typeTimer = null
    }
    if (startTimer) {
        clearTimeout(startTimer)
        startTimer = null
    }
}

function reset() {
    clearAllTimers()
    displayedText.value = ''
    currentIndex.value = 0
    isTyping.value = false
}

function typeNextChar() {
    if (currentIndex.value < props.text.length) {
        displayedText.value += props.text[currentIndex.value]
        currentIndex.value++
        typeTimer = setTimeout(typeNextChar, props.speed)
    } else {
        isTyping.value = false
        emit('complete')
        if (props.loop) {
            typeTimer = setTimeout(() => {
                reset()
                startTyping()
            }, props.delay)
        }
    }
}

function startTyping() {
    if (prefersReducedMotion.value) {
        // 如果用户偏好减少动画，直接显示完整文本
        isTyping.value = true
        emit('start')
        displayedText.value = props.text
        currentIndex.value = props.text.length
        isTyping.value = false
        emit('complete')
        return
    }

    isTyping.value = true
    emit('start')
    typeNextChar()
}

function init() {
    reset()
    if (props.delay > 0) {
        startTimer = setTimeout(startTyping, props.delay)
    } else {
        startTyping()
    }
}

// 监听 text 变化重新开始
watch(() => props.text, () => {
    init()
})

onMounted(() => {
    if (props.text) {
        init()
    }
})

onUnmounted(() => {
    clearAllTimers()
})

const classes = computed(() =>
    cn(typewriterTextVariants({ size: props.size, weight: props.weight }), props.class)
)

// 光标高度映射表，提升可读性
const cursorHeightMap: Record<string, string> = {
    sm: 'h-3',
    default: 'h-4',
    lg: 'h-5',
    xl: 'h-6',
    '2xl': 'h-7',
}

const cursorClasses = computed(() =>
    cn(
        'inline-block w-[2px] ml-0.5 animate-blink',
        'bg-brutal-fg',
        cursorHeightMap[props.size] ?? 'h-4'
    )
)
</script>

<template>
    <span :class="classes" aria-live="off">
        <span>{{ displayedText }}</span>
        <span
            v-if="cursor && (isTyping || displayedText.length < text.length)"
            :class="cursorClasses"
            aria-hidden="true"
        />
    </span>
</template>

<style scoped>
@keyframes blink {
    0%, 50% {
        opacity: 1;
    }
    51%, 100% {
        opacity: 0;
    }
}

.animate-blink {
    animation: blink 1s infinite;
}
</style>
