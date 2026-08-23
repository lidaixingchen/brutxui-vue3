<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import {
    cardWindowHeaderVariants,
    cardWindowHeaderButtonVariants,
    cardWindowHeaderLampVariants,
} from './card-window-header-variants'

export interface CardWindowHeaderProps {
    /** 窗口标题（以等宽大写工控排版呈现） */
    title: string
    /** 是否渲染右侧静态 ASCII 风格窗口控制符（仅在无交互模式且无 actions 插槽时生效），默认 true */
    showControls?: boolean
    /** 是否开启关闭按钮（交互模式），默认 false */
    closable?: boolean
    /** 是否开启最小化/折叠按钮（交互模式），默认 false */
    minimizable?: boolean
    /** 是否开启最大化/展开按钮（交互模式），默认 false */
    maximizable?: boolean
    /** 左侧三色指示灯是否可点击触发对应动作（红=close, 黄=minimize, 绿=maximize），默认 false */
    interactiveLamps?: boolean
    /** 关闭按钮无障碍标签（未提供时使用 locale 默认值） */
    closeAriaLabel?: string
    /** 最小化按钮无障碍标签 */
    minimizeAriaLabel?: string
    /** 最大化按钮无障碍标签 */
    maximizeAriaLabel?: string
    /** 自定义 CSS 类名 */
    class?: string
}

export interface CardWindowHeaderEmits {
    (e: 'close', event: MouseEvent | KeyboardEvent): void
    (e: 'minimize', event: MouseEvent | KeyboardEvent): void
    (e: 'maximize', event: MouseEvent | KeyboardEvent): void
}

const props = withDefaults(defineProps<CardWindowHeaderProps>(), {
    showControls: true,
    closable: false,
    minimizable: false,
    maximizable: false,
    interactiveLamps: false,
    closeAriaLabel: undefined,
    minimizeAriaLabel: undefined,
    maximizeAriaLabel: undefined,
    class: undefined,
})

const emit = defineEmits<CardWindowHeaderEmits>()
const slots = useSlots()
const { t } = useLocale()

const hasCustomActions = computed(() => Boolean(slots.actions))
const isInteractiveControls = computed(() => Boolean(props.closable || props.minimizable || props.maximizable))

const isCloseInteractive = computed(() => props.interactiveLamps && (props.closable || !isInteractiveControls.value))
const isMinimizeInteractive = computed(() => props.interactiveLamps && (props.minimizable || !isInteractiveControls.value))
const isMaximizeInteractive = computed(() => props.interactiveLamps && (props.maximizable || !isInteractiveControls.value))

const headerClasses = computed(() =>
    cn(cardWindowHeaderVariants(), props.class),
)

const defaultBtnClasses = computed(() =>
    cn(cardWindowHeaderButtonVariants({ action: 'default' })),
)

const closeBtnClasses = computed(() =>
    cn(cardWindowHeaderButtonVariants({ action: 'close' })),
)

const resolvedCloseAria = computed(() => props.closeAriaLabel?.trim() || t('cardWindowHeader.close'))
const resolvedMinimizeAria = computed(() => props.minimizeAriaLabel?.trim() || t('cardWindowHeader.minimize'))
const resolvedMaximizeAria = computed(() => props.maximizeAriaLabel?.trim() || t('cardWindowHeader.maximize'))

const lampCloseClass = computed(() =>
    cn(cardWindowHeaderLampVariants({ interactive: isCloseInteractive.value, color: 'close' })),
)
const lampMinimizeClass = computed(() =>
    cn(cardWindowHeaderLampVariants({ interactive: isMinimizeInteractive.value, color: 'minimize' })),
)
const lampMaximizeClass = computed(() =>
    cn(cardWindowHeaderLampVariants({ interactive: isMaximizeInteractive.value, color: 'maximize' })),
)

function onClose(event: MouseEvent | KeyboardEvent): void {
    emit('close', event)
}

function onMinimize(event: MouseEvent | KeyboardEvent): void {
    emit('minimize', event)
}

function onMaximize(event: MouseEvent | KeyboardEvent): void {
    emit('maximize', event)
}
</script>

<template>
    <div :class="headerClasses">
        <!-- 左侧三色指示灯区域 -->
        <span v-if="props.interactiveLamps" class="flex shrink-0 items-center gap-1.5">
            <button
                v-if="isCloseInteractive"
                type="button"
                :class="lampCloseClass"
                :aria-label="t('cardWindowHeader.lampClose')"
                @click="onClose"
            />
            <i v-else :class="lampCloseClass" aria-hidden="true" />

            <button
                v-if="isMinimizeInteractive"
                type="button"
                :class="lampMinimizeClass"
                :aria-label="t('cardWindowHeader.lampMinimize')"
                @click="onMinimize"
            />
            <i v-else :class="lampMinimizeClass" aria-hidden="true" />

            <button
                v-if="isMaximizeInteractive"
                type="button"
                :class="lampMaximizeClass"
                :aria-label="t('cardWindowHeader.lampMaximize')"
                @click="onMaximize"
            />
            <i v-else :class="lampMaximizeClass" aria-hidden="true" />
        </span>
        <span v-else class="flex shrink-0 items-center gap-1.5" aria-hidden="true">
            <i :class="lampCloseClass" />
            <i :class="lampMinimizeClass" />
            <i :class="lampMaximizeClass" />
        </span>

        <!-- 居中等宽大写标题 -->
        <span class="min-w-0 flex-1 truncate text-center font-mono text-xs font-bold uppercase tracking-widest text-brutal-fg">
            {{ props.title }}
        </span>

        <!-- 右侧控制符区域（插槽 > 交互模式 > 静态 ASCII > 空） -->
        <span v-if="hasCustomActions" class="shrink-0"><slot name="actions" /></span>
        <span v-else-if="isInteractiveControls" class="flex shrink-0 items-center gap-1">
            <button
                v-if="props.minimizable"
                type="button"
                :class="defaultBtnClasses"
                :aria-label="resolvedMinimizeAria"
                @click="onMinimize"
            >[ _ ]</button>
            <button
                v-if="props.maximizable"
                type="button"
                :class="defaultBtnClasses"
                :aria-label="resolvedMaximizeAria"
                @click="onMaximize"
            >[ □ ]</button>
            <button
                v-if="props.closable"
                type="button"
                :class="closeBtnClasses"
                :aria-label="resolvedCloseAria"
                @click="onClose"
            >[ X ]</button>
        </span>
        <span
            v-else-if="props.showControls"
            class="shrink-0 font-mono text-xs font-bold uppercase text-brutal-fg"
            aria-hidden="true"
        >[ _ ] [ X ]</span>
    </div>
</template>

