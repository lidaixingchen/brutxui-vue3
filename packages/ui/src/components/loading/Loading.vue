<script setup lang="ts">
import { computed } from 'vue'
import Spinner from '../spinner/Spinner.vue'
import Skeleton from '../skeleton/Skeleton.vue'
import Progress from '../progress/Progress.vue'
import { cn } from '@/lib/utils'

interface LoadingProps {
    loading?: boolean
    text?: string
    background?: string
    customClass?: string
    page?: boolean
    fullscreen?: boolean
    title?: string
    description?: string
    progress?: number
    class?: string
}

const props = withDefaults(defineProps<LoadingProps>(), {
    loading: false,
    text: undefined,
    background: undefined,
    customClass: undefined,
    page: false,
    fullscreen: false,
    title: undefined,
    description: undefined,
    progress: undefined,
    class: undefined,
})

const maskStyles = computed(() => {
    if (props.background) {
        return { backgroundColor: props.background }
    }
    return {}
})

// page：文档流内占满视口高度的页面级加载；
// fullscreen：fixed 定位真正铺满视口并提升层级，嵌套在普通容器中也能覆盖全屏
const isPageMode = computed(() => props.page || props.fullscreen)
const isFullscreen = computed(() => props.fullscreen)
const pageRootClasses = computed(() => {
    if (isFullscreen.value) {
        return cn('fixed inset-0 z-loading flex items-center-safe justify-center bg-brutal-bg p-4 overflow-y-auto', props.class)
    }
    return cn('min-h-screen flex items-center justify-center bg-brutal-bg p-4', props.class)
})
// 局部模式容器提供默认最小高度，保证 loading=false 时无内容也有可感知的遮罩区域
const localRootClasses = computed(() => cn('relative grid min-h-24 grid-cols-1', props.class))
// null/undefined 均视为无进度；取值在组件边界 clamp 到 0-100
const hasProgress = computed(() => props.progress != null)
const clampedProgress = computed(() =>
    props.progress != null ? Math.min(Math.max(props.progress, 0), 100) : undefined
)
const maskClasses = computed(() =>
    cn(
        'col-start-1 row-start-1 z-loading flex min-w-0 flex-col items-center justify-center bg-brutal-bg/80 p-3 text-center select-none',
        props.customClass
    )
)
</script>

<template>
    <div v-if="isPageMode && loading" :class="pageRootClasses">
        <div class="w-full max-w-lg text-center relative">
            <slot name="header" />

            <div class="relative border-3 border-brutal bg-brutal-bg shadow-brutal p-8 sm:p-12">
                <Skeleton variant="accent" class="absolute -top-3 -left-3 h-6 w-24" />
                <Skeleton variant="secondary" class="absolute -bottom-3 -right-3 h-6 w-32" />

                <div class="flex justify-center mb-6">
                    <Spinner size="lg" variant="primary" />
                </div>

                <h1 v-if="title || text" class="text-2xl sm:text-3xl font-black tracking-tight text-brutal-fg wrap-anywhere">
                    {{ title ?? text }}
                </h1>

                <p v-if="description" class="mt-3 text-brutal-muted-foreground font-medium wrap-anywhere">
                    {{ description }}
                </p>

                <slot />

                <div v-if="hasProgress" class="mt-6">
                    <Progress :model-value="clampedProgress" />
                </div>

                <slot name="footer" />
            </div>
        </div>
    </div>

    <div v-else-if="!isPageMode" :class="localRootClasses">
        <div class="col-start-1 row-start-1 min-w-0"><slot /></div>

        <Transition
            enter-active-class="transition-opacity duration-150 ease-out"
            leave-active-class="transition-opacity duration-150 ease-in"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
        >
            <div
                v-if="loading"
                :class="maskClasses"
                :style="maskStyles"
            >
                <div class="flex max-w-full flex-col items-center gap-3">
                    <Spinner size="lg" variant="default" />
                    <span 
                        v-if="text" 
                        class="max-w-full text-sm font-black uppercase tracking-wider bg-brutal-status-warning text-brutal-status-warning-foreground px-2 py-0.5 border border-brutal shadow-brutal-sm wrap-anywhere"
                    >
                        {{ text }}
                    </span>
                </div>
            </div>
        </Transition>
    </div>
</template>
